#!/usr/bin/env node

/**
 * GSD Ouro — Status em Tempo Real
 * Renderiza painel visual no terminal com atualização automática.
 *
 * Uso:
 *   node scripts/status-live.js                  # no diretório do projeto
 *   node scripts/status-live.js --watch           # atualiza a cada 5s
 *   node scripts/status-live.js --watch --interval 3  # atualiza a cada 3s
 *   node scripts/status-live.js --mini            # versão compacta
 *   node scripts/status-live.js --json            # output JSON (para integração)
 */

const fs = require('fs');
const path = require('path');

// ==================== CONFIG ====================

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgMagenta: '\x1b[45m',
  red: '\x1b[31m',
};

const ICONS = {
  done: '\u2705',       // ✅
  pending: '\u23F3',    // ⏳
  fail: '\u274C',       // ❌
  bolt: '\u26A1',       // ⚡
  chart: '\u{1F4CA}',   // 📊
  money: '\u{1F4B0}',   // 💰
  robot: '\u{1F916}',   // 🤖
  quality: '\u2705',    // ✅
  arrow: '\u2192',      // →
  block: '\u2588',      // █
  empty: '\u2591',      // ░
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

function progressBar(pct, width = 20) {
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  return ICONS.block.repeat(filled) + ICONS.empty.repeat(empty);
}

function pad(str, len, char = ' ') {
  const s = String(str);
  return s.length >= len ? s : s + char.repeat(len - s.length);
}

function center(str, len) {
  const s = String(str);
  if (s.length >= len) return s;
  const left = Math.floor((len - s.length) / 2);
  const right = len - s.length - left;
  return ' '.repeat(left) + s + ' '.repeat(right);
}

// ==================== PARSERS ====================

function parseStateMd(content) {
  if (!content) return {};
  const result = {
    fase: null,
    progresso: 0,
    sessao: null,
    ultimaAtividade: null,
    items: [],
    proximasTarefas: [],
    alertas: [],
  };

  // fase_atual:
  const faseMatch = content.match(/fase_atual:\s*(.+)/i);
  if (faseMatch) result.fase = faseMatch[1].trim();

  // progresso:
  const progMatch = content.match(/progresso:\s*(\d+)/i);
  if (progMatch) result.progresso = parseInt(progMatch[1]);

  // sessao:
  const sessMatch = content.match(/sessao:\s*(\d+)/i);
  if (sessMatch) result.sessao = parseInt(sessMatch[1]);

  // ultima_atividade:
  const ativMatch = content.match(/ultima_atividade:\s*(.+)/i);
  if (ativMatch) result.ultimaAtividade = ativMatch[1].trim();

  // Parse table items (| Item | Status |)
  const tableRows = content.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g);
  if (tableRows) {
    for (const row of tableRows) {
      const cols = row.split('|').filter(c => c.trim());
      if (cols.length >= 2) {
        const name = cols[0].trim();
        const status = cols[1].trim();
        // Skip header rows
        if (name === 'Item' || name === '------' || name.startsWith('---')) continue;
        result.items.push({ name, status });
      }
    }
  }

  // Próximas Tarefas
  const nextSection = content.match(/## Próximas Tarefas\n([\s\S]*?)(?=\n## |$)/);
  if (nextSection) {
    const lines = nextSection[1].split('\n').filter(l => l.match(/^\d+\.\s/));
    result.proximasTarefas = lines.map(l => l.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim());
  }

  // Alertas
  const alertSection = content.match(/## Alertas\n([\s\S]*?)(?=\n## |$)/);
  if (alertSection) {
    const lines = alertSection[1].split('\n').filter(l => l.match(/^-\s/));
    result.alertas = lines.map(l => l.replace(/^-\s*/, '').trim());
  }

  return result;
}

function parseProjectMd(content) {
  if (!content) return { nome: 'Projeto' };
  const nameMatch = content.match(/nome:\s*(.+)/i) || content.match(/# .+ — (.+)/i);
  return { nome: nameMatch ? nameMatch[1].trim() : 'Projeto' };
}

function parseConfig(config) {
  if (!config) return { modo: 'claude' };
  return { modo: config.modo || 'claude' };
}

function getItemIcon(status) {
  const s = status.toLowerCase();
  if (s.includes('100%') || s.includes('completa') || s.includes('done')) return ICONS.done;
  if (s.includes('pendente') || s.includes('0%') || s.includes('pending')) return ICONS.fail;
  return ICONS.pending;
}

// ==================== RENDERERS ====================

function renderFull(ouroDir) {
  const stateContent = readFile(path.join(ouroDir, 'STATE.md'));
  const projectContent = readFile(path.join(ouroDir, 'PROJECT.md'));
  const config = readJSON(path.join(ouroDir, 'config.json'));
  const dashboard = readJSON(path.join(ouroDir, 'analytics', 'dashboard.json'));

  const state = parseStateMd(stateContent);
  const project = parseProjectMd(projectContent);
  const cfg = parseConfig(config);

  const W = 57; // inner width
  const border = '\u2550'.repeat(W);
  const c = COLORS;

  const lines = [];

  // Header
  lines.push(`${c.cyan}${c.bold}\u2554${border}\u2557${c.reset}`);

  const modoTag = cfg.modo === 'claude'
    ? `${c.green}${ICONS.bolt} claude${c.reset}`
    : `${c.yellow}${ICONS.bolt} economico${c.reset}`;
  const headerText = `  GSD OURO \u2014 ${c.bold}${project.nome}${c.reset}`;
  lines.push(`${c.cyan}\u2551${c.reset}${headerText}${' '.repeat(Math.max(1, W - stripAnsi(headerText).length - stripAnsi(modoTag).length - 1))}${modoTag}${c.cyan}\u2551${c.reset}`);

  lines.push(`${c.cyan}\u2560${border}\u2563${c.reset}`);

  // Fase + Progresso
  const faseText = state.fase || 'N/A';
  lines.push(line(`  Fase: ${c.bold}${faseText}${c.reset}`, W));
  lines.push(line(`  Progresso: ${progressBar(state.progresso)} ${c.bold}${state.progresso}%${c.reset}`, W));

  if (state.sessao) {
    lines.push(line(`  Sess\u00e3o: ${c.dim}#${state.sessao}${c.reset}`, W));
  }

  lines.push(line('', W));
  lines.push(`${c.cyan}\u2560${border}\u2563${c.reset}`);

  // Checklist
  lines.push(line(`  ${c.bold}CHECKLIST${c.reset}`, W));

  if (state.items.length > 0) {
    for (const item of state.items) {
      const icon = getItemIcon(item.status);
      const statusShort = item.status.replace(/\(.+\)/, '').trim();
      lines.push(line(`  ${icon} ${pad(item.name, 22)} ${c.dim}${statusShort}${c.reset}`, W));
    }
  } else {
    lines.push(line(`  ${c.dim}Sem itens no STATE.md${c.reset}`, W));
  }

  lines.push(line('', W));
  lines.push(`${c.cyan}\u2560${border}\u2563${c.reset}`);

  // Métricas
  lines.push(line(`  ${c.bold}M\u00c9TRICAS${c.reset}`, W));

  if (dashboard) {
    const economia = dashboard.economia_pct || 0;
    const conformidade = dashboard.conformidade || 0;
    const tarefas = dashboard.tarefas_concluidas || 0;
    const sessoes = dashboard.sessoes || 0;
    const custoReal = dashboard.custo_real || 0;

    lines.push(line(`  ${ICONS.money} Economia: ${c.green}${economia}%${c.reset} ($${custoReal.toFixed(2)} real)`, W));
    lines.push(line(`  ${ICONS.quality} Qualidade: ${conformidade > 80 ? c.green : c.yellow}${conformidade}%${c.reset} conforme Kit`, W));
    lines.push(line(`  ${ICONS.chart} Tarefas: ${c.bold}${tarefas}${c.reset} conclu\u00eddas em ${sessoes} sess\u00f5es`, W));
  } else {
    lines.push(line(`  ${c.dim}Sem dados de analytics ainda${c.reset}`, W));
  }

  lines.push(line('', W));
  lines.push(`${c.cyan}\u2560${border}\u2563${c.reset}`);

  // Próximo
  lines.push(line(`  ${c.bold}PR\u00d3XIMO${c.reset}`, W));

  if (state.proximasTarefas.length > 0) {
    lines.push(line(`  ${ICONS.arrow} ${state.proximasTarefas[0]}`, W));
    if (state.proximasTarefas.length > 1) {
      lines.push(line(`  ${c.dim}  + ${state.proximasTarefas.length - 1} mais${c.reset}`, W));
    }
  } else {
    lines.push(line(`  ${c.dim}Nenhuma tarefa definida${c.reset}`, W));
  }

  // Alertas
  if (state.alertas.length > 0) {
    lines.push(line('', W));
    lines.push(`${c.cyan}\u2560${border}\u2563${c.reset}`);
    lines.push(line(`  ${c.bold}${c.yellow}ALERTAS${c.reset}`, W));
    for (const alerta of state.alertas.slice(0, 3)) {
      const short = alerta.length > W - 6 ? alerta.substring(0, W - 9) + '...' : alerta;
      lines.push(line(`  ${c.yellow}\u26A0 ${short}${c.reset}`, W));
    }
  }

  // Footer
  lines.push(`${c.cyan}${c.bold}\u255A${border}\u255D${c.reset}`);

  const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  lines.push(`${c.dim}  Atualizado: ${timestamp}${c.reset}`);

  return lines.join('\n');
}

function renderMini(ouroDir) {
  const stateContent = readFile(path.join(ouroDir, 'STATE.md'));
  const projectContent = readFile(path.join(ouroDir, 'PROJECT.md'));
  const config = readJSON(path.join(ouroDir, 'config.json'));

  const state = parseStateMd(stateContent);
  const project = parseProjectMd(projectContent);
  const cfg = parseConfig(config);
  const c = COLORS;

  const fase = state.fase ? state.fase.replace(/^Fase\s*/, '') : 'N/A';
  const proximo = state.proximasTarefas[0] || 'N/A';
  const done = state.items.filter(i => getItemIcon(i.status) === ICONS.done).length;
  const total = state.items.length;

  return `${c.cyan}${ICONS.bolt}${c.reset} ${c.bold}${project.nome}${c.reset} | Fase ${fase}: ${c.bold}${state.progresso}%${c.reset} | ${ICONS.done} ${done}/${total} | ${ICONS.arrow} ${proximo}`;
}

function renderJSON(ouroDir) {
  const stateContent = readFile(path.join(ouroDir, 'STATE.md'));
  const projectContent = readFile(path.join(ouroDir, 'PROJECT.md'));
  const config = readJSON(path.join(ouroDir, 'config.json'));
  const dashboard = readJSON(path.join(ouroDir, 'analytics', 'dashboard.json'));

  const state = parseStateMd(stateContent);
  const project = parseProjectMd(projectContent);
  const cfg = parseConfig(config);

  return JSON.stringify({
    projeto: project.nome,
    modo: cfg.modo,
    fase: state.fase,
    progresso: state.progresso,
    sessao: state.sessao,
    items: state.items,
    proximaTarefa: state.proximasTarefas[0] || null,
    alertas: state.alertas,
    dashboard: dashboard || {},
    timestamp: new Date().toISOString(),
  }, null, 2);
}

// Helper: strip ANSI for length calculation
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function truncate(text, maxLen) {
  const visible = stripAnsi(text);
  if (visible.length <= maxLen) return text;
  // Find where to cut by walking through the string tracking visible chars
  let visCount = 0;
  let i = 0;
  const ansiRegex = /\x1b\[[0-9;]*m/;
  while (i < text.length && visCount < maxLen - 3) {
    const remaining = text.slice(i);
    const ansiMatch = remaining.match(/^\x1b\[[0-9;]*m/);
    if (ansiMatch) {
      i += ansiMatch[0].length;
    } else {
      visCount++;
      i++;
    }
  }
  return text.slice(0, i) + COLORS.reset + '...';
}

function line(text, width) {
  const c = COLORS;
  const truncated = truncate(text, width);
  const visible = stripAnsi(truncated);
  const padding = Math.max(0, width - visible.length);
  return `${c.cyan}\u2551${c.reset}${truncated}${' '.repeat(padding)}${c.cyan}\u2551${c.reset}`;
}

// ==================== MAIN ====================

function main() {
  const args = process.argv.slice(2);
  const isWatch = args.includes('--watch') || args.includes('-w');
  const isMini = args.includes('--mini') || args.includes('-m');
  const isJSON = args.includes('--json') || args.includes('-j');

  const intervalArg = args.indexOf('--interval');
  const intervalSec = intervalArg !== -1 ? parseInt(args[intervalArg + 1]) || 5 : 5;

  const ouroDir = findOuroDir();
  if (!ouroDir) {
    console.error('Erro: diretório .ouro/ não encontrado. Execute dentro de um projeto GSD Ouro.');
    process.exit(1);
  }

  function render() {
    if (isJSON) {
      console.log(renderJSON(ouroDir));
    } else if (isMini) {
      console.log(renderMini(ouroDir));
    } else {
      console.log(renderFull(ouroDir));
    }
  }

  if (isWatch) {
    // Clear screen and render
    const clear = () => process.stdout.write('\x1b[2J\x1b[H');

    clear();
    render();

    // Watch for file changes
    const filesToWatch = [
      path.join(ouroDir, 'STATE.md'),
      path.join(ouroDir, 'analytics', 'dashboard.json'),
      path.join(ouroDir, 'config.json'),
    ];

    let debounce = null;
    const refresh = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        clear();
        render();
      }, 300);
    };

    // fs.watch on each file
    for (const f of filesToWatch) {
      try {
        fs.watch(f, refresh);
      } catch {
        // File might not exist yet
      }
    }

    // Also poll at interval as fallback
    setInterval(() => {
      clear();
      render();
    }, intervalSec * 1000);

    console.log(`\n${COLORS.dim}  Modo watch: atualiza a cada ${intervalSec}s ou ao mudar arquivos. Ctrl+C para sair.${COLORS.reset}`);
  } else {
    render();
  }
}

main();
