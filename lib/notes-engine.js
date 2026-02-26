#!/usr/bin/env node

/**
 * GSD Ouro — Notes Engine v0.7
 * Bloco de notas inteligente com auto-tag e interpretacao
 *
 * Storage: .ouro/notes/index.json + notas individuais
 */

'use strict';

const fs = require('fs');
const path = require('path');

const OURO_DIR = path.join(process.cwd(), '.ouro');
const NOTES_DIR = path.join(OURO_DIR, 'notes');
const INDEX_FILE = path.join(NOTES_DIR, 'index.json');

// ── Auto-Tagging ──

const TAG_PATTERNS = [
  { tag: 'bug', keywords: ['bug', 'erro', 'fix', 'corrigir', 'quebrou', 'problema'] },
  { tag: 'feature', keywords: ['feature', 'criar', 'novo', 'adicionar', 'implementar', 'funcionalidade'] },
  { tag: 'ui', keywords: ['botao', 'layout', 'design', 'estilo', 'cor', 'visual', 'responsivo', 'dark'] },
  { tag: 'refactor', keywords: ['refatorar', 'limpar', 'reorganizar', 'melhorar', 'otimizar'] },
  { tag: 'docs', keywords: ['documentar', 'doc', 'readme', 'explicar', 'guia'] },
  { tag: 'performance', keywords: ['rapido', 'lento', 'performance', 'otimizar', 'cache', 'memoria'] },
  { tag: 'security', keywords: ['seguranca', 'auth', 'login', 'senha', 'permissao', 'token'] },
  { tag: 'deploy', keywords: ['deploy', 'producao', 'build', 'release', 'publicar'] },
  { tag: 'test', keywords: ['teste', 'test', 'spec', 'coverage', 'validar'] },
  { tag: 'idea', keywords: ['ideia', 'talvez', 'pensar', 'considerar', 'futuro', 'possivel'] }
];

const MODULE_PATTERNS = ['auth', 'user', 'admin', 'dashboard', 'financeiro', 'relatorio',
  'header', 'sidebar', 'nav', 'home', 'config', 'settings', 'perfil', 'imovel',
  'veiculo', 'conta', 'pagamento', 'cadastro', 'form', 'lista'];

const PRIORITY_KEYWORDS = {
  high: ['urgente', 'critico', 'importante', 'agora', 'prioridade', 'bloqueia'],
  medium: ['depois', 'quando puder', 'seria bom', 'melhorar'],
  low: ['talvez', 'ideia', 'futuro', 'possivel', 'considerar']
};

function autoDetectTags(text) {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tags = [];

  for (const pattern of TAG_PATTERNS) {
    for (const kw of pattern.keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(kwNorm)) {
        if (!tags.includes(pattern.tag)) tags.push(pattern.tag);
        break;
      }
    }
  }

  return tags.length > 0 ? tags : ['geral'];
}

function autoDetectModule(text) {
  const lower = text.toLowerCase();
  for (const mod of MODULE_PATTERNS) {
    if (lower.includes(mod)) return mod;
  }
  return null;
}

function autoDetectPriority(text) {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [level, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    for (const kw of keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(kwNorm)) return level;
    }
  }
  return 'medium';
}

// ── CRUD ──

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadIndex() {
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveIndex(index) {
  ensureDir(NOTES_DIR);
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function addNote(text, manualTags, manualModule, manualPriority) {
  const id = generateId();
  const tags = manualTags || autoDetectTags(text);
  const module = manualModule || autoDetectModule(text);
  const priority = manualPriority || autoDetectPriority(text);

  const note = {
    id,
    text,
    tags,
    module,
    priority,
    status: 'open',
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };

  const index = loadIndex();
  index.push(note);
  saveIndex(index);

  return note;
}

function updateNote(id, updates) {
  const index = loadIndex();
  const i = index.findIndex(n => n.id === id);
  if (i === -1) return null;

  index[i] = { ...index[i], ...updates, updated: new Date().toISOString() };
  saveIndex(index);
  return index[i];
}

function deleteNote(id) {
  const index = loadIndex();
  const filtered = index.filter(n => n.id !== id);
  if (filtered.length === index.length) return false;
  saveIndex(filtered);
  return true;
}

function getNote(id) {
  const index = loadIndex();
  return index.find(n => n.id === id) || null;
}

function listNotes(filters) {
  let notes = loadIndex();

  if (filters) {
    if (filters.tag) notes = notes.filter(n => n.tags.includes(filters.tag));
    if (filters.module) notes = notes.filter(n => n.module === filters.module);
    if (filters.status) notes = notes.filter(n => n.status === filters.status);
    if (filters.priority) notes = notes.filter(n => n.priority === filters.priority);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      notes = notes.filter(n => n.text.toLowerCase().includes(s));
    }
  }

  // Sort: high priority first, then by date (newest first)
  const prioOrder = { high: 0, medium: 1, low: 2 };
  notes.sort((a, b) => {
    const pd = (prioOrder[a.priority] || 1) - (prioOrder[b.priority] || 1);
    if (pd !== 0) return pd;
    return (b.created || '').localeCompare(a.created || '');
  });

  return notes;
}

// ── Interpretation ──

function interpretNote(note) {
  const tags = note.tags || [];
  const actions = [];

  if (tags.includes('bug')) {
    actions.push({ type: 'debug', suggestion: 'Usar /ouro:debug para investigar' });
  }
  if (tags.includes('feature')) {
    actions.push({ type: 'plan', suggestion: 'Considerar incluir na proxima fase do ROADMAP' });
  }
  if (tags.includes('refactor')) {
    actions.push({ type: 'refactor', suggestion: 'Agrupar com outros refactors para eficiencia' });
  }
  if (tags.includes('idea')) {
    actions.push({ type: 'park', suggestion: 'Manter em backlog, revisar no proximo planejamento' });
  }
  if (note.priority === 'high') {
    actions.push({ type: 'urgent', suggestion: 'Priorizar na fase atual se possivel' });
  }

  return {
    note,
    suggestedActions: actions.length > 0 ? actions : [{ type: 'review', suggestion: 'Revisar no proximo planejamento' }]
  };
}

// ── Stats ──

function getStats() {
  const notes = loadIndex();
  const byTag = {};
  const byPriority = { high: 0, medium: 0, low: 0 };
  const byStatus = { open: 0, done: 0, deferred: 0 };

  for (const n of notes) {
    for (const t of (n.tags || [])) {
      byTag[t] = (byTag[t] || 0) + 1;
    }
    byPriority[n.priority || 'medium']++;
    byStatus[n.status || 'open']++;
  }

  return { total: notes.length, byTag, byPriority, byStatus };
}

// ── Exports ──

module.exports = {
  addNote,
  updateNote,
  deleteNote,
  getNote,
  listNotes,
  interpretNote,
  getStats,
  autoDetectTags,
  autoDetectModule,
  autoDetectPriority,
  loadIndex
};
