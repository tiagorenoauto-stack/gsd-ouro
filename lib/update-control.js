#!/usr/bin/env node

/**
 * GSD Ouro — Update Control v0.7
 * Controle de atualizacoes com changelog e historico
 *
 * Storage: .ouro/updates/changelog.json
 */

'use strict';

const fs = require('fs');
const path = require('path');

const OURO_DIR = path.join(process.cwd(), '.ouro');
const UPDATES_DIR = path.join(OURO_DIR, 'updates');
const CHANGELOG_FILE = path.join(UPDATES_DIR, 'changelog.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadChangelog() {
  try {
    return JSON.parse(fs.readFileSync(CHANGELOG_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveChangelog(entries) {
  ensureDir(UPDATES_DIR);
  fs.writeFileSync(CHANGELOG_FILE, JSON.stringify(entries, null, 2));
}

// ── Log Update ──

function logUpdate(data) {
  const entry = {
    version: data.version || '0.0.0',
    date: data.date || new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    type: data.type || 'update', // release, hotfix, patch, update
    description: data.description || '',
    files_changed: data.files || [],
    files_added: data.added || [],
    breaking: data.breaking || false,
    highlights: data.highlights || []
  };

  const changelog = loadChangelog();
  changelog.unshift(entry); // newest first
  saveChangelog(changelog);

  return entry;
}

// ── Query ──

function getUpdateHistory(limit) {
  const changelog = loadChangelog();
  return limit ? changelog.slice(0, limit) : changelog;
}

function getChangelog(fromVersion, toVersion) {
  const changelog = loadChangelog();

  return changelog.filter(entry => {
    if (fromVersion && compareVersions(entry.version, fromVersion) <= 0) return false;
    if (toVersion && compareVersions(entry.version, toVersion) > 0) return false;
    return true;
  });
}

function getLatestVersion() {
  const changelog = loadChangelog();
  if (changelog.length === 0) return '0.0.0';
  return changelog[0].version;
}

function getVersionEntry(version) {
  const changelog = loadChangelog();
  return changelog.find(e => e.version === version) || null;
}

// ── Version Comparison ──

function compareVersions(a, b) {
  const pa = (a || '0.0.0').split('.').map(Number);
  const pb = (b || '0.0.0').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

// ── Summary ──

function generateSummary() {
  const changelog = loadChangelog();
  if (changelog.length === 0) return { total: 0, latest: null, versions: [] };

  const versions = [...new Set(changelog.map(e => e.version))];

  return {
    total: changelog.length,
    latest: changelog[0],
    versions,
    byType: changelog.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {}),
    hasBreaking: changelog.some(e => e.breaking)
  };
}

// ── Exports ──

module.exports = {
  logUpdate,
  getUpdateHistory,
  getChangelog,
  getLatestVersion,
  getVersionEntry,
  compareVersions,
  generateSummary,
  loadChangelog
};
