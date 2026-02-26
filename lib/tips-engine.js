#!/usr/bin/env node

/**
 * GSD Ouro — Tips Engine (v0.5)
 * Motor de dicas contextuais baseado em análise de dados do projeto.
 */

const fs = require('fs');
const path = require('path');

// ==================== UTILS ====================

function findOuroDir(startDir) {
  let dir = startDir || process.cwd();
  for (let i = 0; i < 20; i++) {
    const ouroPath = path.join(dir, '.ouro');
    if (fs.existsSync(ouroPath)) return ouroPath;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

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
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function fileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

// ==================== TIP BUILDER ====================

let tipCounter = 0;

function tip(categoria, prioridade, impacto, mensagem, detalhe, acao, fonte) {
  tipCounter++;
  return {
    id: 'tip_' + String(tipCounter).padStart(3, '0'),
    categoria,
    prioridade,
    impacto,
    mensagem,
    detalhe: detalhe || '',
    acao: acao || '',
    fonte: fonte || 'system',
  };
}

// ==================== ANALYZERS ====================

function analyzeSessions(ouroDir) {
  const tips = [];
  const sessoesDir = path.join(ouroDir, 'analytics', 'sessoes');

  if (!fs.existsSync(sessoesDir)) return tips;

  const files = fs.readdirSync(sessoesDir).filter(f => f.endsWith('.json'));
  if (!files.length) {
    tips.push(tip('Performance', 'medium', 50,
      'Nenhuma sessao registrada ainda.',
      'O sistema de analytics nao tem sessoes gravadas.',
      'Inicie uma sessao com /ouro:status para comecar a coletar dados.',
      'sessions'));
    return tips;
  }

  const sessions = files
    .map(f => readJSON(path.join(sessoesDir, f)))
    .filter(Boolean)
    .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));

  if (!sessions.length) return tips;

  // Session duration analysis
  const finalized = sessions.filter(s => s.duracao_segundos > 0);
  if (finalized.length >= 2) {
    const avgDuration = finalized.reduce((s, x) => s + x.duracao_segundos, 0) / finalized.length;
    if (avgDuration > 14400) { // > 4 hours
      tips.push(tip('Performance', 'high', 75,
        'Sessoes muito longas podem reduzir foco e produtividade.',
        `Duracao media: ${Math.round(avgDuration / 3600 * 10) / 10}h.`,
        'Tente sessoes de 2h com pausas de 15min.',
        'sessions'));
    }
  }

  // Task completion rate
  const withTasks = sessions.filter(s => s.tarefas && s.tarefas.total > 0);
  if (withTasks.length >= 2) {
    const totalTasks = withTasks.reduce((s, x) => s + x.tarefas.total, 0);
    const failedTasks = withTasks.reduce((s, x) => s + (x.tarefas.falhadas || 0), 0);
    const failRate = failedTasks / totalTasks;
    if (failRate > 0.2) {
      tips.push(tip('Quality', 'high', 80,
        `Taxa de falha alta: ${Math.round(failRate * 100)}% das tarefas falharam.`,
        `${failedTasks} falhas em ${totalTasks} tarefas.`,
        'Revise a abordagem: divida tarefas grandes em menores.',
        'sessions'));
    }
  }

  // Productivity trend (last 3 vs previous 3)
  if (withTasks.length >= 6) {
    const recent = withTasks.slice(-3);
    const older = withTasks.slice(-6, -3);
    const recentRate = recent.reduce((s, x) => s + x.tarefas.concluidas, 0) / recent.length;
    const olderRate = older.reduce((s, x) => s + x.tarefas.concluidas, 0) / older.length;
    if (recentRate < olderRate * 0.6) {
      tips.push(tip('Performance', 'high', 85,
        `Velocidade caiu ${Math.round((1 - recentRate / olderRate) * 100)}% nas ultimas sessoes.`,
        `Media anterior: ${olderRate.toFixed(1)} tarefas/sessao. Recente: ${recentRate.toFixed(1)}.`,
        'Identifique bloqueios. Considere sessoes mais curtas e focadas.',
        'sessions'));
    }
  }

  // Inactivity
  const lastSession = sessions[sessions.length - 1];
  const lastDate = lastSession.fim || lastSession.timestamp;
  const inactiveDays = daysSince(lastDate);
  if (inactiveDays > 3) {
    tips.push(tip('Performance', 'medium', 60,
      `Sem atividade ha ${inactiveDays} dias.`,
      `Ultima sessao: ${lastDate ? lastDate.slice(0, 10) : 'desconhecida'}.`,
      'Retome com /ouro:status para ver o estado atual.',
      'sessions'));
  }

  // Streak
  const uniqueDays = [...new Set(sessions.map(s => (s.timestamp || '').slice(0, 10)))].sort();
  let streak = 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  for (let i = uniqueDays.length - 1; i >= 0; i--) {
    const expected = new Date(Date.now() - (uniqueDays.length - 1 - i) * 86400000).toISOString().slice(0, 10);
    if (uniqueDays[i] === expected) streak++;
    else break;
  }
  if (streak >= 5) {
    tips.push(tip('Performance', 'low', 30,
      `Streak de ${streak} dias consecutivos! Continue assim.`,
      '', '', 'sessions'));
  }

  return tips;
}

function analyzePrompts(ouroDir) {
  const tips = [];
  const historico = readJSON(path.join(ouroDir, 'analytics', 'prompts', 'historico.json'));
  if (!historico || !historico.length) return tips;

  // Average score
  const withScore = historico.filter(p => p.score > 0);
  if (withScore.length >= 3) {
    const avgScore = withScore.reduce((s, p) => s + p.score, 0) / withScore.length;
    if (avgScore < 60) {
      tips.push(tip('Quality', 'high', 80,
        `Score medio de prompts baixo: ${Math.round(avgScore)}/100.`,
        `${withScore.length} prompts analisados.`,
        'Use /ouro:prompt com --otimizar para gerar prompts melhores.',
        'prompts'));
    }
  }

  // Type diversity
  const types = {};
  for (const p of historico) {
    const t = p.tipo || 'outro';
    types[t] = (types[t] || 0) + 1;
  }
  const typeEntries = Object.entries(types).sort((a, b) => b[1] - a[1]);
  if (typeEntries.length >= 1 && historico.length >= 5) {
    const dominant = typeEntries[0];
    const pct = Math.round((dominant[1] / historico.length) * 100);
    if (pct > 80) {
      tips.push(tip('Organization', 'low', 35,
        `${pct}% dos prompts sao do tipo "${dominant[0]}".`,
        'Pouca diversidade de tipos de tarefa.',
        'Experimente outros tipos: debug, testes, refactor, documentacao.',
        'prompts'));
    }
  }

  // Top prompts usage
  const topPrompts = readJSON(path.join(ouroDir, '..', 'prompt-engine', 'library', 'top_prompts.json'));
  if (topPrompts && historico.length > 20) {
    const highScore = historico.filter(p => (p.score || 0) >= 80);
    if (highScore.length === 0) {
      tips.push(tip('Quality', 'medium', 55,
        'Nenhum prompt atingiu score A/S (>= 80).',
        `${historico.length} prompts gerados, nenhum excelente.`,
        'Tente o modo guiado: ouro-prompt guided --tipo codigo',
        'prompts'));
    }
  }

  return tips;
}

function analyzeErrors(ouroDir) {
  const tips = [];
  const errorLog = readJSON(path.join(ouroDir, 'errors', 'error-log.json'));
  if (!errorLog || !errorLog.length) return tips;

  const patterns = readJSON(path.join(ouroDir, 'errors', 'patterns.json')) || [];
  const prevention = readJSON(path.join(ouroDir, 'errors', 'prevention.json')) || [];

  // Recurring patterns
  const recurring = patterns.filter(p => p.ocorrencias >= 3);
  for (const p of recurring) {
    tips.push(tip('Prevention', 'high', 85,
      `Erro recorrente (${p.ocorrencias}x): "${p.nome.slice(0, 40)}".`,
      p.solucao_padrao ? `Solucao conhecida: ${p.solucao_padrao.slice(0, 80)}` : 'Sem solucao padrao definida.',
      'Crie uma regra de prevencao: ouro-intel prevent add "trigger" --regra "..."',
      'errors'));
  }

  // Unresolved errors
  const unresolved = errorLog.filter(e => e.status !== 'resolved');
  if (unresolved.length > 5) {
    tips.push(tip('Quality', 'high', 75,
      `${unresolved.length} erros sem solucao registrada.`,
      'Erros sem solucao nao contribuem para o aprendizado.',
      'Resolva e atualize: ouro-intel error resolve <id> --solucao "..."',
      'errors'));
  }

  // Dominant category
  const cats = {};
  for (const e of errorLog) {
    cats[e.categoria] = (cats[e.categoria] || 0) + 1;
  }
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0 && errorLog.length >= 5) {
    const [topCat, count] = sorted[0];
    const pct = Math.round((count / errorLog.length) * 100);
    if (pct > 60) {
      tips.push(tip('Prevention', 'medium', 65,
        `${pct}% dos erros sao do tipo "${topCat}".`,
        `${count} de ${errorLog.length} erros totais.`,
        `Foque em prevencao de erros "${topCat}".`,
        'errors'));
    }
  }

  // No prevention rules
  if (prevention.length === 0 && errorLog.length >= 3) {
    tips.push(tip('Prevention', 'high', 80,
      'Sem regras de prevencao ativas.',
      `${errorLog.length} erros registrados mas nenhuma regra criada.`,
      'Use: ouro-intel prevent add "trigger" --regra "descricao" --severidade high',
      'errors'));
  }

  return tips;
}

function analyzeFiles(ouroDir) {
  const tips = [];

  const checkFiles = [
    { name: 'PROJECT.md', label: 'PROJECT.md', minSize: 100 },
    { name: 'STATE.md', label: 'STATE.md', minSize: 50 },
    { name: 'KIT_OURO.md', label: 'KIT_OURO.md', minSize: 200 },
    { name: 'ROADMAP.md', label: 'ROADMAP.md', minSize: 100 },
    { name: 'active_context.md', label: 'active_context.md', minSize: 50 },
  ];

  for (const file of checkFiles) {
    const fp = path.join(ouroDir, file.name);
    const stat = fileStat(fp);
    if (!stat) {
      tips.push(tip('Organization', 'medium', 50,
        `${file.label} nao encontrado.`,
        'Arquivo de contexto importante esta faltando.',
        `Crie ${file.label} na pasta .ouro/`,
        'files'));
      continue;
    }

    // Freshness check
    const days = daysSince(stat.mtime.toISOString());
    if (days > 7) {
      tips.push(tip('Organization', 'medium', 45,
        `${file.label} desatualizado (${days} dias sem alteracao).`,
        `Ultima modificacao: ${stat.mtime.toISOString().slice(0, 10)}.`,
        `Revise e atualize ${file.label}.`,
        'files'));
    }

    // Size check
    const content = fileContent(fp);
    if (content.length < file.minSize) {
      tips.push(tip('Organization', 'low', 35,
        `${file.label} esta muito curto (${content.length} caracteres).`,
        `Minimo recomendado: ${file.minSize} caracteres.`,
        `Adicione mais contexto a ${file.label}.`,
        'files'));
    }
  }

  return tips;
}

function analyzePhases(ouroDir) {
  const tips = [];
  const fasesDir = path.join(ouroDir, 'analytics', 'fases');

  if (!fs.existsSync(fasesDir)) return tips;

  const files = fs.readdirSync(fasesDir).filter(f => f.endsWith('.json'));
  const fases = files.map(f => readJSON(path.join(fasesDir, f))).filter(Boolean);
  if (!fases.length) return tips;

  const current = fases.find(f => f.status === 'current');
  if (current) {
    if ((current.conformidade_pct || 0) < 80) {
      tips.push(tip('Quality', 'high', 70,
        `Conformidade baixa na fase "${current.nome}": ${current.conformidade_pct || 0}%.`,
        'O codigo pode nao estar seguindo os padroes do Kit Ouro.',
        'Execute /ouro:verificar para detalhes.',
        'phases'));
    }

    if ((current.progresso_pct || 0) < 30 && fases.filter(f => f.status === 'done').length > 0) {
      tips.push(tip('Performance', 'medium', 55,
        `Fase "${current.nome}" com pouco progresso: ${current.progresso_pct || 0}%.`,
        'Pode estar travada. Considere revisar o planejamento.',
        'Execute /ouro:planejar para replanejar se necessario.',
        'phases'));
    }
  }

  return tips;
}

// ==================== ORCHESTRATOR ====================

function generateTips(ouroDir) {
  tipCounter = 0;
  const allTips = [
    ...analyzeSessions(ouroDir),
    ...analyzePrompts(ouroDir),
    ...analyzeErrors(ouroDir),
    ...analyzeFiles(ouroDir),
    ...analyzePhases(ouroDir),
  ];

  // Sort by impact descending
  allTips.sort((a, b) => b.impacto - a.impacto);

  // Deduplicate similar messages
  const seen = new Set();
  const unique = [];
  for (const t of allTips) {
    const key = t.mensagem.slice(0, 30);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(t);
    }
  }

  return unique;
}

function getTipsByCategory(tips, categoria) {
  return tips.filter(t => t.categoria === categoria);
}

// ==================== EXPORTS ====================

module.exports = {
  generateTips,
  analyzeSessions,
  analyzePrompts,
  analyzeErrors,
  analyzeFiles,
  analyzePhases,
  getTipsByCategory,
  findOuroDir,
};
