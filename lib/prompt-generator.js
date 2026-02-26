#!/usr/bin/env node

/**
 * GSD Ouro — Prompt Generator Pro (v0.6)
 * Motor central de geração, otimização, simulação e métricas de prompts.
 *
 * Features:
 *   - Multi-framework: CO-STAR, RTF, CARE (auto-seleção)
 *   - Formatação por modelo alvo (Claude XML, GPT JSON, Gemini MD, DeepSeek conciso)
 *   - Seleção automática de técnica (zero-shot, CoT, ToT, self-consistency)
 *   - Optimize: reescreve prompts fracos em prompts estruturados
 *   - Deep Score: avaliação multi-critério (5 dimensões, 0-100)
 *   - Simulate: previsão de eficácia antes de executar
 *   - Stats: métricas e estatísticas do histórico de prompts
 *   - A/B Compare: comparação lado a lado de prompts
 *   - Variáveis {{placeholder}} para reusabilidade
 *   - Banco de prompts eficazes com ranking
 *   - Trigger Engine: auto-inject de padrões Kit Ouro no contexto (v0.6)
 *
 * Uso via lib:
 *   const pg = require('./lib/prompt-generator');
 *   const result = pg.generate('criar botão de login', { modelo: 'claude' });
 *   const optimized = pg.optimize('meu prompt ruim');
 *   const sim = pg.simulate(result.prompt, 'claude');
 *   const stats = pg.getStats();
 */

const fs = require('fs');
const path = require('path');

// Trigger Engine (v0.6) — auto-inject Kit Ouro patterns
let triggerEngine = null;
function getTriggerEngine() {
  if (!triggerEngine) {
    try {
      triggerEngine = require('./trigger-engine');
    } catch (e) {
      triggerEngine = { matchTriggers: () => [], buildContextInjection: () => '', getChecklist: () => [] };
    }
  }
  return triggerEngine;
}

// ==================== CONSTANTS ====================

const TASK_TYPES = {
  codigo:       { keywords: ['criar', 'implementar', 'componente', 'função', 'hook', 'api', 'endpoint', 'rota', 'página', 'botão', 'form', 'input', 'modal', 'layout', 'estilo', 'css', 'html', 'script', 'feature', 'funcionalidade'], tone: 'tecnico', response: 'codigo', framework: 'rtf' },
  debug:        { keywords: ['bug', 'erro', 'fix', 'corrigir', 'quebrado', 'falha', 'crash', 'exception', 'null', 'undefined', 'não funciona', 'problema', 'investigar', 'diagnosticar'], tone: 'analitico', response: 'codigo', framework: 'rtf' },
  testes:       { keywords: ['teste', 'test', 'spec', 'jest', 'vitest', 'coverage', 'mock', 'stub', 'assert', 'expect', 'unitário', 'integração', 'e2e'], tone: 'tecnico', response: 'codigo', framework: 'care' },
  refactor:     { keywords: ['refatorar', 'refactor', 'limpar', 'otimizar', 'melhorar', 'simplificar', 'extrair', 'mover', 'renomear', 'reorganizar', 'performance'], tone: 'tecnico', response: 'codigo', framework: 'costar' },
  documentacao: { keywords: ['documentar', 'readme', 'doc', 'guia', 'tutorial', 'explicar', 'descrever', 'comentar', 'jsdoc', 'swagger', 'api doc'], tone: 'didatico', response: 'markdown', framework: 'care' },
  arquitetura:  { keywords: ['arquitetura', 'design', 'estrutura', 'decisão', 'abordagem', 'comparar', 'trade-off', 'padrão', 'pattern', 'migrar', 'escalar', 'segurança', 'auth', 'planejar'], tone: 'analitico', response: 'markdown', framework: 'costar' },
};

const COMPLEXITY_KEYWORDS = {
  simple:   ['ajustar', 'adicionar campo', 'renomear', 'trocar cor', 'alterar texto', 'novo campo', 'estilo', 'css', 'typo', 'label'],
  medium:   ['componente', 'refatorar', 'hook', 'formulário', 'validação', 'integração', 'api', 'modal', 'tabela', 'lista'],
  high:     ['arquitetura', 'migração', 'design system', 'múltiplos módulos', 'pipeline', 'cache', 'state management', 'real-time', 'websocket'],
  critical: ['segurança', 'auth', 'pagamento', 'criptografia', 'financeiro', 'compliance', 'gdpr', 'lgpd', 'token', 'senha', 'credencial'],
};

const TECHNIQUE_MAP = {
  simple:   'zero-shot',
  medium:   'few-shot-cot',
  high:     'tree-of-thought',
  critical: 'self-consistency',
};

const TECHNIQUE_LABELS = {
  'zero-shot':        'Zero-Shot (direto)',
  'few-shot-cot':     'Few-Shot + Chain-of-Thought',
  'tree-of-thought':  'Tree-of-Thought (múltiplas abordagens)',
  'self-consistency':  'Self-Consistency (gerar N, escolher consenso)',
};

const FRAMEWORK_LABELS = {
  costar: 'CO-STAR (Context, Objective, Style, Tone, Audience, Response)',
  rtf:    'RTF (Role, Task, Format)',
  care:   'CARE (Context, Action, Result, Examples)',
};

const MODEL_FORMATS = {
  claude:   'xml',
  gpt:      'json-schema',
  gemini:   'markdown',
  deepseek: 'conciso',
  groq:     'few-shot',
  llama:    'few-shot',
};

const MODEL_PROFILES = {
  claude:   { name: 'Claude', maxTokens: 200000, strengths: 'XML tags, instruções explícitas, extended thinking, raciocínio complexo', weaknesses: 'Custo mais alto', costTier: 'premium' },
  gpt:      { name: 'GPT', maxTokens: 128000, strengths: 'Structured output, JSON schema, function calling', weaknesses: 'Menos literal que Claude', costTier: 'premium' },
  gemini:   { name: 'Gemini', maxTokens: 1000000, strengths: 'Contexto longo (1M), multimodal, Deep Think', weaknesses: 'Menos preciso em código', costTier: 'free' },
  deepseek: { name: 'DeepSeek', maxTokens: 64000, strengths: 'Raciocínio técnico, custo baixo, direto', weaknesses: 'Contexto limitado', costTier: 'free' },
  groq:     { name: 'Groq/Llama', maxTokens: 32000, strengths: 'Velocidade extrema, few-shot eficaz', weaknesses: 'Contexto curto, menos criativo', costTier: 'free' },
};

const TONE_LABELS = {
  tecnico:   'Técnico e preciso',
  analitico: 'Analítico e investigativo',
  didatico:  'Didático e explicativo',
  conciso:   'Conciso e direto',
};

const RESPONSE_LABELS = {
  codigo:   'Código funcional pronto para uso',
  markdown: 'Documento em Markdown estruturado',
  json:     'JSON estruturado',
  lista:    'Lista de itens/passos',
};

// ==================== GUIDED QUESTIONS (Iterative Refinement) ====================
// Inspired by AppVida's GUIDED_MODE_QUESTIONS pattern

const GUIDED_QUESTIONS = {
  codigo: [
    { key: 'objetivo', q: 'O que exatamente precisa ser criado? Descreva a funcionalidade.' },
    { key: 'contexto', q: 'Em qual módulo/tela/arquivo isso se encaixa?' },
    { key: 'stack', q: 'Qual stack/tecnologias envolvidas? (React, Node, etc.)' },
    { key: 'refs', q: 'Tem código/arquivo de referência? (cole trecho ou caminho)' },
    { key: 'restricoes', q: 'Alguma restrição ou padrão obrigatório?' },
  ],
  debug: [
    { key: 'erro', q: 'Qual é o erro exato? (mensagem, stack trace, comportamento)' },
    { key: 'esperado', q: 'O que deveria acontecer corretamente?' },
    { key: 'contexto', q: 'Em qual tela/módulo/função ocorre?' },
    { key: 'refs', q: 'Cole o trecho de código com o problema ou o log de erro.' },
    { key: 'tentativas', q: 'Já tentou algo para resolver? O que?' },
  ],
  testes: [
    { key: 'alvo', q: 'O que precisa ser testado? (função, componente, endpoint)' },
    { key: 'tipo_teste', q: 'Que tipo de teste? (unitário, integração, e2e)' },
    { key: 'framework', q: 'Qual framework de teste? (Jest, Vitest, Playwright, etc.)' },
    { key: 'refs', q: 'Cole o código que será testado como referência.' },
    { key: 'cenarios', q: 'Cenários específicos a cobrir? (happy path, edge cases, erros)' },
  ],
  refactor: [
    { key: 'alvo', q: 'O que precisa ser refatorado? (arquivo, função, módulo)' },
    { key: 'problema', q: 'Qual o problema atual? (lento, duplicado, confuso, acoplado)' },
    { key: 'refs', q: 'Cole o código atual que precisa ser refatorado.' },
    { key: 'padrao', q: 'Tem preferência de padrão ou abordagem? (SOLID, DRY, etc.)' },
    { key: 'restricoes', q: 'Alguma restrição? (não quebrar API, manter compatibilidade)' },
  ],
  documentacao: [
    { key: 'alvo', q: 'O que precisa ser documentado? (API, componente, processo)' },
    { key: 'publico', q: 'Para quem é a documentação? (devs, usuários, stakeholders)' },
    { key: 'formato', q: 'Qual formato? (README, JSDoc, Swagger, guia, tutorial)' },
    { key: 'refs', q: 'Cole o código/trecho que será documentado.' },
    { key: 'estilo', q: 'Tem referência de estilo? (formal, técnico, didático)' },
  ],
  arquitetura: [
    { key: 'decisao', q: 'Qual decisão arquitetural precisa ser tomada?' },
    { key: 'opcoes', q: 'Quais alternativas estão sendo consideradas?' },
    { key: 'restricoes', q: 'Restrições do projeto? (prazo, custo, equipe, escala)' },
    { key: 'refs', q: 'Tem documentação/código atual de referência? Cole ou descreva.' },
    { key: 'criterios', q: 'Critérios de decisão? (performance, manutenção, custo, DX)' },
  ],
};

// Deep score criteria weights
const SCORE_CRITERIA = {
  clareza:        { weight: 25, label: 'Clareza do Objetivo' },
  contexto:       { weight: 20, label: 'Completude do Contexto' },
  especificidade: { weight: 20, label: 'Especificidade' },
  formato:        { weight: 15, label: 'Definição de Formato' },
  estrutura:      { weight: 10, label: 'Estrutura/Framework' },
  antiambiguidade:{ weight: 10, label: 'Anti-Ambiguidade' },
};

// ==================== UTILS ====================

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
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

function findProjectRoot(startDir) {
  let dir = startDir || process.cwd();
  for (let i = 0; i < 20; i++) {
    if (fs.existsSync(path.join(dir, '.ouro'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

function normalize(text) {
  return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ==================== CONTEXT LOADING ====================

function loadContext(ouroDir) {
  if (!ouroDir) return { project: '', state: '', kit: '', activeContext: '' };

  const project = readFile(path.join(ouroDir, 'PROJECT.md')) || '';
  const state = readFile(path.join(ouroDir, 'STATE.md')) || '';
  const kit = readFile(path.join(ouroDir, 'KIT_OURO.md')) || '';
  const activeContext = readFile(path.join(ouroDir, 'active_context.md')) || '';

  return { project, state, kit, activeContext };
}

function extractProjectInfo(ctx) {
  const info = { nome: '', stack: '', fase: '', ultimaTarefa: '' };

  const nomeMatch = ctx.project.match(/(?:nome|projeto|name):\s*(.+)/i);
  if (nomeMatch) info.nome = nomeMatch[1].trim();

  const stackMatch = ctx.project.match(/(?:stack|tecnologia|tech):\s*(.+)/i);
  if (stackMatch) info.stack = stackMatch[1].trim();

  const faseMatch = ctx.state.match(/(?:fase atual|fase):\s*(.+)/i);
  if (faseMatch) info.fase = faseMatch[1].trim();

  const tarefaMatch = ctx.state.match(/(?:última tarefa|tarefa):\s*(.+)/i);
  if (tarefaMatch) info.ultimaTarefa = tarefaMatch[1].trim();

  return info;
}

// ==================== DETECTION ====================

function detectTaskType(text) {
  const normalized = normalize(text);
  let best = { type: 'codigo', score: 0 };

  for (const [type, config] of Object.entries(TASK_TYPES)) {
    let score = 0;
    for (const kw of config.keywords) {
      if (normalized.includes(normalize(kw))) score++;
    }
    if (score > best.score) {
      best = { type, score };
    }
  }

  return best.type;
}

function detectComplexity(text) {
  const normalized = normalize(text);
  const scores = { simple: 0, medium: 0, high: 0, critical: 0 };

  for (const [level, keywords] of Object.entries(COMPLEXITY_KEYWORDS)) {
    for (const kw of keywords) {
      if (normalized.includes(normalize(kw))) scores[level]++;
    }
  }

  const wordCount = text.split(/\s+/).length;
  if (wordCount > 50) scores.high += 2;
  else if (wordCount > 25) scores.medium += 1;

  if (scores.critical > 0) return 'critical';

  let best = 'simple';
  let max = 0;
  for (const [level, score] of Object.entries(scores)) {
    if (score > max) { max = score; best = level; }
  }

  return best;
}

function selectTechnique(complexity) {
  return TECHNIQUE_MAP[complexity] || 'zero-shot';
}

function selectFramework(taskType) {
  const config = TASK_TYPES[taskType];
  return config ? config.framework : 'costar';
}

// ==================== GUIDED MODE ====================

function getGuidedQuestions(tipo) {
  tipo = tipo || 'codigo';
  return GUIDED_QUESTIONS[tipo] || GUIDED_QUESTIONS.codigo;
}

function generateFromAnswers(answers, options = {}) {
  // answers = [{ key, q, answer }] or { key: answer }
  let answersMap = {};
  if (Array.isArray(answers)) {
    for (const a of answers) {
      if (a.answer && a.answer.trim()) answersMap[a.key] = a.answer.trim();
    }
  } else {
    answersMap = answers;
  }

  // Build enriched objective from answers
  const tipo = options.tipo || detectTaskType(Object.values(answersMap).join(' '));
  const questions = GUIDED_QUESTIONS[tipo] || GUIDED_QUESTIONS.codigo;
  const parts = [];

  for (const q of questions) {
    if (answersMap[q.key]) {
      parts.push(`${q.q.split('?')[0]}: ${answersMap[q.key]}`);
    }
  }

  const enrichedObjective = parts.join('\n');

  // Extract refs for reference materials
  const refs = answersMap.refs || null;

  // Generate with enriched context
  return generate(enrichedObjective, {
    ...options,
    tipo,
    references: refs,
    fromGuided: true,
  });
}

// ==================== FRAMEWORK BUILDERS ====================

// CO-STAR: Context, Objective, Style, Tone, Audience, Response
// Best for: complex tasks, architecture, refactoring
function buildCOSTAR(objective, options = {}) {
  const ouroDir = options.ouroDir || findOuroDir();
  const ctx = loadContext(ouroDir);
  const info = extractProjectInfo(ctx);
  const taskType = options.tipo || detectTaskType(objective);
  const taskConfig = TASK_TYPES[taskType] || TASK_TYPES.codigo;

  const contextParts = [];
  if (info.nome) contextParts.push(`Projeto: ${info.nome}`);
  if (info.stack) contextParts.push(`Stack: ${info.stack}`);
  if (info.fase && info.fase !== '—') contextParts.push(`Fase atual: ${info.fase}`);
  if (info.ultimaTarefa && info.ultimaTarefa !== '—') contextParts.push(`Última tarefa: ${info.ultimaTarefa}`);
  if (ctx.kit && ctx.kit.length > 50) contextParts.push(`Kit disponível com componentes e padrões definidos`);

  return {
    framework: 'costar',
    context: contextParts.length > 0 ? contextParts.join('. ') + '.' : 'Projeto em desenvolvimento.',
    objective: objective.trim(),
    style: options.style || (taskType === 'documentacao' ? 'Documentação clara e bem estruturada' : taskType === 'arquitetura' ? 'Análise técnica com prós e contras' : 'Código limpo, modular, seguindo convenções do projeto'),
    tone: options.tone || taskConfig.tone,
    audience: options.audience || 'Desenvolvedor trabalhando no projeto',
    response: options.response || taskConfig.response,
    _meta: { taskType, projectInfo: info, hasKit: ctx.kit.length > 50, hasState: ctx.state.length > 50, references: options.references || null },
  };
}

// RTF: Role, Task, Format
// Best for: simple/focused tasks, code generation, quick fixes
function buildRTF(objective, options = {}) {
  const ouroDir = options.ouroDir || findOuroDir();
  const ctx = loadContext(ouroDir);
  const info = extractProjectInfo(ctx);
  const taskType = options.tipo || detectTaskType(objective);
  const taskConfig = TASK_TYPES[taskType] || TASK_TYPES.codigo;

  const roleParts = ['Desenvolvedor sênior'];
  if (info.stack) roleParts.push(`especialista em ${info.stack}`);
  if (info.nome) roleParts.push(`trabalhando no projeto ${info.nome}`);

  return {
    framework: 'rtf',
    role: roleParts.join(', '),
    task: objective.trim(),
    format: RESPONSE_LABELS[taskConfig.response] || 'Código funcional',
    _meta: { taskType, projectInfo: info, hasKit: ctx.kit.length > 50, hasState: ctx.state.length > 50, references: options.references || null },
  };
}

// CARE: Context, Action, Result, Examples
// Best for: tasks where examples matter (tests, docs)
function buildCARE(objective, options = {}) {
  const ouroDir = options.ouroDir || findOuroDir();
  const ctx = loadContext(ouroDir);
  const info = extractProjectInfo(ctx);
  const taskType = options.tipo || detectTaskType(objective);
  const taskConfig = TASK_TYPES[taskType] || TASK_TYPES.codigo;

  const contextParts = [];
  if (info.nome) contextParts.push(`Projeto: ${info.nome}`);
  if (info.stack) contextParts.push(`Stack: ${info.stack}`);
  if (info.fase && info.fase !== '—') contextParts.push(`Fase: ${info.fase}`);

  // Generate example hint based on task type
  const exampleHints = {
    testes: 'Exemplo de teste similar no projeto ou padrão expect/describe/it',
    documentacao: 'Exemplo de documentação existente no projeto como referência de estilo',
    codigo: 'Exemplo de componente/função similar já existente no projeto',
    debug: 'Exemplo de erro similar já corrigido ou stack trace relevante',
    refactor: 'Exemplo do código atual vs. código refatorado esperado',
    arquitetura: 'Exemplo de decisão arquitetural anterior ou ADR existente',
  };

  return {
    framework: 'care',
    context: contextParts.length > 0 ? contextParts.join('. ') + '.' : 'Projeto em desenvolvimento.',
    action: objective.trim(),
    result: RESPONSE_LABELS[taskConfig.response] || 'Código funcional',
    examples: options.examples || `{{exemplos: ${exampleHints[taskType] || 'Insira exemplo relevante'}}}`,
    _meta: { taskType, projectInfo: info, hasKit: ctx.kit.length > 50, hasState: ctx.state.length > 50, references: options.references || null },
  };
}

// Auto-select and build the best framework
function buildFramework(objective, options = {}) {
  const taskType = options.tipo || detectTaskType(objective);
  const framework = options.framework || selectFramework(taskType);

  switch (framework) {
    case 'rtf':   return buildRTF(objective, options);
    case 'care':  return buildCARE(objective, options);
    case 'costar':
    default:      return buildCOSTAR(objective, options);
  }
}

// ==================== MODEL FORMATTING ====================

function formatForModel(fwData, model) {
  const fmt = MODEL_FORMATS[model] || 'markdown';

  switch (fmt) {
    case 'xml':         return formatXML(fwData);
    case 'json-schema': return formatJSON(fwData);
    case 'markdown':    return formatMarkdown(fwData);
    case 'conciso':     return formatConcise(fwData);
    case 'few-shot':    return formatFewShot(fwData);
    default:            return formatMarkdown(fwData);
  }
}

function formatXML(fw) {
  const parts = [];

  if (fw.framework === 'rtf') {
    parts.push(`<role>\n${fw.role}\n</role>\n`);
    parts.push(`<task>\n${fw.task}\n</task>\n`);
    parts.push(`<format>\n${fw.format}\n</format>\n`);
  } else if (fw.framework === 'care') {
    parts.push(`<context>\n${fw.context}\n</context>\n`);
    parts.push(`<action>\n${fw.action}\n</action>\n`);
    parts.push(`<expected_result>\n${fw.result}\n</expected_result>\n`);
    parts.push(`<examples>\n${fw.examples}\n</examples>\n`);
  } else {
    // CO-STAR
    parts.push(`<context>\n${fw.context}\n</context>\n`);
    parts.push(`<objective>\n${fw.objective}\n</objective>\n`);
    parts.push(`<style>\n${fw.style}\n</style>\n`);
    parts.push(`<tone>${TONE_LABELS[fw.tone] || fw.tone}</tone>\n`);
    parts.push(`<audience>${fw.audience}</audience>\n`);
    parts.push(`<response_format>${RESPONSE_LABELS[fw.response] || fw.response}</response_format>\n`);
  }

  if (fw._meta?.hasKit) {
    parts.push(`<constraints>\n- Seguir padrões do KIT_OURO.md\n- Reutilizar componentes existentes\n- MATCH antes de criar novo\n</constraints>\n`);
  }

  // Reference Materials
  if (fw._meta?.references) {
    parts.push(`<reference_materials>\n${fw._meta.references}\n</reference_materials>\n`);
  }

  // Trigger Engine — Kit Ouro patterns auto-injected (v0.6)
  if (fw._meta?.triggerInjection) {
    parts.push(`<kit_ouro_patterns>\n${fw._meta.triggerInjection}\n</kit_ouro_patterns>\n`);
  }

  // Verify with trigger checklists
  const verifyLines = ['Antes de responder, verifique:', '1. O código segue os padrões do projeto?', '2. Reutiliza componentes do Kit?', '3. Está completo e funcional?'];
  if (fw._meta?.triggerChecklists?.length > 0) {
    let n = 4;
    for (const tc of fw._meta.triggerChecklists) {
      for (const item of tc.items) {
        verifyLines.push(`${n}. [${tc.id}] ${item}`);
        n++;
      }
    }
  }
  parts.push(`<verify>\n${verifyLines.join('\n')}\n</verify>\n`);

  // Clarification Prompt
  parts.push(`<clarification>\nSe alguma informação estiver faltando ou ambígua, liste as perguntas que precisa esclarecer ANTES de começar a implementação.\n</clarification>`);

  return parts.join('\n');
}

function formatJSON(fw) {
  const base = {};
  if (fw.framework === 'rtf') {
    Object.assign(base, {
      role: fw.role,
      task: fw.task,
      expected_format: fw.format,
      constraints: fw._meta?.hasKit ? ['Seguir KIT_OURO.md', 'Reutilizar componentes'] : []
    });
  } else if (fw.framework === 'care') {
    Object.assign(base, {
      context: fw.context,
      action: fw.action,
      expected_result: fw.result,
      examples: fw.examples,
      constraints: fw._meta?.hasKit ? ['Seguir KIT_OURO.md', 'Reutilizar componentes'] : []
    });
  } else {
    // CO-STAR
    Object.assign(base, {
      context: fw.context,
      task: fw.objective,
      style: fw.style,
      tone: TONE_LABELS[fw.tone] || fw.tone,
      audience: fw.audience,
      expected_output: { format: fw.response, description: RESPONSE_LABELS[fw.response] || fw.response },
      constraints: fw._meta?.hasKit ? ['Seguir KIT_OURO.md', 'Reutilizar componentes', 'MATCH antes de criar'] : []
    });
  }
  if (fw._meta?.references) base.reference_materials = fw._meta.references;
  if (fw._meta?.triggerInjection) base.kit_ouro_patterns = fw._meta.triggerInjection;
  if (fw._meta?.triggerChecklists?.length > 0) {
    base.trigger_checklists = fw._meta.triggerChecklists.reduce((acc, tc) => { acc[tc.id] = tc.items; return acc; }, {});
  }
  base.clarification = 'Se informação estiver faltando, liste perguntas antes de implementar.';
  return JSON.stringify(base, null, 2);
}

function formatMarkdown(fw) {
  const parts = [];
  if (fw.framework === 'rtf') {
    parts.push(`# Role\n\n${fw.role}\n`);
    parts.push(`# Task\n\n${fw.task}\n`);
    parts.push(`# Format\n\n${fw.format}\n`);
  } else if (fw.framework === 'care') {
    parts.push(`# Context\n\n${fw.context}\n`);
    parts.push(`# Action\n\n${fw.action}\n`);
    parts.push(`# Expected Result\n\n${fw.result}\n`);
    parts.push(`# Examples\n\n${fw.examples}\n`);
  } else {
    parts.push(`# Tarefa\n\n${fw.objective}\n`);
    parts.push(`## Contexto\n\n${fw.context}\n`);
    parts.push(`## Estilo\n\n${fw.style}\n`);
    parts.push(`## Tom\n\n${TONE_LABELS[fw.tone] || fw.tone}\n`);
    parts.push(`## Público\n\n${fw.audience}\n`);
    parts.push(`## Formato de Saída\n\n${RESPONSE_LABELS[fw.response] || fw.response}\n`);
  }
  if (fw._meta?.hasKit) {
    parts.push(`## Restrições\n\n- Seguir padrões do KIT_OURO.md\n- Reutilizar componentes existentes\n`);
  }
  if (fw._meta?.references) {
    parts.push(`## Materiais de Referência\n\n${fw._meta.references}\n`);
  }
  // Trigger Engine — Kit Ouro patterns (v0.6)
  if (fw._meta?.triggerInjection) {
    parts.push(`## Padrões Kit Ouro (auto-detectados)\n\n${fw._meta.triggerInjection}\n`);
  }
  if (fw._meta?.triggerChecklists?.length > 0) {
    const checkLines = fw._meta.triggerChecklists.map(tc => `### ${tc.id}\n${tc.items.map(i => `- [ ] ${i}`).join('\n')}`);
    parts.push(`## Checklists Obrigatórios\n\n${checkLines.join('\n\n')}\n`);
  }
  parts.push(`## Clarificação\n\nSe alguma informação estiver faltando ou ambígua, liste as perguntas que precisa esclarecer ANTES de começar.\n`);
  return parts.join('\n');
}

function formatConcise(fw) {
  const parts = [];
  if (fw.framework === 'rtf') {
    parts.push(`Papel: ${fw.role}`);
    parts.push(`Tarefa: ${fw.task}`);
    parts.push(`Output: ${fw.format}`);
  } else if (fw.framework === 'care') {
    parts.push(`Contexto: ${fw.context}`);
    parts.push(`Ação: ${fw.action}`);
    parts.push(`Resultado: ${fw.result}`);
  } else {
    parts.push(`Contexto: ${fw.context}`);
    parts.push(`Tarefa: ${fw.objective}`);
    parts.push(`Output: ${RESPONSE_LABELS[fw.response] || fw.response}`);
  }
  if (fw._meta?.hasKit) parts.push(`Restrição: seguir KIT_OURO.md`);
  if (fw._meta?.references) parts.push(`Referência: ${fw._meta.references}`);
  if (fw._meta?.triggerInjection) parts.push(`Padrões: ${fw._meta.triggerMatches?.join(', ')}`);
  parts.push(`Se falta info, pergunte antes de implementar.`);
  return parts.join('\n');
}

function formatFewShot(fw) {
  const objective = fw.objective || fw.task || fw.action;
  const parts = [];
  parts.push(`### Instruções\n`);
  if (fw.context) parts.push(`Contexto: ${fw.context}\n`);
  parts.push(`Tarefa: ${objective}\n`);
  parts.push(`Formato esperado: ${fw.format || fw.result || RESPONSE_LABELS[fw.response] || 'Código funcional'}\n`);
  if (fw._meta?.references) {
    parts.push(`### Materiais de Referência\n`);
    parts.push(`${fw._meta.references}\n`);
  }
  parts.push(`### Exemplo de saída esperada\n`);
  if (fw.examples && !fw.examples.startsWith('{{')) {
    parts.push(`${fw.examples}\n`);
  } else {
    parts.push(`{{exemplo: insira saída de referência}}\n`);
  }
  if (fw._meta?.triggerInjection) {
    parts.push(`### Padrões Kit Ouro\n`);
    parts.push(`${fw._meta.triggerInjection}\n`);
  }
  parts.push(`### Agora execute a tarefa acima.`);
  parts.push(`Se falta informação, pergunte antes de começar.`);
  return parts.join('\n');
}

// ==================== TECHNIQUE WRAPPERS ====================

function applyTechnique(prompt, technique) {
  switch (technique) {
    case 'zero-shot':
      return prompt;
    case 'few-shot-cot':
      return prompt + '\n\nPense passo a passo antes de responder. Mostre seu raciocínio brevemente, depois apresente o resultado final.';
    case 'tree-of-thought':
      return prompt + '\n\nConsidere pelo menos 2 abordagens diferentes para resolver isso. Para cada abordagem, analise prós e contras. Escolha a melhor e implemente.';
    case 'self-consistency':
      return prompt + '\n\nGere 3 soluções independentes para este problema. Compare-as e apresente a solução mais consistente e robusta como resultado final.';
    default:
      return prompt;
  }
}

// ==================== DEEP SCORING (Multi-criteria) ====================

function deepScore(prompt) {
  const scores = {};
  const details = {};

  // 1. Clareza do Objetivo (25%)
  const hasObjective = prompt.includes('<objective>') || prompt.includes('<task>') || prompt.includes('<action>') || prompt.includes('# Tarefa') || prompt.includes('# Task') || prompt.includes('# Action') || prompt.includes('"task"') || prompt.includes('Tarefa:');
  const objectiveMatch = prompt.match(/<(?:objective|task|action)>\n?([\s\S]*?)\n?<\/(?:objective|task|action)>/s)
    || prompt.match(/# (?:Tarefa|Task|Action)\n\n([\s\S]*?)\n(?:#|$)/s)
    || prompt.match(/(?:Tarefa|Task):\s*(.+)/);
  const objectiveLen = objectiveMatch ? objectiveMatch[1].trim().split(/\s+/).length : 0;

  let clarezaScore = 0;
  if (hasObjective) clarezaScore += 40;
  if (objectiveLen >= 10) clarezaScore += 30;
  else if (objectiveLen >= 5) clarezaScore += 20;
  else if (objectiveLen >= 3) clarezaScore += 10;
  // Measurable/actionable verbs
  const actionVerbs = ['criar', 'implementar', 'corrigir', 'refatorar', 'documentar', 'testar', 'migrar', 'otimizar', 'adicionar', 'remover', 'configurar', 'integrar', 'create', 'implement', 'fix', 'build', 'add'];
  const normalized = normalize(prompt);
  if (actionVerbs.some(v => normalized.includes(normalize(v)))) clarezaScore += 30;
  scores.clareza = Math.min(100, clarezaScore);
  details.clareza = objectiveLen >= 5 ? 'Objetivo claro e detalhado' : objectiveLen > 0 ? 'Objetivo presente mas pode ser mais específico' : 'Objetivo ausente ou implícito';

  // 2. Completude do Contexto (20%)
  let contextoScore = 0;
  const hasContext = prompt.includes('<context>') || prompt.includes('## Contexto') || prompt.includes('# Context') || prompt.includes('"context"') || prompt.includes('Contexto:');
  if (hasContext) contextoScore += 30;
  if (prompt.includes('Projeto:') || prompt.includes('Project:')) contextoScore += 15;
  if (prompt.includes('Stack:') || prompt.includes('stack')) contextoScore += 15;
  if (prompt.includes('Fase') || prompt.includes('phase')) contextoScore += 10;
  if (prompt.includes('KIT_OURO') || prompt.includes('Kit')) contextoScore += 15;
  if (prompt.includes('componente') || prompt.includes('módulo') || prompt.includes('arquivo')) contextoScore += 15;
  scores.contexto = Math.min(100, contextoScore);
  details.contexto = contextoScore >= 60 ? 'Contexto rico e completo' : contextoScore >= 30 ? 'Contexto parcial — pode melhorar' : 'Contexto insuficiente';

  // 3. Especificidade (20%)
  let especificidadeScore = 0;
  const promptLen = prompt.length;
  if (promptLen > 500) especificidadeScore += 20;
  else if (promptLen > 200) especificidadeScore += 10;
  // Constraints
  if (prompt.includes('<constraints>') || prompt.includes('Restrições') || prompt.includes('Restrição') || prompt.includes('"constraints"')) especificidadeScore += 20;
  // Specific technical terms
  const techTerms = ['TypeScript', 'React', 'Node', 'API', 'REST', 'GraphQL', 'SQL', 'MongoDB', 'Docker', 'CSS', 'Tailwind', 'Next', 'Vite', 'Jest', 'function', 'class', 'interface', 'type'];
  const techCount = techTerms.filter(t => prompt.includes(t)).length;
  especificidadeScore += Math.min(30, techCount * 10);
  // Numbered steps or bullet points
  if (prompt.match(/\d+\.\s/) || prompt.match(/^-\s/m)) especificidadeScore += 15;
  // Avoid vague words
  const vagueWords = ['talvez', 'maybe', 'possibly', 'algo', 'alguma coisa', 'something'];
  if (!vagueWords.some(v => normalized.includes(v))) especificidadeScore += 15;
  scores.especificidade = Math.min(100, especificidadeScore);
  details.especificidade = especificidadeScore >= 60 ? 'Altamente específico' : especificidadeScore >= 30 ? 'Moderadamente específico' : 'Muito vago — adicione detalhes técnicos';

  // 4. Definição de Formato (15%)
  let formatoScore = 0;
  if (prompt.includes('<response_format>') || prompt.includes('Formato de Saída') || prompt.includes('# Format') || prompt.includes('"expected_output"') || prompt.includes('Output:') || prompt.includes('expected_result') || prompt.includes('Resultado:')) formatoScore += 50;
  if (prompt.includes('código') || prompt.includes('code') || prompt.includes('JSON') || prompt.includes('markdown') || prompt.includes('lista')) formatoScore += 25;
  if (prompt.includes('<verify>') || prompt.includes('verifique') || prompt.includes('checklist')) formatoScore += 25;
  scores.formato = Math.min(100, formatoScore);
  details.formato = formatoScore >= 50 ? 'Formato bem definido' : formatoScore > 0 ? 'Formato implícito — defina explicitamente' : 'Formato de saída não definido';

  // 5. Estrutura/Framework (10%)
  let estruturaScore = 0;
  const hasFrameworkStructure = prompt.includes('<context>') || prompt.includes('<role>') || prompt.includes('# Role') || prompt.includes('# Context') || prompt.includes('"context"');
  if (hasFrameworkStructure) estruturaScore += 40;
  // Section count
  const sectionCount = (prompt.match(/<\w+>/g) || []).length + (prompt.match(/^#{1,3}\s/gm) || []).length;
  estruturaScore += Math.min(40, sectionCount * 8);
  // Consistent formatting
  if (prompt.includes('</') || prompt.match(/^#{1,3}\s.*\n\n/m)) estruturaScore += 20;
  scores.estrutura = Math.min(100, estruturaScore);
  details.estrutura = estruturaScore >= 60 ? 'Bem estruturado com framework' : estruturaScore >= 30 ? 'Estrutura parcial' : 'Sem estrutura clara';

  // 6. Anti-Ambiguidade (10%)
  let antiAmbScore = 0;
  // Explicit "do not" / negative constraints
  if (prompt.includes('não faça') || prompt.includes('evite') || prompt.includes('do not') || prompt.includes('avoid')) antiAmbScore += 25;
  // Examples or references
  if (prompt.includes('exemplo') || prompt.includes('example') || prompt.includes('<examples>')) antiAmbScore += 25;
  // Specific file/function references
  if (prompt.match(/\w+\.\w{2,4}/) || prompt.match(/\w+\(\)/)) antiAmbScore += 25;
  // Length suggests detail
  if (promptLen > 300) antiAmbScore += 25;
  scores.antiambiguidade = Math.min(100, antiAmbScore);
  details.antiambiguidade = antiAmbScore >= 50 ? 'Baixa ambiguidade' : antiAmbScore >= 25 ? 'Alguma ambiguidade — adicione restrições ou exemplos' : 'Alta ambiguidade — clarificar intenção';

  // Weighted total
  let total = 0;
  for (const [key, criteria] of Object.entries(SCORE_CRITERIA)) {
    total += (scores[key] * criteria.weight) / 100;
  }
  total = Math.round(total);

  // Grade
  let grade;
  if (total >= 90) grade = 'S';
  else if (total >= 80) grade = 'A';
  else if (total >= 65) grade = 'B';
  else if (total >= 50) grade = 'C';
  else if (total >= 35) grade = 'D';
  else grade = 'F';

  return {
    total,
    grade,
    criteria: Object.fromEntries(
      Object.entries(SCORE_CRITERIA).map(([key, c]) => [key, {
        label: c.label,
        weight: c.weight,
        score: scores[key],
        weighted: Math.round((scores[key] * c.weight) / 100),
        detail: details[key],
      }])
    ),
  };
}

// Backwards-compatible simple score
function scorePrompt(prompt) {
  return deepScore(prompt).total;
}

// ==================== VERIFICATION ====================

function verifyPrompt(prompt) {
  const issues = [];
  const ds = deepScore(prompt);

  // Check each criterion
  if (ds.criteria.clareza.score < 40) issues.push('Objetivo não está claramente definido');
  if (ds.criteria.contexto.score < 30) issues.push('Falta contexto do projeto');
  if (ds.criteria.formato.score < 25) issues.push('Formato de saída não definido');
  if (ds.criteria.especificidade.score < 30) issues.push('Prompt muito vago — adicione detalhes técnicos');
  if (ds.criteria.antiambiguidade.score < 25) issues.push('Alta ambiguidade — adicione restrições ou exemplos');

  // Length check
  if (prompt.length < 80) issues.push('Prompt muito curto para garantir qualidade');

  return {
    ok: issues.length === 0,
    score: ds.total,
    grade: ds.grade,
    deepScore: ds,
    issues,
    sugestoes: issues.map(i => {
      if (i.includes('Objetivo')) return 'Adicione um objetivo específico e mensurável com verbo de ação';
      if (i.includes('contexto')) return 'Inclua contexto: projeto, stack, fase, módulo afetado';
      if (i.includes('Formato')) return 'Defina o formato esperado (código, markdown, JSON, lista)';
      if (i.includes('vago')) return 'Adicione nomes de arquivos, funções, tecnologias específicas';
      if (i.includes('ambiguidade')) return 'Adicione exemplos, restrições negativas (não faça X), ou referências concretas';
      if (i.includes('curto')) return 'Expanda com contexto, restrições e formato de saída';
      return 'Revise o prompt para maior clareza';
    })
  };
}

// ==================== OPTIMIZE (Rewrite weak prompts) ====================

function optimize(rawPrompt, options = {}) {
  const modelo = options.modelo || 'claude';
  const ouroDir = options.ouroDir || findOuroDir();

  // Score the original
  const originalScore = deepScore(rawPrompt);

  // Detect intent from the raw prompt
  const tipo = options.tipo || detectTaskType(rawPrompt);
  const complexity = detectComplexity(rawPrompt);
  const technique = selectTechnique(complexity);

  // Extract the core objective (strip any existing structure)
  let objective = rawPrompt
    .replace(/<\/?[^>]+>/g, ' ')           // Remove XML tags
    .replace(/^#{1,3}\s+.+$/gm, '')       // Remove markdown headers
    .replace(/^\s*[-*]\s+/gm, '')          // Remove bullet points
    .replace(/\s+/g, ' ')                   // Collapse whitespace
    .trim();

  // Build with best framework for this type
  const framework = selectFramework(tipo);
  const fwData = buildFramework(objective, { ...options, ouroDir, tipo, framework });

  // Format for target model
  const optimizedPrompt = applyTechnique(formatForModel(fwData, modelo), technique);

  // Score the optimized version
  const optimizedScore = deepScore(optimizedPrompt);

  // Calculate improvement
  const improvement = optimizedScore.total - originalScore.total;

  return {
    original: {
      prompt: rawPrompt,
      score: originalScore,
    },
    optimized: {
      prompt: optimizedPrompt,
      score: optimizedScore,
      framework,
      frameworkLabel: FRAMEWORK_LABELS[framework],
      technique,
      techniqueLabel: TECHNIQUE_LABELS[technique],
      modelo,
    },
    improvement,
    improvementPct: originalScore.total > 0 ? Math.round((improvement / originalScore.total) * 100) : 0,
    tipo,
    complexity,
    fwData,
  };
}

// ==================== SIMULATE (Predict effectiveness) ====================

function simulate(prompt, modelo) {
  modelo = modelo || 'claude';
  const profile = MODEL_PROFILES[modelo] || MODEL_PROFILES.claude;
  const ds = deepScore(prompt);
  const tokenEstimate = Math.ceil(prompt.length / 4);

  // Model fit analysis
  const modelFit = {};

  for (const [modelKey, mp] of Object.entries(MODEL_PROFILES)) {
    let fitScore = 0;

    // Token fit
    if (tokenEstimate < mp.maxTokens * 0.1) fitScore += 30;
    else if (tokenEstimate < mp.maxTokens * 0.5) fitScore += 20;
    else fitScore += 10;

    // Format fit
    const fmt = MODEL_FORMATS[modelKey];
    if (fmt === 'xml' && prompt.includes('<')) fitScore += 25;
    else if (fmt === 'json-schema' && prompt.includes('{')) fitScore += 25;
    else if (fmt === 'markdown' && prompt.includes('#')) fitScore += 25;
    else if (fmt === 'conciso' && prompt.length < 500) fitScore += 25;
    else if (fmt === 'few-shot' && prompt.includes('Exemplo')) fitScore += 25;
    else fitScore += 10; // Neutral

    // Complexity fit
    const complexity = detectComplexity(prompt);
    if (complexity === 'critical' && mp.costTier === 'premium') fitScore += 25;
    else if (complexity === 'simple' && mp.costTier === 'free') fitScore += 25;
    else if (complexity === 'medium') fitScore += 20;
    else fitScore += 15;

    // Base quality contribution
    fitScore += Math.round(ds.total * 0.2);

    modelFit[modelKey] = {
      name: mp.name,
      fitScore: Math.min(100, fitScore),
      costTier: mp.costTier,
      strengths: mp.strengths,
      maxTokens: mp.maxTokens,
    };
  }

  // Sort models by fit
  const ranking = Object.entries(modelFit)
    .sort(([, a], [, b]) => b.fitScore - a.fitScore)
    .map(([key, data], idx) => ({ rank: idx + 1, model: key, ...data }));

  // Predict success probability
  let successProb = ds.total;
  if (modelFit[modelo]) {
    successProb = Math.round((ds.total * 0.6) + (modelFit[modelo].fitScore * 0.4));
  }

  // Risk factors
  const risks = [];
  if (ds.total < 50) risks.push('Score baixo — prompt pode gerar resultado impreciso');
  if (tokenEstimate > profile.maxTokens * 0.8) risks.push('Prompt próximo do limite de tokens do modelo');
  if (ds.criteria.clareza.score < 40) risks.push('Objetivo vago — IA pode interpretar errado');
  if (ds.criteria.antiambiguidade.score < 25) risks.push('Alta ambiguidade — múltiplas interpretações possíveis');
  if (ds.criteria.formato.score < 25) risks.push('Sem formato definido — saída pode ser inconsistente');

  // Suggestions
  const suggestions = [];
  if (modelFit[modelo]?.fitScore < ranking[0].fitScore - 10) {
    suggestions.push(`Considere usar ${ranking[0].name} (fit ${ranking[0].fitScore}) em vez de ${profile.name} (fit ${modelFit[modelo]?.fitScore})`);
  }
  if (ds.total < 70) suggestions.push('Use `ouro-prompt optimize` para melhorar o prompt antes de executar');
  if (!prompt.includes('<verify>') && !prompt.includes('verifique')) suggestions.push('Adicione bloco de verificação para auto-correção');

  return {
    prompt_score: ds,
    tokens_estimados: tokenEstimate,
    modelo_alvo: modelo,
    modelo_profile: profile,
    success_probability: successProb,
    risks,
    suggestions,
    model_ranking: ranking,
    best_model: ranking[0],
  };
}

// ==================== A/B COMPARE ====================

function compare(promptA, promptB, modelo) {
  modelo = modelo || 'claude';
  const scoreA = deepScore(promptA);
  const scoreB = deepScore(promptB);
  const simA = simulate(promptA, modelo);
  const simB = simulate(promptB, modelo);

  const comparison = {};
  for (const [key, criteria] of Object.entries(SCORE_CRITERIA)) {
    const a = scoreA.criteria[key].score;
    const b = scoreB.criteria[key].score;
    comparison[key] = {
      label: criteria.label,
      promptA: a,
      promptB: b,
      diff: a - b,
      winner: a > b ? 'A' : b > a ? 'B' : 'empate',
    };
  }

  return {
    promptA: { score: scoreA, simulation: simA, length: promptA.length, tokens: Math.ceil(promptA.length / 4) },
    promptB: { score: scoreB, simulation: simB, length: promptB.length, tokens: Math.ceil(promptB.length / 4) },
    comparison,
    winner: scoreA.total > scoreB.total ? 'A' : scoreB.total > scoreA.total ? 'B' : 'empate',
    diff: Math.abs(scoreA.total - scoreB.total),
  };
}

// ==================== STATISTICS ====================

function getStats(ouroDir) {
  ouroDir = ouroDir || findOuroDir();
  const projectRoot = findProjectRoot();

  // Load prompt history
  const historicoPath = ouroDir
    ? path.join(ouroDir, 'analytics', 'prompts', 'historico.json')
    : null;
  const historico = historicoPath ? (readJSON(historicoPath) || []) : [];

  // Load top prompts
  const topPath = path.join(projectRoot, 'prompt-engine', 'library', 'top_prompts.json');
  const topPrompts = readJSON(topPath) || [];

  // Calculate stats
  const totalPrompts = historico.length;
  const totalTop = topPrompts.length;

  // By type
  const byType = {};
  for (const p of historico) {
    const t = p.tipo || 'desconhecido';
    if (!byType[t]) byType[t] = { total: 0, tokens: 0 };
    byType[t].total++;
    byType[t].tokens += parseInt(p.tokens) || 0;
  }

  // By model
  const byModel = {};
  for (const p of historico) {
    const m = p.ia || p.modelo || 'claude';
    if (!byModel[m]) byModel[m] = { total: 0, tokens: 0 };
    byModel[m].total++;
    byModel[m].tokens += parseInt(p.tokens) || 0;
  }

  // Score distribution from top prompts
  const scoreDistribution = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const tp of topPrompts) {
    const s = tp.score || 0;
    if (s >= 90) scoreDistribution.S++;
    else if (s >= 80) scoreDistribution.A++;
    else if (s >= 65) scoreDistribution.B++;
    else if (s >= 50) scoreDistribution.C++;
    else if (s >= 35) scoreDistribution.D++;
    else scoreDistribution.F++;
  }

  // Average score
  const avgScore = topPrompts.length > 0
    ? Math.round(topPrompts.reduce((sum, p) => sum + (p.score || 0), 0) / topPrompts.length)
    : 0;

  // Total tokens
  const totalTokens = historico.reduce((sum, p) => sum + (parseInt(p.tokens) || 0), 0);

  // Framework usage
  const byFramework = {};
  for (const tp of topPrompts) {
    const fw = tp.framework || 'desconhecido';
    if (!byFramework[fw]) byFramework[fw] = 0;
    byFramework[fw]++;
  }

  // Technique usage
  const byTechnique = {};
  for (const tp of topPrompts) {
    const tech = tp.tecnica || 'desconhecido';
    if (!byTechnique[tech]) byTechnique[tech] = 0;
    byTechnique[tech]++;
  }

  // Efficiency: tokens per prompt (lower is more efficient)
  const avgTokensPerPrompt = totalPrompts > 0
    ? Math.round(totalTokens / totalPrompts)
    : 0;

  return {
    total_prompts: totalPrompts,
    total_top_prompts: totalTop,
    total_tokens: totalTokens,
    avg_score: avgScore,
    avg_tokens_per_prompt: avgTokensPerPrompt,
    score_distribution: scoreDistribution,
    by_type: byType,
    by_model: byModel,
    by_framework: byFramework,
    by_technique: byTechnique,
    efficiency_ratio: avgScore > 0 && avgTokensPerPrompt > 0
      ? Math.round((avgScore / avgTokensPerPrompt) * 100) / 100
      : 0,
    timestamp: now(),
  };
}

// ==================== VARIATIONS (Enhanced) ====================

function generateVariations(objective, options = {}) {
  const modelo = options.modelo || 'claude';
  const n = options.variations || 3;
  const ouroDir = options.ouroDir || findOuroDir();
  const tipo = options.tipo || detectTaskType(objective);
  const complexity = detectComplexity(objective);
  const technique = selectTechnique(complexity);
  const variations = [];

  // Variation 1: Best framework + best technique for this task
  const fw1 = selectFramework(tipo);
  const fwData1 = buildFramework(objective, { ...options, ouroDir, tipo, framework: fw1 });
  const prompt1 = applyTechnique(formatForModel(fwData1, modelo), technique);
  variations.push({
    id: 1,
    framework: fw1,
    frameworkLabel: FRAMEWORK_LABELS[fw1],
    technique,
    modelo,
    prompt: prompt1,
    score: deepScore(prompt1),
    label: `${FRAMEWORK_LABELS[fw1].split(' ')[0]} + ${TECHNIQUE_LABELS[technique]}`,
  });

  if (n >= 2) {
    // Variation 2: CO-STAR (always generate one CO-STAR as it's the most complete)
    if (fw1 !== 'costar') {
      const fwData2 = buildCOSTAR(objective, { ...options, ouroDir, tipo });
      const prompt2 = applyTechnique(formatForModel(fwData2, modelo), technique);
      variations.push({
        id: 2,
        framework: 'costar',
        frameworkLabel: FRAMEWORK_LABELS.costar,
        technique,
        modelo,
        prompt: prompt2,
        score: deepScore(prompt2),
        label: `CO-STAR + ${TECHNIQUE_LABELS[technique]}`,
      });
    } else {
      // Use RTF for a leaner alternative
      const fwData2 = buildRTF(objective, { ...options, ouroDir, tipo });
      const technique2 = technique === 'zero-shot' ? 'few-shot-cot' : 'zero-shot';
      const prompt2 = applyTechnique(formatForModel(fwData2, modelo), technique2);
      variations.push({
        id: 2,
        framework: 'rtf',
        frameworkLabel: FRAMEWORK_LABELS.rtf,
        technique: technique2,
        modelo,
        prompt: prompt2,
        score: deepScore(prompt2),
        label: `RTF + ${TECHNIQUE_LABELS[technique2]}`,
      });
    }
  }

  if (n >= 3) {
    // Variation 3: CARE with examples placeholder
    const fwData3 = buildCARE(objective, { ...options, ouroDir, tipo });
    const prompt3 = applyTechnique(formatForModel(fwData3, modelo), 'few-shot-cot');
    variations.push({
      id: 3,
      framework: 'care',
      frameworkLabel: FRAMEWORK_LABELS.care,
      technique: 'few-shot-cot',
      modelo,
      prompt: prompt3,
      score: deepScore(prompt3),
      label: `CARE + Few-Shot CoT`,
    });
  }

  if (n >= 4) {
    // Variation 4: Concise for fast execution
    const fwData4 = buildRTF(objective, { ...options, ouroDir, tipo });
    const prompt4 = formatConcise(fwData4);
    variations.push({
      id: 4,
      framework: 'conciso',
      frameworkLabel: 'Conciso (mínimo viável)',
      technique: 'zero-shot',
      modelo,
      prompt: prompt4,
      score: deepScore(prompt4),
      label: 'Conciso + Zero-Shot (rápido)',
    });
  }

  // Sort by total score descending
  variations.sort((a, b) => b.score.total - a.score.total);
  variations.forEach((v, i) => v.rank = i + 1);

  return variations;
}

// ==================== TOP PROMPTS BANK ====================

function getTopPromptsPath() {
  const projectRoot = findProjectRoot();
  return path.join(projectRoot, 'prompt-engine', 'library', 'top_prompts.json');
}

function loadTopPrompts() {
  return readJSON(getTopPromptsPath()) || [];
}

function saveToTopPrompts(entry) {
  const filePath = getTopPromptsPath();
  const bank = readJSON(filePath) || [];

  const id = `tp_${String(bank.length + 1).padStart(3, '0')}`;
  const record = {
    id,
    nome: entry.nome || (entry.objective || entry.prompt || '').slice(0, 50).trim(),
    tipo: entry.tipo,
    framework: entry.framework || 'costar',
    modelo_alvo: entry.modelo || 'claude',
    tecnica: entry.technique || 'zero-shot',
    score: entry.score,
    usos: 1,
    template: entry.prompt,
    costar: entry.costar || null,
    criado: today(),
    ultima_atualizacao: today(),
  };

  bank.push(record);
  writeJSON(filePath, bank);
  return record;
}

function getTopByType(tipo, limit) {
  const bank = loadTopPrompts();
  const filtered = tipo ? bank.filter(p => p.tipo === tipo) : bank;
  return filtered.sort((a, b) => b.score - a.score).slice(0, limit || 10);
}

function incrementUsage(promptId) {
  const filePath = getTopPromptsPath();
  const bank = readJSON(filePath) || [];
  const prompt = bank.find(p => p.id === promptId);
  if (prompt) {
    prompt.usos = (prompt.usos || 0) + 1;
    prompt.ultima_atualizacao = today();
    writeJSON(filePath, bank);
  }
  return prompt;
}

// ==================== TEMPLATES ====================

function loadTemplates() {
  const projectRoot = findProjectRoot();
  const templatesDir = path.join(projectRoot, 'prompt-engine', 'library', 'templates');
  if (!fs.existsSync(templatesDir)) return {};

  const templates = {};
  try {
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const name = file.replace('.md', '');
      templates[name] = readFile(path.join(templatesDir, file));
    }
  } catch { /* silent */ }
  return templates;
}

// ==================== MAIN GENERATE (Enhanced) ====================

function generate(objective, options = {}) {
  const modelo = options.modelo || 'claude';
  const ouroDir = options.ouroDir || findOuroDir();
  const tipo = options.tipo || detectTaskType(objective);
  const complexity = detectComplexity(objective);
  const technique = options.technique || selectTechnique(complexity);
  const framework = options.framework || selectFramework(tipo);

  // Trigger Engine (v0.6) — detect relevant Kit Ouro patterns
  const te = getTriggerEngine();
  const contextMap = { codigo: 'executar', debug: 'debug', testes: 'executar', refactor: 'executar', documentacao: 'executar', arquitetura: 'planejar' };
  const triggerContext = contextMap[tipo] || 'executar';
  const triggerMatches = te.matchTriggers(objective, triggerContext);
  const triggerInjection = triggerMatches.length > 0 ? te.buildContextInjection(triggerMatches, { maxPatterns: 3 }) : '';
  const triggerChecklists = triggerMatches.reduce((acc, m) => {
    if (m.checklist) {
      const items = te.getChecklist(m.checklist);
      if (items.length > 0) acc.push({ id: m.id, items });
    }
    return acc;
  }, []);

  // Build with best framework
  const fwData = buildFramework(objective, { ...options, ouroDir, tipo, framework });

  // Inject trigger data into _meta for format functions
  if (fwData._meta) {
    fwData._meta.triggerInjection = triggerInjection;
    fwData._meta.triggerChecklists = triggerChecklists;
    fwData._meta.triggerMatches = triggerMatches.map(m => m.id);
  }

  // Format for target model
  const prompt = applyTechnique(formatForModel(fwData, modelo), technique);

  // Deep score
  const ds = deepScore(prompt);

  // Verification
  const verification = verifyPrompt(prompt);

  // Simulation
  const sim = simulate(prompt, modelo);

  return {
    prompt,
    fwData,
    framework,
    frameworkLabel: FRAMEWORK_LABELS[framework],
    modelo,
    modelProfile: MODEL_PROFILES[modelo],
    tipo,
    complexity,
    technique,
    techniqueLabel: TECHNIQUE_LABELS[technique],
    score: ds.total,
    grade: ds.grade,
    deepScore: ds,
    verification,
    simulation: sim,
    triggers: triggerMatches.map(m => m.id),
    triggerChecklists,
    tokens_estimados: Math.ceil(prompt.length / 4),
    timestamp: now(),
  };
}

// ==================== AI-POWERED GENERATION (Meta-Prompting) ====================

const CREATOR_MODELS = {
  gemini:   { provider: 'google',   model: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  deepseek: { provider: 'deepseek', model: 'deepseek-chat',    label: 'DeepSeek V3' },
  codestral:{ provider: 'mistral',  model: 'codestral-latest',  label: 'Codestral' },
};

function buildMetaPrompt(objective, options = {}) {
  const alvo = options.modelo || 'claude';
  const ouroDir = options.ouroDir || findOuroDir();
  const ctx = loadContext(ouroDir);
  const info = extractProjectInfo(ctx);
  const tipo = options.tipo || detectTaskType(objective);
  const complexity = detectComplexity(objective);
  const technique = selectTechnique(complexity);
  const framework = options.framework || selectFramework(tipo);
  const alvoProfile = MODEL_PROFILES[alvo] || MODEL_PROFILES.claude;
  const format = MODEL_FORMATS[alvo] || 'markdown';

  // Context block
  const ctxLines = [];
  if (info.nome) ctxLines.push(`- Projeto: ${info.nome}`);
  if (info.stack) ctxLines.push(`- Stack: ${info.stack}`);
  if (info.fase && info.fase !== '—') ctxLines.push(`- Fase: ${info.fase}`);
  if (ctx.kit && ctx.kit.length > 50) ctxLines.push(`- Kit de componentes: sim (KIT_OURO.md)`);
  const ctxBlock = ctxLines.length > 0 ? ctxLines.join('\n') : '- Projeto em desenvolvimento';

  // Format instructions
  const formatInstructions = {
    xml: 'Use XML tags: <context>, <objective>, <style>, <tone>, <audience>, <response_format>, <constraints>, <verify>. Claude responde melhor a XML tags explícitas.',
    'json-schema': 'Use JSON estruturado com campos: context, task, style, tone, audience, expected_output, constraints. GPT responde melhor a structured output.',
    markdown: 'Use Markdown com headers: # Tarefa, ## Contexto, ## Estilo, ## Formato de Saída, ## Restrições. Gemini responde bem a markdown estruturado com long context.',
    conciso: 'Seja DIRETO e CONCISO. Formato: Contexto (1 linha), Tarefa (1 linha), Output (1 linha), Restrição (1 linha). DeepSeek é técnico e direto.',
    'few-shot': 'Use formato few-shot: ### Instruções, Contexto, Tarefa, ### Exemplo de saída esperada, ### Execute. Groq/Llama responde melhor com exemplos.',
  };

  const techniqueInstructions = {
    'zero-shot': 'Não adicione instruções extras de raciocínio.',
    'few-shot-cot': 'Adicione ao final: "Pense passo a passo antes de responder."',
    'tree-of-thought': 'Adicione ao final: "Considere pelo menos 2 abordagens. Analise prós e contras. Escolha a melhor."',
    'self-consistency': 'Adicione ao final: "Gere 3 soluções independentes. Compare e apresente a mais robusta."',
  };

  // Trigger Engine (v0.6) — inject patterns into meta-prompt
  const te = getTriggerEngine();
  const triggerMatches = te.matchTriggers(objective, 'executar');
  const triggerBlock = triggerMatches.length > 0
    ? `\n## Padrões Kit Ouro Detectados\n${te.buildContextInjection(triggerMatches, { maxPatterns: 3 })}\n`
    : '';

  return `Você é um engenheiro de prompts especialista. Sua tarefa é criar o prompt MAIS EFICAZ possível.

## Objetivo do Usuário
${objective}

## Contexto do Projeto
${ctxBlock}
${triggerBlock}
## Modelo Alvo
- Modelo: ${alvoProfile.name}
- Contexto máximo: ${alvoProfile.maxTokens} tokens
- Pontos fortes: ${alvoProfile.strengths}
- Formato ideal: ${format}

## Instruções de Formato
${formatInstructions[format] || formatInstructions.markdown}

## Técnica a Aplicar
${techniqueInstructions[technique] || techniqueInstructions['zero-shot']}

## Framework: ${FRAMEWORK_LABELS[framework]}
${framework === 'costar' ? 'Estruture com: Context, Objective, Style, Tone, Audience, Response' : framework === 'rtf' ? 'Estruture com: Role, Task, Format' : 'Estruture com: Context, Action, Result, Examples'}

## Regras
1. O prompt gerado deve ser COMPLETO e PRONTO PARA USAR (copiar e colar)
2. Inclua bloco de verificação/constraints quando relevante
3. Seja específico — evite ambiguidade
4. Otimize para o modelo alvo (formato, tokens, estilo)
5. NÃO explique o prompt — retorne APENAS o prompt gerado
6. O prompt deve ter score alto nos critérios: clareza, contexto, especificidade, formato, estrutura, anti-ambiguidade

Gere o prompt otimizado agora:`;
}

async function generateWithAI(objective, options = {}) {
  const aiProviders = require('./ai-providers');
  const criador = options.criador || 'gemini';
  const modelo = options.modelo || 'claude';
  const ouroDir = options.ouroDir || findOuroDir();

  const creatorConfig = CREATOR_MODELS[criador];
  if (!creatorConfig) {
    throw new Error(`Criador "${criador}" não suportado. Use: ${Object.keys(CREATOR_MODELS).join(', ')}`);
  }

  // Build meta-prompt
  const metaPrompt = buildMetaPrompt(objective, { ...options, modelo, ouroDir });

  // Call the creator AI
  const result = await aiProviders.call(metaPrompt, {
    provider: creatorConfig.provider,
    model: creatorConfig.model,
    system: 'Você é um engenheiro de prompts de elite. Gere APENAS o prompt otimizado, sem explicações.',
    max_tokens: 4096,
    temperature: 0.4,
  });

  const generatedPrompt = result.content.trim();

  // Score the AI-generated prompt
  const ds = deepScore(generatedPrompt);
  const verification = verifyPrompt(generatedPrompt);
  const sim = simulate(generatedPrompt, modelo);

  // Also generate a local version for comparison
  const localResult = generate(objective, { ...options, modelo, ouroDir });

  return {
    prompt: generatedPrompt,
    criador,
    criadorLabel: creatorConfig.label,
    modelo,
    modelProfile: MODEL_PROFILES[modelo],
    score: ds.total,
    grade: ds.grade,
    deepScore: ds,
    verification,
    simulation: sim,
    tokens_estimados: Math.ceil(generatedPrompt.length / 4),
    ai_tokens: result.tokens,
    ai_latency_ms: result.latency_ms,
    local_comparison: {
      prompt: localResult.prompt,
      score: localResult.score,
      grade: localResult.grade,
    },
    improvement_over_local: ds.total - localResult.score,
    timestamp: now(),
  };
}

async function optimizeWithAI(rawPrompt, options = {}) {
  const aiProviders = require('./ai-providers');
  const criador = options.criador || 'gemini';
  const modelo = options.modelo || 'claude';

  const creatorConfig = CREATOR_MODELS[criador];
  if (!creatorConfig) {
    throw new Error(`Criador "${criador}" não suportado. Use: ${Object.keys(CREATOR_MODELS).join(', ')}`);
  }

  const originalScore = deepScore(rawPrompt);
  const alvoProfile = MODEL_PROFILES[modelo] || MODEL_PROFILES.claude;
  const format = MODEL_FORMATS[modelo] || 'markdown';

  const metaPrompt = `Você é um engenheiro de prompts de elite. Reescreva o prompt abaixo para ser MUITO mais eficaz.

## Prompt Original
${rawPrompt}

## Modelo Alvo
${alvoProfile.name} (formato ideal: ${format})
Pontos fortes: ${alvoProfile.strengths}

## Problemas Detectados no Original
- Score atual: ${originalScore.total}/100 (${originalScore.grade})
${Object.entries(originalScore.criteria).map(([k, c]) => `- ${c.label}: ${c.score}/100 — ${c.detail}`).join('\n')}

## Instruções
1. Mantenha o MESMO objetivo, mas otimize tudo
2. Use o formato ideal para ${alvoProfile.name}
3. Adicione contexto, constraints, e formato de saída
4. Elimine ambiguidades
5. Retorne APENAS o prompt reescrito, sem explicações

Prompt otimizado:`;

  const result = await aiProviders.call(metaPrompt, {
    provider: creatorConfig.provider,
    model: creatorConfig.model,
    system: 'Você é um engenheiro de prompts. Retorne APENAS o prompt otimizado.',
    max_tokens: 4096,
    temperature: 0.3,
  });

  const optimizedPrompt = result.content.trim();
  const optimizedScore = deepScore(optimizedPrompt);

  return {
    original: { prompt: rawPrompt, score: originalScore },
    optimized: { prompt: optimizedPrompt, score: optimizedScore },
    criador,
    criadorLabel: creatorConfig.label,
    modelo,
    improvement: optimizedScore.total - originalScore.total,
    improvementPct: originalScore.total > 0
      ? Math.round(((optimizedScore.total - originalScore.total) / originalScore.total) * 100)
      : 0,
    ai_tokens: result.tokens,
    ai_latency_ms: result.latency_ms,
  };
}

// ==================== EXPORTS ====================

module.exports = {
  // Core generation
  generate,
  generateWithAI,
  optimize,
  optimizeWithAI,
  generateVariations,

  // Framework builders
  buildFramework,
  buildCOSTAR,
  buildRTF,
  buildCARE,
  selectFramework,

  // Model formatting
  formatForModel,
  applyTechnique,

  // Detection
  detectTaskType,
  detectComplexity,
  selectTechnique,

  // Scoring & Verification
  deepScore,
  scorePrompt,
  verifyPrompt,

  // Simulation & Comparison
  simulate,
  compare,

  // Statistics
  getStats,

  // Bank
  loadTopPrompts,
  saveToTopPrompts,
  getTopByType,
  incrementUsage,

  // Guided Mode (Iterative Refinement)
  getGuidedQuestions,
  generateFromAnswers,
  GUIDED_QUESTIONS,

  // Templates & Context
  loadTemplates,
  loadContext,
  extractProjectInfo,

  // Utils
  findOuroDir,
  findProjectRoot,

  // AI helpers
  buildMetaPrompt,
  CREATOR_MODELS,

  // Constants
  TECHNIQUE_LABELS,
  FRAMEWORK_LABELS,
  TONE_LABELS,
  RESPONSE_LABELS,
  MODEL_FORMATS,
  MODEL_PROFILES,
  SCORE_CRITERIA,
};
