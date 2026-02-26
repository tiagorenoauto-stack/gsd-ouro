#!/usr/bin/env node

/**
 * GSD Ouro — Intelligence Orchestrator (v0.5)
 * Combina error-kb + tips-engine em health score e relatórios.
 */

const fs = require('fs');
const path = require('path');
const errorKB = require('./error-kb');
const tipsEngine = require('./tips-engine');

// ==================== UTILS ====================

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function fileStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function daysSince(dateStr) {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// ==================== HEALTH SCORE ====================

function getHealthScore(ouroDir) {
  const subscores = {};

  // 1. Velocity (25%) — tasks completed per session
  const sessoesDir = path.join(ouroDir, 'analytics', 'sessoes');
  let velocity = 50; // default
  if (fs.existsSync(sessoesDir)) {
    const files = fs.readdirSync(sessoesDir).filter(f => f.endsWith('.json'));
    const sessions = files.map(f => readJSON(path.join(sessoesDir, f))).filter(Boolean);
    const withTasks = sessions.filter(s => s.tarefas && s.tarefas.total > 0);
    if (withTasks.length > 0) {
      const avgCompleted = withTasks.reduce((s, x) => s + (x.tarefas.concluidas || 0), 0) / withTasks.length;
      velocity = Math.min(100, Math.round(avgCompleted / 5 * 100)); // target: 5 tasks/session
    }
  }
  subscores.velocity = {
    score: velocity,
    weight: 0.25,
    label: 'Velocidade',
    detail: `${velocity}/100 (meta: 5 tarefas/sessao)`,
  };

  // 2. Quality (25%) — conformidade + prompt scores
  let quality = 50;
  const dashboard = readJSON(path.join(ouroDir, 'analytics', 'dashboard.json'));
  const conformidade = dashboard ? (dashboard.conformidade || 0) : 0;
  const historico = readJSON(path.join(ouroDir, 'analytics', 'prompts', 'historico.json'));
  let promptAvg = 50;
  if (historico && historico.length > 0) {
    const scored = historico.filter(p => p.score > 0);
    if (scored.length > 0) {
      promptAvg = Math.round(scored.reduce((s, p) => s + p.score, 0) / scored.length);
    }
  }
  quality = Math.round((conformidade * 0.6 + promptAvg * 0.4));
  subscores.quality = {
    score: quality,
    weight: 0.25,
    label: 'Qualidade',
    detail: `Conformidade: ${conformidade}%, Prompts: ${promptAvg}/100`,
  };

  // 3. Stability (20%) — error rate
  let stability = 100;
  const errorLog = errorKB.getErrorLog(ouroDir);
  if (errorLog.length > 0) {
    const unresolved = errorLog.filter(e => e.status !== 'resolved').length;
    stability = Math.max(0, 100 - (unresolved * 10));
  }
  subscores.stability = {
    score: stability,
    weight: 0.20,
    label: 'Estabilidade',
    detail: `${errorLog.length} erros, ${errorLog.filter(e => e.status === 'resolved').length} resolvidos`,
  };

  // 4. Consistency (15%) — streak + activity
  let consistency = 50;
  if (fs.existsSync(sessoesDir)) {
    const files = fs.readdirSync(sessoesDir).filter(f => f.endsWith('.json'));
    const sessions = files.map(f => readJSON(path.join(sessoesDir, f))).filter(Boolean);
    const uniqueDays = [...new Set(sessions.map(s => (s.timestamp || '').slice(0, 10)))].sort();

    // Calculate streak
    let streak = 0;
    for (let i = uniqueDays.length - 1; i >= 0; i--) {
      const diff = daysSince(uniqueDays[i]);
      if (diff <= (uniqueDays.length - 1 - i) + 1) streak++;
      else break;
    }
    consistency = Math.min(100, Math.round((streak / 7) * 100));
  }
  subscores.consistency = {
    score: consistency,
    weight: 0.15,
    label: 'Consistencia',
    detail: `Score de regularidade`,
  };

  // 5. Organization (15%) — .ouro files freshness + prevention rules
  let organization = 0;
  const checkFiles = ['PROJECT.md', 'STATE.md', 'KIT_OURO.md', 'ROADMAP.md'];
  let fileScore = 0;
  for (const name of checkFiles) {
    const stat = fileStat(path.join(ouroDir, name));
    if (stat) {
      const days = daysSince(stat.mtime.toISOString());
      if (days <= 1) fileScore += 25;
      else if (days <= 3) fileScore += 20;
      else if (days <= 7) fileScore += 10;
      else fileScore += 5;
    }
  }
  const preventionRules = errorKB.getPreventionRules(ouroDir);
  const prevBonus = Math.min(20, preventionRules.length * 5);
  organization = Math.min(100, fileScore + prevBonus);
  subscores.organization = {
    score: organization,
    weight: 0.15,
    label: 'Organizacao',
    detail: `Arquivos: ${fileScore}/100, Prevencao: ${prevBonus}/20`,
  };

  // Calculate total
  const total = Math.round(
    subscores.velocity.score * subscores.velocity.weight +
    subscores.quality.score * subscores.quality.weight +
    subscores.stability.score * subscores.stability.weight +
    subscores.consistency.score * subscores.consistency.weight +
    subscores.organization.score * subscores.organization.weight
  );

  // Grade
  let grade;
  if (total >= 90) grade = 'S';
  else if (total >= 80) grade = 'A';
  else if (total >= 70) grade = 'B';
  else if (total >= 55) grade = 'C';
  else if (total >= 40) grade = 'D';
  else grade = 'F';

  // Trend
  const trend = determineTrend(ouroDir);

  return { total, grade, subscores, trend };
}

// ==================== TRENDS ====================

function determineTrend(ouroDir) {
  const sessoesDir = path.join(ouroDir, 'analytics', 'sessoes');
  if (!fs.existsSync(sessoesDir)) return 'stable';

  const files = fs.readdirSync(sessoesDir).filter(f => f.endsWith('.json'));
  const sessions = files
    .map(f => readJSON(path.join(sessoesDir, f)))
    .filter(Boolean)
    .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));

  if (sessions.length < 4) return 'stable';

  const mid = Math.floor(sessions.length / 2);
  const older = sessions.slice(0, mid);
  const recent = sessions.slice(mid);

  const olderTasks = older.reduce((s, x) => s + ((x.tarefas && x.tarefas.concluidas) || 0), 0);
  const recentTasks = recent.reduce((s, x) => s + ((x.tarefas && x.tarefas.concluidas) || 0), 0);

  const olderAvg = olderTasks / older.length;
  const recentAvg = recentTasks / recent.length;

  if (recentAvg > olderAvg * 1.15) return 'improving';
  if (recentAvg < olderAvg * 0.85) return 'declining';
  return 'stable';
}

function getTrends(ouroDir) {
  const categories = [];

  // Velocity trend
  categories.push({
    category: 'Velocidade',
    direction: determineTrend(ouroDir),
  });

  // Error trend
  const errorLog = errorKB.getErrorLog(ouroDir);
  if (errorLog.length >= 4) {
    const mid = Math.floor(errorLog.length / 2);
    const olderErrors = errorLog.slice(0, mid).length;
    const recentErrors = errorLog.slice(mid).length;
    const recentResolved = errorLog.slice(mid).filter(e => e.status === 'resolved').length;
    categories.push({
      category: 'Erros',
      direction: recentResolved > recentErrors * 0.7 ? 'improving' : 'declining',
      delta: `${recentErrors} recentes, ${recentResolved} resolvidos`,
    });
  }

  // Quality trend
  const historico = readJSON(path.join(ouroDir, 'analytics', 'prompts', 'historico.json'));
  if (historico && historico.length >= 4) {
    const mid = Math.floor(historico.length / 2);
    const olderScores = historico.slice(0, mid).filter(p => p.score > 0);
    const recentScores = historico.slice(mid).filter(p => p.score > 0);
    if (olderScores.length > 0 && recentScores.length > 0) {
      const olderAvg = olderScores.reduce((s, p) => s + p.score, 0) / olderScores.length;
      const recentAvg = recentScores.reduce((s, p) => s + p.score, 0) / recentScores.length;
      categories.push({
        category: 'Qualidade Prompts',
        direction: recentAvg > olderAvg * 1.05 ? 'improving' : recentAvg < olderAvg * 0.95 ? 'declining' : 'stable',
        delta: `${Math.round(olderAvg)} → ${Math.round(recentAvg)}`,
      });
    }
  }

  return categories;
}

// ==================== INTELLIGENCE REPORT ====================

function getIntelligenceReport(ouroDir) {
  const health = getHealthScore(ouroDir);
  const tips = tipsEngine.generateTips(ouroDir);
  const errorStats = errorKB.getErrorStats(ouroDir);
  const preventionRules = errorKB.getPreventionRules(ouroDir);
  const trends = getTrends(ouroDir);

  return {
    health,
    tips: tips.slice(0, 10),
    tipsByCategory: {
      Performance: tipsEngine.getTipsByCategory(tips, 'Performance'),
      Quality: tipsEngine.getTipsByCategory(tips, 'Quality'),
      Organization: tipsEngine.getTipsByCategory(tips, 'Organization'),
      Prevention: tipsEngine.getTipsByCategory(tips, 'Prevention'),
      Economy: tipsEngine.getTipsByCategory(tips, 'Economy'),
    },
    errors: errorStats,
    prevention: {
      total_rules: preventionRules.length,
      rules: preventionRules,
    },
    trends,
    timestamp: new Date().toISOString(),
  };
}

// ==================== EXPORTS ====================

module.exports = {
  getHealthScore,
  getIntelligenceReport,
  getTrends,
  determineTrend,
};
