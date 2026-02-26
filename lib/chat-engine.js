#!/usr/bin/env node

/**
 * GSD Ouro — Chat Engine v0.7
 * Motor de chat interativo: linguagem natural → interpretacao → prompt CO-STAR
 *
 * Fluxo: mensagem → classifyIntent → interpretAndExplain → usuario confirma → generateFinalPrompt
 */

'use strict';

const fs = require('fs');
const path = require('path');

const OURO_DIR = path.join(process.cwd(), '.ouro');
const CHAT_DIR = path.join(OURO_DIR, 'chat');
const HISTORY_FILE = path.join(CHAT_DIR, 'history.json');

// ── Intent Classification ──

const INTENT_PATTERNS = [
  { intent: 'generate_prompt', keywords: ['quero', 'criar', 'fazer', 'implementar', 'adicionar', 'construir', 'desenvolver', 'gerar', 'montar', 'preciso'] },
  { intent: 'ask_question', keywords: ['como', 'o que', 'qual', 'onde', 'quando', 'por que', 'porque', 'explica', 'funciona', 'significa'] },
  { intent: 'fix_bug', keywords: ['erro', 'bug', 'quebrou', 'nao funciona', 'problema', 'falha', 'corrigir', 'fix', 'debug', 'travou'] },
  { intent: 'refactor', keywords: ['refatorar', 'melhorar', 'otimizar', 'limpar', 'reorganizar', 'simplificar'] },
  { intent: 'confirm', keywords: ['sim', 'isso', 'correto', 'exato', 'confirmo', 'autorizo', 'pode', 'ok', 'positivo'] },
  { intent: 'deny', keywords: ['nao', 'errado', 'incorreto', 'muda', 'altera', 'troca', 'ajusta', 'diferente'] },
  { intent: 'note', keywords: ['anotar', 'lembrar', 'nota', 'ideia', 'depois', 'futuro', 'registrar', 'guardar'] }
];

function classifyIntent(message) {
  const lower = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let best = { intent: 'generate_prompt', score: 0 };

  for (const pattern of INTENT_PATTERNS) {
    let score = 0;
    for (const kw of pattern.keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(kwNorm)) score++;
    }
    if (score > best.score) {
      best = { intent: pattern.intent, score };
    }
  }

  return best.intent;
}

// ── Interpretation ──

function detectModule(text) {
  const modules = ['auth', 'login', 'usuario', 'user', 'admin', 'dashboard', 'financeiro', 'relatorio',
    'header', 'sidebar', 'footer', 'nav', 'menu', 'home', 'config', 'settings', 'perfil', 'profile',
    'imovel', 'veiculo', 'conta', 'pagamento', 'payment', 'cadastro', 'form', 'lista', 'tabela'];
  const lower = text.toLowerCase();
  return modules.filter(m => lower.includes(m));
}

function detectComponents(text) {
  const components = ['botao', 'button', 'input', 'form', 'formulario', 'modal', 'dialog', 'tabela', 'table',
    'card', 'lista', 'list', 'select', 'dropdown', 'toggle', 'switch', 'menu', 'nav', 'sidebar',
    'header', 'footer', 'tab', 'tooltip', 'toast', 'alert', 'badge', 'avatar', 'icon'];
  const lower = text.toLowerCase();
  return components.filter(c => lower.includes(c));
}

function detectAction(text) {
  const lower = text.toLowerCase();
  if (/criar|novo|adicionar|implementar/.test(lower)) return 'criar';
  if (/editar|modificar|alterar|mudar|atualizar/.test(lower)) return 'editar';
  if (/remover|deletar|excluir|apagar/.test(lower)) return 'remover';
  if (/corrigir|fix|consertar|resolver/.test(lower)) return 'corrigir';
  if (/refatorar|melhorar|otimizar/.test(lower)) return 'refatorar';
  return 'criar';
}

function interpretAndExplain(userText) {
  const intent = classifyIntent(userText);
  const modules = detectModule(userText);
  const components = detectComponents(userText);
  const action = detectAction(userText);

  const interpretation = {
    original: userText,
    intent,
    action,
    modules: modules.length > 0 ? modules : ['(nao detectado)'],
    components: components.length > 0 ? components : ['(generico)'],
    summary: ''
  };

  // Build human-readable summary
  const actionMap = { criar: 'Criar', editar: 'Editar', remover: 'Remover', corrigir: 'Corrigir', refatorar: 'Refatorar' };
  const actionStr = actionMap[action] || 'Implementar';
  const compStr = components.length > 0 ? components.join(', ') : 'componente';
  const modStr = modules.length > 0 ? ' no modulo ' + modules.join('/') : '';

  interpretation.summary = `${actionStr} ${compStr}${modStr}`;

  return interpretation;
}

// ── Corrections ──

function applyCorrections(interpretation, corrections) {
  const updated = { ...interpretation };

  for (const correction of corrections) {
    const lower = correction.toLowerCase();

    // Module correction
    const newModules = detectModule(correction);
    if (newModules.length > 0) {
      updated.modules = newModules;
    }

    // Negation handling
    if (/nao e|nao no|nao em/.test(lower)) {
      const negModules = detectModule(lower.replace(/nao (e|no|em) /, ''));
      updated.modules = updated.modules.filter(m => !negModules.includes(m));
    }

    // Component correction
    const newComps = detectComponents(correction);
    if (newComps.length > 0) {
      updated.components = newComps;
    }
  }

  // Rebuild summary
  const actionMap = { criar: 'Criar', editar: 'Editar', remover: 'Remover', corrigir: 'Corrigir', refatorar: 'Refatorar' };
  const actionStr = actionMap[updated.action] || 'Implementar';
  const compStr = updated.components.filter(c => c !== '(generico)').join(', ') || 'componente';
  const modStr = updated.modules.filter(m => m !== '(nao detectado)').length > 0
    ? ' no modulo ' + updated.modules.filter(m => m !== '(nao detectado)').join('/')
    : '';
  updated.summary = `${actionStr} ${compStr}${modStr}`;

  return updated;
}

// ── Prompt Generation ──

function generateFinalPrompt(interpretation) {
  let triggerEngine = null;
  try {
    triggerEngine = require('./trigger-engine');
  } catch (e) {
    triggerEngine = { matchTriggers: () => [], buildContextInjection: () => '' };
  }

  const triggers = triggerEngine.matchTriggers(interpretation.original, 'executar');
  const triggerContext = triggerEngine.buildContextInjection(triggers, { maxPatterns: 3 });

  const prompt = {
    framework: 'CO-STAR',
    context: `Projeto usando GSD Ouro. ${interpretation.modules.filter(m => m !== '(nao detectado)').length > 0 ? 'Modulo: ' + interpretation.modules.join(', ') + '.' : ''} Seguir Kit Padrao Ouro.`,
    objective: interpretation.summary,
    style: 'Codigo limpo, componentes Kit Ouro, TailwindCSS + dark mode',
    tone: 'Tecnico e direto',
    audience: 'Desenvolvedor usando Kit Padrao Ouro',
    response: 'Codigo funcional com checklist de verificacao',
    triggers: triggers.map(t => t.id),
    triggerContext: triggerContext
  };

  return prompt;
}

// ── Chat Message Processing ──

function processMessage(message, history, config) {
  const intent = classifyIntent(message);

  if (intent === 'confirm' && history.length > 0) {
    const lastInterp = history[history.length - 1];
    if (lastInterp && lastInterp.interpretation) {
      const prompt = generateFinalPrompt(lastInterp.interpretation);
      return {
        type: 'prompt_generated',
        message: 'Prompt gerado com sucesso!',
        interpretation: lastInterp.interpretation,
        prompt
      };
    }
  }

  if (intent === 'deny' && history.length > 0) {
    return {
      type: 'correction_needed',
      message: 'Entendido. O que precisa ser ajustado?',
      previousInterpretation: history[history.length - 1]?.interpretation || null
    };
  }

  if (intent === 'note') {
    return {
      type: 'note',
      message: 'Nota registrada. Use a aba Notas para gerenciar.',
      text: message
    };
  }

  if (intent === 'ask_question') {
    return {
      type: 'question',
      message: 'Esta e uma pergunta. O chat gera prompts — para perguntas, use diretamente o Claude.',
      original: message
    };
  }

  // Default: interpret as prompt request
  const interpretation = interpretAndExplain(message);

  return {
    type: 'interpretation',
    message: `Entendi: "${interpretation.summary}". Correto?`,
    interpretation,
    suggestions: [
      'Confirme com "sim" para gerar o prompt',
      'Corrija com detalhes (ex: "nao, e no header global")',
      'Adicione contexto (ex: "com estilo premium dark")'
    ]
  };
}

// ── History Management ──

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveHistory(history) {
  ensureDir(CHAT_DIR);
  // Keep last 100 messages
  const trimmed = history.slice(-100);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
  return trimmed;
}

function addToHistory(entry) {
  const history = loadHistory();
  history.push({
    ...entry,
    timestamp: new Date().toISOString()
  });
  return saveHistory(history);
}

function clearHistory() {
  ensureDir(CHAT_DIR);
  fs.writeFileSync(HISTORY_FILE, '[]');
  return [];
}

// ── Exports ──

module.exports = {
  classifyIntent,
  interpretAndExplain,
  applyCorrections,
  generateFinalPrompt,
  processMessage,
  loadHistory,
  saveHistory,
  addToHistory,
  clearHistory,
  detectModule,
  detectComponents,
  detectAction
};
