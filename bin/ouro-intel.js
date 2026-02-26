#!/usr/bin/env node

/**
 * GSD Ouro — Intelligence Engine CLI (v0.5)
 *
 * Uso:
 *   node bin/ouro-intel.js error add "mensagem" [--dificuldade 3] [--solucao "..."] [--categoria logic]
 *   node bin/ouro-intel.js error similar "mensagem"
 *   node bin/ouro-intel.js error list [--limit 10]
 *   node bin/ouro-intel.js error stats
 *   node bin/ouro-intel.js tips [--categoria Performance]
 *   node bin/ouro-intel.js health
 *   node bin/ouro-intel.js prevent check "descricao da tarefa"
 *   node bin/ouro-intel.js prevent list
 *   node bin/ouro-intel.js prevent add "trigger" --regra "..." [--severidade high]
 *   node bin/ouro-intel.js report
 */

const errorKB = require('../lib/error-kb');
const tipsEngine = require('../lib/tips-engine');
const intel = require('../lib/intelligence');

const args = process.argv.slice(2);
const command = args[0];

// ==================== FLAG PARSING ====================

function parseFlags(flagArgs) {
  const flags = {};
  for (let i = 0; i < flagArgs.length; i++) {
    if (flagArgs[i].startsWith('--')) {
      const key = flagArgs[i].slice(2);
      const next = flagArgs[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = 'true';
      }
    }
  }
  return flags;
}

function extractText(startIdx) {
  const parts = [];
  for (let i = startIdx; i < args.length; i++) {
    if (args[i].startsWith('--') || args[i] === '--') break;
    parts.push(args[i]);
  }
  return parts.join(' ').replace(/^["']|["']$/g, '');
}

// ==================== DISPLAY HELPERS ====================

const C = {
  r: '\x1b[0m', b: '\x1b[1m', d: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
  cyan: '\x1b[36m', red: '\x1b[31m', magenta: '\x1b[35m', white: '\x1b[37m',
};

function c(color, text) { return `${C[color] || ''}${text}${C.r}`; }
function bold(text) { return `${C.b}${text}${C.r}`; }
function dim(text) { return `${C.d}${text}${C.r}`; }

function header(title) {
  const line = '═'.repeat(54);
  console.log(`\n${c('cyan', `╔${line}╗`)}`);
  console.log(`${c('cyan', '║')}  ${bold(title)}${' '.repeat(Math.max(0, 52 - title.length))}${c('cyan', '║')}`);
  console.log(`${c('cyan', `╚${line}╝`)}\n`);
}

function subHeader(title) {
  console.log(`${c('cyan', '──')} ${bold(title)} ${c('cyan', '─'.repeat(Math.max(0, 46 - title.length)))}\n`);
}

function scoreColor(score) {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}

function gradeColor(grade) {
  if (grade === 'S' || grade === 'A') return 'green';
  if (grade === 'B') return 'cyan';
  if (grade === 'C') return 'yellow';
  return 'red';
}

function progressBar(value, max, width) {
  max = max || 100;
  width = width || 20;
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  return c(scoreColor(value), '█'.repeat(filled) + '░'.repeat(empty));
}

function sevColor(sev) {
  if (sev === 'critical') return 'red';
  if (sev === 'high') return 'yellow';
  if (sev === 'medium') return 'cyan';
  return 'green';
}

function catIcon(cat) {
  const icons = {
    Performance: '⚡', Quality: '✨', Organization: '📁',
    Prevention: '🛡️', Economy: '💰',
  };
  return icons[cat] || '💡';
}

function diffDots(level) {
  return '●'.repeat(level) + '○'.repeat(5 - level);
}

// ==================== MAIN ====================

const flags = parseFlags(args.slice(1));
const ouroDir = errorKB.findOuroDir();

if (!ouroDir && command && command !== 'help') {
  console.log(c('red', 'Erro: diretorio .ouro/ nao encontrado.'));
  console.log(dim('Execute na raiz de um projeto GSD Ouro.'));
  process.exit(1);
}

switch (command) {

  // ────────────────────────────────────────────────
  // ERROR
  // ────────────────────────────────────────────────
  case 'error':
  case 'erro': {
    const sub = args[1];

    switch (sub) {
      case 'add':
      case 'adicionar': {
        const message = extractText(2);
        if (!message) {
          console.log(c('red', 'Erro: forneca a mensagem do erro.'));
          console.log(dim('Uso: ouro-intel error add "TypeError: ..." --dificuldade 3 --solucao "..."'));
          break;
        }

        const entry = errorKB.addError(ouroDir, {
          message,
          stack: flags.stack || '',
          solucao: flags.solucao || flags.solution || '',
          dificuldade: parseInt(flags.dificuldade || flags.difficulty) || 3,
          categoria: flags.categoria || flags.category || undefined,
          arquivos: flags.arquivo ? [flags.arquivo] : undefined,
          tags: flags.tags ? flags.tags.split(',').map(t => t.trim()) : undefined,
        });

        header('Erro Registrado');
        console.log(`  ${bold('ID:')}          ${c('cyan', entry.id)}`);
        console.log(`  ${bold('Mensagem:')}    ${entry.message.slice(0, 60)}`);
        console.log(`  ${bold('Categoria:')}   ${c('blue', entry.categoria)}`);
        console.log(`  ${bold('Dificuldade:')} ${c('yellow', diffDots(entry.dificuldade))}`);
        console.log(`  ${bold('Tags:')}        ${entry.tags.map(t => c('magenta', t)).join(', ')}`);
        console.log(`  ${bold('Status:')}      ${entry.status === 'resolved' ? c('green', '✓ Resolvido') : c('yellow', '⏳ Novo')}`);
        if (entry.solucao) {
          console.log(`  ${bold('Solucao:')}     ${c('green', entry.solucao.slice(0, 60))}`);
        }

        // Check similar
        const similar = errorKB.searchSimilar(ouroDir, message, 2);
        const otherSimilar = similar.filter(s => s.id !== entry.id && s.similarity >= 30);
        if (otherSimilar.length > 0) {
          console.log(`\n  ${c('yellow', '⚠ Erros similares encontrados:')}`);
          for (const s of otherSimilar) {
            console.log(`    ${dim(s.id)} ${s.message.slice(0, 50)} ${c('cyan', `(${s.similarity}% similar)`)}`);
            if (s.solucao) console.log(`    ${dim('→')} ${c('green', s.solucao.slice(0, 60))}`);
          }
        }
        console.log('');
        break;
      }

      case 'similar':
      case 'buscar':
      case 'search': {
        const query = extractText(2);
        if (!query) {
          console.log(c('red', 'Erro: forneca o texto de busca.'));
          break;
        }

        const limit = parseInt(flags.limit) || 5;
        const results = errorKB.searchSimilar(ouroDir, query, limit);

        header('Busca por Similaridade');
        console.log(`  ${dim('Query:')} ${query.slice(0, 60)}\n`);

        if (!results.length) {
          console.log(`  ${c('yellow', 'Nenhum erro similar encontrado.')}\n`);
          break;
        }

        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          const simColor = r.similarity >= 70 ? 'green' : r.similarity >= 40 ? 'yellow' : 'red';
          console.log(`  ${c('cyan', `#${i + 1}`)} ${bold(r.message.slice(0, 55))}`);
          console.log(`     ${c(simColor, `${r.similarity}% similar`)} │ ${c('blue', r.categoria)} │ ${c('yellow', diffDots(r.dificuldade))} │ ${r.status === 'resolved' ? c('green', '✓') : c('yellow', '⏳')}`);
          if (r.solucao) {
            console.log(`     ${c('green', '→')} ${r.solucao.slice(0, 60)}`);
          }
          console.log('');
        }
        break;
      }

      case 'list':
      case 'listar': {
        const log = errorKB.getErrorLog(ouroDir);
        const limit = parseInt(flags.limit) || 10;
        const recent = log.slice(-limit).reverse();

        header(`Ultimos ${recent.length} Erros`);

        if (!recent.length) {
          console.log(`  ${c('yellow', 'Nenhum erro registrado.')}\n`);
          break;
        }

        for (const e of recent) {
          const statusIcon = e.status === 'resolved' ? c('green', '✓') : c('yellow', '⏳');
          console.log(`  ${c('cyan', e.id)} ${statusIcon} ${c('yellow', diffDots(e.dificuldade))} ${c('blue', e.categoria.padEnd(10))} ${e.message.slice(0, 45)}`);
        }
        console.log(`\n  ${dim(`Total: ${log.length} erros`)}\n`);
        break;
      }

      case 'stats':
      case 'estatisticas': {
        const stats = errorKB.getErrorStats(ouroDir);

        header('Estatisticas de Erros');

        console.log(`  ${bold('Total:')}       ${c('cyan', String(stats.total))}`);
        console.log(`  ${bold('Resolvidos:')}  ${c('green', `${stats.resolved}`)} ${dim(`(${stats.resolved_pct}%)`)}`);
        console.log(`  ${bold('Dificuldade:')} ${c('yellow', String(stats.avg_difficulty))} ${dim('media')}`);
        console.log(`  ${bold('Padroes:')}     ${c('magenta', String(stats.patterns_count))}`);
        console.log(`  ${bold('Prevencao:')}   ${c('blue', String(stats.prevention_rules))} regras\n`);

        if (Object.keys(stats.by_category).length > 0) {
          subHeader('Por Categoria');
          const maxCat = Math.max(...Object.values(stats.by_category));
          for (const [cat, count] of Object.entries(stats.by_category).sort((a, b) => b[1] - a[1])) {
            const bar = progressBar(count, maxCat, 15);
            console.log(`  ${cat.padEnd(12)} ${bar} ${c('cyan', String(count))}`);
          }
          console.log('');
        }

        if (stats.top_patterns.length > 0) {
          subHeader('Top Padroes Recorrentes');
          for (const p of stats.top_patterns) {
            console.log(`  ${c('magenta', `${p.ocorrencias}x`)} ${p.nome.slice(0, 45)}`);
            if (p.solucao) console.log(`     ${c('green', '→')} ${p.solucao.slice(0, 55)}`);
          }
          console.log('');
        }
        break;
      }

      default: {
        console.log(c('yellow', 'Subcomando "error" desconhecido.'));
        console.log(dim('Uso: ouro-intel error [add|similar|list|stats]'));
      }
    }
    break;
  }

  // ────────────────────────────────────────────────
  // TIPS
  // ────────────────────────────────────────────────
  case 'tips':
  case 'dicas': {
    const tips = tipsEngine.generateTips(ouroDir);
    const catFilter = flags.categoria || flags.category || null;
    const filtered = catFilter ? tipsEngine.getTipsByCategory(tips, catFilter) : tips;

    header(catFilter ? `Dicas — ${catFilter}` : 'Dicas Contextuais');

    if (!filtered.length) {
      console.log(`  ${c('green', '✓ Nenhuma dica pendente. Tudo em ordem!')}\n`);
      break;
    }

    const prioOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    filtered.sort((a, b) => (prioOrder[a.prioridade] || 2) - (prioOrder[b.prioridade] || 2));

    for (const t of filtered) {
      const icon = catIcon(t.categoria);
      const prioColor = t.prioridade === 'critical' || t.prioridade === 'high' ? 'red' : t.prioridade === 'medium' ? 'yellow' : 'green';
      console.log(`  ${icon} ${c('cyan', `[${t.categoria}]`)} ${c(prioColor, `[${t.prioridade.toUpperCase()}]`)}`);
      console.log(`     ${bold(t.mensagem)}`);
      if (t.detalhe) console.log(`     ${dim(t.detalhe)}`);
      if (t.acao) console.log(`     ${c('green', '→')} ${t.acao}`);
      console.log('');
    }

    console.log(dim(`  Total: ${filtered.length} dicas | Categorias: Performance, Quality, Organization, Prevention, Economy`));
    console.log('');
    break;
  }

  // ────────────────────────────────────────────────
  // HEALTH
  // ────────────────────────────────────────────────
  case 'health':
  case 'saude': {
    const health = intel.getHealthScore(ouroDir);

    header('Health Score do Projeto');

    // Big score display
    const gradeClr = gradeColor(health.grade);
    console.log(`  ${c(gradeClr, `  ╔═══════╗`)}`);
    console.log(`  ${c(gradeClr, `  ║  ${bold(String(health.total).padStart(3))}  ║`)}`);
    console.log(`  ${c(gradeClr, `  ╚═══════╝`)}  Grade: ${c(gradeClr, bold(health.grade))}  Tendencia: ${health.trend === 'improving' ? c('green', '↑ Melhorando') : health.trend === 'declining' ? c('red', '↓ Caindo') : c('yellow', '→ Estavel')}`);
    console.log('');

    // Sub-scores
    subHeader('Sub-Scores');
    for (const [key, sub] of Object.entries(health.subscores)) {
      const bar = progressBar(sub.score, 100, 15);
      const weight = `(${Math.round(sub.weight * 100)}%)`;
      console.log(`  ${sub.label.padEnd(14)} ${bar} ${c(scoreColor(sub.score), String(sub.score).padStart(3))}  ${dim(weight)}  ${dim(sub.detail)}`);
    }
    console.log('');

    // Top 3 tips
    const tips = tipsEngine.generateTips(ouroDir);
    if (tips.length > 0) {
      subHeader('Recomendacoes');
      for (const t of tips.slice(0, 3)) {
        console.log(`  ${catIcon(t.categoria)} ${t.mensagem}`);
        if (t.acao) console.log(`     ${c('green', '→')} ${t.acao}`);
      }
      console.log('');
    }
    break;
  }

  // ────────────────────────────────────────────────
  // PREVENT
  // ────────────────────────────────────────────────
  case 'prevent':
  case 'prevenir': {
    const sub = args[1];

    switch (sub) {
      case 'check':
      case 'verificar': {
        const desc = extractText(2);
        if (!desc) {
          console.log(c('red', 'Erro: forneca a descricao da tarefa.'));
          break;
        }

        const matches = errorKB.checkPrevention(ouroDir, desc);

        header('Verificacao de Prevencao');
        console.log(`  ${dim('Tarefa:')} ${desc.slice(0, 60)}\n`);

        if (!matches.length) {
          console.log(`  ${c('green', '✓ Nenhuma regra de prevencao aplicavel.')}`);
          console.log(`  ${dim('Tarefa segura para executar.')}\n`);
          break;
        }

        console.log(`  ${c('yellow', `⚠ ${matches.length} regra(s) de prevencao encontrada(s):`)}\n`);
        for (const r of matches) {
          const sClr = sevColor(r.severidade);
          console.log(`  ${c(sClr, `[${r.severidade.toUpperCase()}]`)} ${bold(r.regra)}`);
          console.log(`    ${dim('Trigger:')} ${r.trigger} │ ${dim('Matches:')} ${r.matches}`);
          console.log('');
        }
        break;
      }

      case 'list':
      case 'listar': {
        const rules = errorKB.getPreventionRules(ouroDir);

        header('Regras de Prevencao');

        if (!rules.length) {
          console.log(`  ${c('yellow', 'Nenhuma regra cadastrada.')}`);
          console.log(`  ${dim('Use: ouro-intel prevent add "trigger" --regra "descricao"')}\n`);
          break;
        }

        for (const r of rules) {
          const sClr = sevColor(r.severidade);
          console.log(`  ${c('cyan', r.id)} ${c(sClr, `[${r.severidade}]`.padEnd(10))} ${bold(r.regra.slice(0, 40))}`);
          console.log(`    ${dim('Trigger:')} ${r.trigger} │ ${dim('Matches:')} ${r.matches} │ ${dim('Criado:')} ${r.criado}`);
        }
        console.log(`\n  ${dim(`Total: ${rules.length} regras`)}\n`);
        break;
      }

      case 'add':
      case 'adicionar': {
        const trigger = extractText(2);
        if (!trigger || !flags.regra) {
          console.log(c('red', 'Erro: forneca trigger e --regra.'));
          console.log(dim('Uso: ouro-intel prevent add "componente React" --regra "Usar optional chaining" --severidade high'));
          break;
        }

        const rule = errorKB.addPreventionRule(ouroDir, {
          trigger,
          regra: flags.regra || flags.rule,
          severidade: flags.severidade || flags.severity || 'medium',
          tags: flags.tags ? flags.tags.split(',').map(t => t.trim()) : [],
        });

        console.log(`\n  ${c('green', '✓')} Regra criada: ${c('cyan', rule.id)}`);
        console.log(`  ${bold('Trigger:')}    ${rule.trigger}`);
        console.log(`  ${bold('Regra:')}      ${rule.regra}`);
        console.log(`  ${bold('Severidade:')} ${c(sevColor(rule.severidade), rule.severidade)}\n`);
        break;
      }

      case 'remove':
      case 'remover': {
        const id = args[2];
        if (!id) {
          console.log(c('red', 'Erro: forneca o ID da regra.'));
          break;
        }
        const ok = errorKB.removePreventionRule(ouroDir, id);
        if (ok) console.log(`\n  ${c('green', '✓')} Regra ${c('cyan', id)} removida.\n`);
        else console.log(`\n  ${c('red', '✗')} Regra ${id} nao encontrada.\n`);
        break;
      }

      default: {
        console.log(c('yellow', 'Subcomando "prevent" desconhecido.'));
        console.log(dim('Uso: ouro-intel prevent [check|list|add|remove]'));
      }
    }
    break;
  }

  // ────────────────────────────────────────────────
  // REPORT
  // ────────────────────────────────────────────────
  case 'report':
  case 'relatorio': {
    const report = intel.getIntelligenceReport(ouroDir);

    header('Relatorio de Inteligencia');

    // Health
    const h = report.health;
    console.log(`  ${bold('Health Score:')} ${c(gradeColor(h.grade), `${h.total}/100`)} (${c(gradeColor(h.grade), h.grade)}) ${h.trend === 'improving' ? c('green', '↑') : h.trend === 'declining' ? c('red', '↓') : c('yellow', '→')}\n`);

    for (const [, sub] of Object.entries(h.subscores)) {
      console.log(`    ${sub.label.padEnd(14)} ${progressBar(sub.score, 100, 10)} ${String(sub.score).padStart(3)}`);
    }
    console.log('');

    // Errors summary
    subHeader('Erros');
    const es = report.errors;
    console.log(`  Total: ${c('cyan', String(es.total))} │ Resolvidos: ${c('green', `${es.resolved_pct}%`)} │ Dificuldade media: ${c('yellow', String(es.avg_difficulty))} │ Padroes: ${c('magenta', String(es.patterns_count))}`);
    console.log('');

    // Prevention
    subHeader('Prevencao');
    console.log(`  Regras ativas: ${c('blue', String(report.prevention.total_rules))}`);
    for (const r of report.prevention.rules.slice(0, 3)) {
      console.log(`    ${c(sevColor(r.severidade), `[${r.severidade}]`)} ${r.regra.slice(0, 50)}`);
    }
    console.log('');

    // Trends
    if (report.trends.length > 0) {
      subHeader('Tendencias');
      for (const t of report.trends) {
        const arrow = t.direction === 'improving' ? c('green', '↑') : t.direction === 'declining' ? c('red', '↓') : c('yellow', '→');
        console.log(`  ${arrow} ${t.category}${t.delta ? ` ${dim(t.delta)}` : ''}`);
      }
      console.log('');
    }

    // Top tips
    if (report.tips.length > 0) {
      subHeader('Top Dicas');
      for (const t of report.tips.slice(0, 5)) {
        console.log(`  ${catIcon(t.categoria)} ${t.mensagem}`);
      }
      console.log('');
    }

    console.log(dim(`  Gerado em: ${report.timestamp.slice(0, 19).replace('T', ' ')}`));
    console.log('');
    break;
  }

  // ────────────────────────────────────────────────
  // HELP / DEFAULT
  // ────────────────────────────────────────────────
  default: {
    header('GSD Ouro — Intelligence Engine v0.5');

    console.log(`  ${bold('COMANDOS DE ERROS')}`);
    console.log(`    ${c('cyan', 'error add')} ${dim('"msg"')} ${dim('[--dificuldade N] [--solucao "..."] [--categoria X]')}`);
    console.log(`      Registra um erro no knowledge base\n`);
    console.log(`    ${c('cyan', 'error similar')} ${dim('"msg"')} ${dim('[--limit N]')}`);
    console.log(`      Busca erros similares com solucoes\n`);
    console.log(`    ${c('cyan', 'error list')} ${dim('[--limit N]')}`);
    console.log(`      Lista ultimos erros registrados\n`);
    console.log(`    ${c('cyan', 'error stats')}`);
    console.log(`      Estatisticas de erros por categoria e dificuldade\n`);

    console.log(`  ${bold('DICAS & SAUDE')}`);
    console.log(`    ${c('cyan', 'tips')} ${dim('[--categoria Performance|Quality|Organization|Prevention|Economy]')}`);
    console.log(`      Dicas contextuais baseadas em analise de dados\n`);
    console.log(`    ${c('cyan', 'health')}`);
    console.log(`      Health score do projeto com sub-scores\n`);
    console.log(`    ${c('cyan', 'report')}`);
    console.log(`      Relatorio completo de inteligencia\n`);

    console.log(`  ${bold('PREVENCAO')}`);
    console.log(`    ${c('cyan', 'prevent check')} ${dim('"descricao da tarefa"')}`);
    console.log(`      Verifica regras de prevencao antes de executar\n`);
    console.log(`    ${c('cyan', 'prevent list')}`);
    console.log(`      Lista todas as regras de prevencao\n`);
    console.log(`    ${c('cyan', 'prevent add')} ${dim('"trigger" --regra "..." [--severidade high]')}`);
    console.log(`      Cria nova regra de prevencao\n`);
    console.log(`    ${c('cyan', 'prevent remove')} ${dim('<id>')}`);
    console.log(`      Remove uma regra de prevencao\n`);

    console.log(`  ${bold('EXEMPLOS')}`);
    console.log(`    ${dim('$ ouro-intel error add "TypeError: Cannot read property" --dificuldade 3 --solucao "Check null"')}`);
    console.log(`    ${dim('$ ouro-intel error similar "TypeError: Cannot read"')}`);
    console.log(`    ${dim('$ ouro-intel tips --categoria Prevention')}`);
    console.log(`    ${dim('$ ouro-intel prevent check "criar componente React"')}`);
    console.log('');
  }
}
