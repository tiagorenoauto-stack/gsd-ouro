#!/usr/bin/env node

/**
 * GSD Ouro — Analytics Core
 * Leitura e escrita de métricas em .ouro/analytics/
 */

const fs = require('fs');
const path = require('path');

// Custo por 1M tokens (USD) — referência para cálculo hipotético
const COST_PER_MTOK = {
  'claude-opus':   { input: 15,   output: 75 },
  'claude-sonnet': { input: 3,    output: 15 },
  'claude-haiku':  { input: 0.25, output: 1.25 },
  'codestral':     { input: 0,    output: 0 },
  'deepseek-v3':   { input: 0,    output: 0 },
  'deepseek-r1':   { input: 0,    output: 0 },
  'gemini-pro':    { input: 0,    output: 0 },
  'mistral-small': { input: 0,    output: 0 },
};

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

function writeJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function calculateCost(ia, tokensIn, tokensOut) {
  const key = ia.toLowerCase().replace(/\s+/g, '-');
  const rates = COST_PER_MTOK[key] || { input: 0, output: 0 };
  return (tokensIn * rates.input + tokensOut * rates.output) / 1_000_000;
}

function calculateHypotheticalCost(tokensIn, tokensOut) {
  return calculateCost('claude-sonnet', tokensIn, tokensOut);
}

// ==================== SESSION ====================

function genSessionId(sessionsDir) {
  const datePrefix = today();
  if (!fs.existsSync(sessionsDir)) return `${datePrefix}_1`;
  const existing = fs.readdirSync(sessionsDir)
    .filter(f => f.startsWith(datePrefix) && f.endsWith('.json'));
  return `${datePrefix}_${existing.length + 1}`;
}

function sessionStart(ouroDir) {
  const sessionsDir = path.join(ouroDir, 'analytics', 'sessoes');
  const sessionId = genSessionId(sessionsDir);

  const session = {
    sessao_id: sessionId,
    timestamp: now(),
    fim: null,
    status: 'ativa',
    duracao_segundos: 0,
    tarefas: { total: 0, concluidas: 0, falhadas: 0 },
    custo: { real: 0, hipotetico: 0 },
    tokens: { entrada: 0, saida: 0, total: 0 },
    ias_utilizadas: []
  };

  writeJSON(path.join(sessionsDir, `${sessionId}.json`), session);

  // Update STATE.md
  const statePath = path.join(ouroDir, 'STATE.md');
  const state = [
    '# Estado Atual',
    '',
    '## Sessão',
    `- Início: ${session.timestamp}`,
    `- ID: ${sessionId}`,
    '- Fase atual: —',
    '- Última tarefa: —',
    '',
    '## Progresso',
    '- Fases completas: 0',
    '- Tarefas concluídas: 0',
    '- Conformidade Kit: —',
    ''
  ].join('\n');
  fs.writeFileSync(statePath, state, 'utf-8');

  // Update active_context
  const ctxPath = path.join(ouroDir, 'active_context.md');
  const ctx = [
    '# Contexto Ativo',
    '',
    `Última atualização: ${session.timestamp}`,
    `Sessão: ${sessionId}`,
    'Fase: —',
    'Tarefa: —',
    'Último arquivo: —',
    ''
  ].join('\n');
  fs.writeFileSync(ctxPath, ctx, 'utf-8');

  refreshDashboard(ouroDir);
  return session;
}

function getActiveSession(ouroDir) {
  const sessionsDir = path.join(ouroDir, 'analytics', 'sessoes');
  if (!fs.existsSync(sessionsDir)) return null;

  const files = fs.readdirSync(sessionsDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();

  for (const f of files) {
    const session = readJSON(path.join(sessionsDir, f));
    if (session && session.status === 'ativa') {
      return { session, file: f };
    }
  }
  return null;
}

function ensureActiveSession(ouroDir) {
  const active = getActiveSession(ouroDir);
  if (active) return active;
  const session = sessionStart(ouroDir);
  const file = `${session.sessao_id}.json`;
  return { session, file };
}

function sessionEnd(ouroDir) {
  const active = getActiveSession(ouroDir);
  if (!active) return null;

  const { session, file } = active;
  const startTime = new Date(session.timestamp);
  const endTime = new Date();

  session.status = 'finalizada';
  session.fim = now();
  session.duracao_segundos = Math.round((endTime - startTime) / 1000);

  // Calculate taxa_sucesso per IA
  for (const ia of session.ias_utilizadas) {
    const total = ia.sucesso + ia.falhas;
    ia.taxa_sucesso_pct = total > 0 ? Math.round((ia.sucesso / total) * 100) : 0;
  }

  writeJSON(path.join(ouroDir, 'analytics', 'sessoes', file), session);

  // Update active_context
  const ctxPath = path.join(ouroDir, 'active_context.md');
  const ctx = [
    '# Contexto Ativo',
    '',
    `Última atualização: ${session.fim}`,
    `Sessão: ${session.sessao_id} (finalizada)`,
    `Duração: ${Math.round(session.duracao_segundos / 60)}min`,
    `Tarefas: ${session.tarefas.concluidas}/${session.tarefas.total}`,
    `Custo: $${session.custo.real.toFixed(4)}`,
    ''
  ].join('\n');
  fs.writeFileSync(ctxPath, ctx, 'utf-8');

  // Update STATE.md
  const statePath = path.join(ouroDir, 'STATE.md');
  const state = [
    '# Estado Atual',
    '',
    '## Sessão',
    `- Última: ${session.sessao_id} (finalizada)`,
    `- Duração: ${Math.round(session.duracao_segundos / 60)}min`,
    `- Tarefas: ${session.tarefas.concluidas}/${session.tarefas.total}`,
    '',
    '## Progresso',
    `- Sessões total: ${countSessions(ouroDir)}`,
    `- Tarefas concluídas: ${session.tarefas.concluidas}`,
    `- Custo sessão: $${session.custo.real.toFixed(4)}`,
    ''
  ].join('\n');
  fs.writeFileSync(statePath, state, 'utf-8');

  refreshDashboard(ouroDir);
  return session;
}

function countSessions(ouroDir) {
  const dir = path.join(ouroDir, 'analytics', 'sessoes');
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).length;
}

// ==================== TASK ====================

function logTask(ouroDir, data) {
  const { session, file } = ensureActiveSession(ouroDir);
  const success = data.status !== 'falha';

  session.tarefas.total++;
  if (success) session.tarefas.concluidas++;
  else session.tarefas.falhadas++;

  const tokensIn = parseInt(data.tokens_in) || 0;
  const tokensOut = parseInt(data.tokens_out) || 0;

  // Cost: use provided or calculate from IA rates
  const custoReal = data.custo !== undefined
    ? parseFloat(data.custo)
    : calculateCost(data.ia || '', tokensIn, tokensOut);
  const custoHip = data.custo_hipotetico !== undefined
    ? parseFloat(data.custo_hipotetico)
    : calculateHypotheticalCost(tokensIn, tokensOut);

  session.custo.real += custoReal;
  session.custo.hipotetico += custoHip;
  session.tokens.entrada += tokensIn;
  session.tokens.saida += tokensOut;
  session.tokens.total += tokensIn + tokensOut;

  // IA tracking within session
  if (data.ia) {
    let iaEntry = session.ias_utilizadas.find(i => i.nome === data.ia);
    if (!iaEntry) {
      iaEntry = { nome: data.ia, chamadas: 0, tokens: 0, custo: 0, sucesso: 0, falhas: 0 };
      session.ias_utilizadas.push(iaEntry);
    }
    iaEntry.chamadas++;
    iaEntry.tokens += tokensIn + tokensOut;
    iaEntry.custo += custoReal;
    if (success) iaEntry.sucesso++;
    else iaEntry.falhas++;
  }

  writeJSON(path.join(ouroDir, 'analytics', 'sessoes', file), session);

  // Update IA aggregate
  if (data.ia) {
    updateIA(ouroDir, {
      nome: data.ia,
      sucesso: success,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      custo: custoReal,
      latencia: parseFloat(data.latencia) || 0
    });
  }

  refreshDashboard(ouroDir);
  return session;
}

// ==================== IA ====================

function updateIA(ouroDir, data) {
  const iasDir = path.join(ouroDir, 'analytics', 'ias');
  const fileName = data.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') + '.json';
  const filePath = path.join(iasDir, fileName);

  let ia = readJSON(filePath) || {
    nome: data.nome,
    chamadas_total: 0,
    sucesso_total: 0,
    falhas_total: 0,
    taxa_sucesso_pct: 0,
    latencia_media_s: 0,
    latencia_acum_s: 0,
    custo_total: 0,
    tokens_entrada: 0,
    tokens_saida: 0,
    desvios_encontrados: 0,
    desvios_detalhados: []
  };

  ia.chamadas_total++;
  if (data.sucesso) ia.sucesso_total++;
  else ia.falhas_total++;
  ia.taxa_sucesso_pct = Math.round((ia.sucesso_total / ia.chamadas_total) * 100);
  ia.tokens_entrada += (parseInt(data.tokens_in) || 0);
  ia.tokens_saida += (parseInt(data.tokens_out) || 0);
  ia.custo_total += (parseFloat(data.custo) || 0);
  ia.latencia_acum_s += (parseFloat(data.latencia) || 0);
  ia.latencia_media_s = parseFloat((ia.latencia_acum_s / ia.chamadas_total).toFixed(2));

  writeJSON(filePath, ia);
  return ia;
}

// ==================== PROMPT ====================

function logPrompt(ouroDir, data) {
  const filePath = path.join(ouroDir, 'analytics', 'prompts', 'historico.json');
  const historico = readJSON(filePath) || [];

  historico.push({
    timestamp: now(),
    input_usuario: data.input || '',
    tipo: data.tipo || 'Auto',
    ia_destino: data.ia || '',
    modo: data.modo || 'Completo',
    resultado: data.resultado || '',
    tokens_estimados: parseInt(data.tokens) || 0,
    custo: parseFloat(data.custo) || 0
  });

  writeJSON(filePath, historico);
  return historico.length;
}

// ==================== FASE ====================

function updateFase(ouroDir, data) {
  const fasesDir = path.join(ouroDir, 'analytics', 'fases');
  const fileName = `fase-${data.numero}.json`;
  const filePath = path.join(fasesDir, fileName);

  let fase = readJSON(filePath) || {
    numero: parseInt(data.numero),
    nome: data.nome || `Fase ${data.numero}`,
    status: 'pending',
    progresso_pct: 0,
    custo: { real: 0, hipotetico: 0 },
    tarefas: { total: 0, concluidas: 0 },
    conformidade_pct: 0
  };

  if (data.nome !== undefined) fase.nome = data.nome;
  if (data.status !== undefined) fase.status = data.status;
  if (data.progresso !== undefined) fase.progresso_pct = parseInt(data.progresso);
  if (data.tarefas_total !== undefined) fase.tarefas.total = parseInt(data.tarefas_total);
  if (data.tarefas_ok !== undefined) fase.tarefas.concluidas = parseInt(data.tarefas_ok);
  if (data.conformidade !== undefined) fase.conformidade_pct = parseInt(data.conformidade);
  if (data.custo_real !== undefined) fase.custo.real = parseFloat(data.custo_real);
  if (data.custo_hipotetico !== undefined) fase.custo.hipotetico = parseFloat(data.custo_hipotetico);

  writeJSON(filePath, fase);
  refreshDashboard(ouroDir);
  return fase;
}

// ==================== DASHBOARD REFRESH ====================

function refreshDashboard(ouroDir) {
  const dashPath = path.join(ouroDir, 'analytics', 'dashboard.json');
  const dash = readJSON(dashPath) || {};

  // Aggregate sessions
  const sessionsDir = path.join(ouroDir, 'analytics', 'sessoes');
  let totalSessoes = 0;
  let totalTarefas = 0;
  let custoReal = 0;
  let custoHipotetico = 0;

  if (fs.existsSync(sessionsDir)) {
    const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.json'));
    totalSessoes = files.length;
    for (const f of files) {
      const s = readJSON(path.join(sessionsDir, f));
      if (!s) continue;
      totalTarefas += (s.tarefas ? s.tarefas.concluidas : 0);
      custoReal += (s.custo ? s.custo.real : 0);
      custoHipotetico += (s.custo ? s.custo.hipotetico : 0);
    }
  }

  // Aggregate fases
  const fasesDir = path.join(ouroDir, 'analytics', 'fases');
  let totalFases = 0;
  let fasesOk = 0;
  let progressoTotal = 0;
  let conformidadeTotal = 0;
  let conformidadeCount = 0;

  if (fs.existsSync(fasesDir)) {
    const files = fs.readdirSync(fasesDir).filter(f => f.endsWith('.json'));
    totalFases = files.length;
    for (const f of files) {
      const fase = readJSON(path.join(fasesDir, f));
      if (!fase) continue;
      if (fase.status === 'done') fasesOk++;
      progressoTotal += (fase.progresso_pct || 0);
      if (fase.conformidade_pct > 0) {
        conformidadeTotal += fase.conformidade_pct;
        conformidadeCount++;
      }
    }
  }

  // Read project name from PROJECT.md
  const projectPath = path.join(ouroDir, 'PROJECT.md');
  let projectName = dash.projeto || '';
  try {
    const content = fs.readFileSync(projectPath, 'utf-8');
    const match = content.match(/^# Projeto:\s*(.+)/m);
    if (match && match[1].trim() !== '{nome}') {
      projectName = match[1].trim();
    }
  } catch {}

  const economiaPct = custoHipotetico > 0
    ? Math.round(((custoHipotetico - custoReal) / custoHipotetico) * 100)
    : 0;
  const progressoMedio = totalFases > 0 ? Math.round(progressoTotal / totalFases) : 0;
  const conformidadeMedia = conformidadeCount > 0 ? Math.round(conformidadeTotal / conformidadeCount) : 0;

  const updated = {
    projeto: projectName,
    milestone: dash.milestone || 1,
    progresso: progressoMedio,
    economia_pct: economiaPct,
    custo_real: parseFloat(custoReal.toFixed(4)),
    custo_hipotetico: parseFloat(custoHipotetico.toFixed(4)),
    conformidade: conformidadeMedia,
    sessoes: totalSessoes,
    tarefas_concluidas: totalTarefas,
    alertas: dash.alertas || []
  };

  writeJSON(dashPath, updated);
  return updated;
}

module.exports = {
  findOuroDir,
  readJSON,
  writeJSON,
  calculateCost,
  calculateHypotheticalCost,
  sessionStart,
  sessionEnd,
  getActiveSession,
  ensureActiveSession,
  logTask,
  updateIA,
  logPrompt,
  updateFase,
  refreshDashboard,
  COST_PER_MTOK
};
