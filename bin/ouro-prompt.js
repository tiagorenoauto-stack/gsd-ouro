#!/usr/bin/env node

/**
 * GSD Ouro — Prompt Generator Pro CLI (v0.4)
 *
 * Uso:
 *   node bin/ouro-prompt.js generate "texto" [--modelo claude] [--tipo codigo] [--otimizar] [--framework costar]
 *   node bin/ouro-prompt.js optimize "prompt fraco" [--modelo claude]
 *   node bin/ouro-prompt.js verify "texto do prompt"
 *   node bin/ouro-prompt.js simulate "prompt" [--modelo claude]
 *   node bin/ouro-prompt.js compare "prompt A" -- "prompt B"
 *   node bin/ouro-prompt.js stats
 *   node bin/ouro-prompt.js top [--tipo codigo] [--limit 5]
 *   node bin/ouro-prompt.js templates
 */

const pg = require('../lib/prompt-generator');

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

// For compare: extract text after "--" separator
function extractSecondText() {
  const sepIdx = args.indexOf('--');
  if (sepIdx === -1) return '';
  const parts = [];
  for (let i = sepIdx + 1; i < args.length; i++) {
    if (args[i].startsWith('--') && i !== sepIdx) break;
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
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return c(scoreColor(value), bar);
}

// ==================== COMMANDS ====================

const flags = parseFlags(args.slice(1));

switch (command) {

  // ────────────────────────────────────────────────
  // GENERATE
  // ────────────────────────────────────────────────
  case 'generate':
  case 'gerar': {
    const text = extractText(1);
    if (!text) {
      console.log(c('red', 'Erro: forneça o texto do prompt.'));
      console.log('Uso: ouro-prompt generate "criar um botão de login"');
      process.exit(1);
    }

    const modelo = flags.modelo || flags.model || flags.alvo || 'claude';
    const criador = flags.criador || flags.creator || null;
    const tipo = flags.tipo || flags.type || null;
    const framework = flags.framework || flags.fw || null;
    const technique = flags.tecnica || flags.technique || null;
    const otimizar = flags.otimizar === 'true' || flags.optimize === 'true';
    const refs = flags.refs || flags.ref || null;

    // AI-powered generation
    if (criador) {
      (async () => {
        try {
          header(`🤖 PROMPT GENERATOR PRO — via ${criador.toUpperCase()}`);
          console.log(dim(`  Gerando prompt com ${pg.CREATOR_MODELS[criador]?.label || criador}...\n`));

          const result = await pg.generateWithAI(text, { criador, modelo, tipo, framework, references: refs });

          console.log(`  ${bold('Criador:')}    ${result.criadorLabel} ${dim('(IA que gerou)')}`);
          console.log(`  ${bold('Alvo:')}       ${result.modelo} ${dim('(modelo que vai receber)')}`);
          console.log(`  ${bold('Score:')}      ${c(scoreColor(result.score), `${result.score}/100`)} ${c(gradeColor(result.grade), `[${result.grade}]`)}`);
          console.log(`  ${bold('Tokens IA:')} ${result.ai_tokens.input} in / ${result.ai_tokens.output} out`);
          console.log(`  ${bold('Latência:')}   ${result.ai_latency_ms}ms`);
          console.log('');

          // Deep Score
          subHeader('Deep Score');
          for (const [key, criteria] of Object.entries(result.deepScore.criteria)) {
            const s = criteria.score;
            console.log(`  ${progressBar(s, 100, 15)} ${c(scoreColor(s), String(s).padStart(3))}  ${criteria.label}`);
          }
          console.log('');

          // Comparison with local
          const local = result.local_comparison;
          subHeader('IA vs Local');
          const diff = result.improvement_over_local;
          const diffStr = diff > 0 ? c('green', `+${diff}pts`) : diff < 0 ? c('red', `${diff}pts`) : dim('=');
          console.log(`  IA (${criador}):  ${c(scoreColor(result.score), `${result.score}/100`)} ${c(gradeColor(result.grade), `[${result.grade}]`)}`);
          console.log(`  Local (regras): ${c(scoreColor(local.score), `${local.score}/100`)} ${c(gradeColor(local.grade), `[${local.grade}]`)}`);
          console.log(`  Diferença: ${diffStr}`);
          console.log('');

          // Prompt
          subHeader('Prompt Gerado (via IA)');
          console.log(result.prompt);

        } catch (err) {
          console.log(c('red', `Erro: ${err.message}`));
          console.log(dim('Dica: verifique se a API key está configurada no .env'));
          console.log(dim(`Criadores disponíveis: ${Object.keys(pg.CREATOR_MODELS).join(', ')}`));
          process.exit(1);
        }
      })();
      break;
    }

    if (otimizar) {
      header('⚡ PROMPT GENERATOR PRO — Variações');
      const variations = pg.generateVariations(text, { modelo, tipo, variations: 4, references: refs });

      for (const v of variations) {
        const sc = v.score;
        console.log(`  ${c('cyan', `#${v.rank}`)} ${bold(v.label)}`);
        console.log(`     Score: ${c(scoreColor(sc.total), `${sc.total}/100`)} ${c(gradeColor(sc.grade), `[${sc.grade}]`)}  |  Tokens: ~${Math.ceil(v.prompt.length / 4)}`);
        console.log(`     Framework: ${v.framework}  |  Técnica: ${v.technique}  |  Modelo: ${v.modelo}`);
        console.log(`     ${progressBar(sc.total, 100, 30)}`);
        console.log('');
      }

      const best = variations[0];
      console.log(`${c('green', '✅ Recomendado:')} #${best.rank} ${best.label} (score ${best.score.total}, grade ${best.score.grade})`);
      console.log(`\n${dim('Prompt do #1:')}`);
      console.log(dim(best.prompt.split('\n').map(l => '  ' + l).join('\n')));

    } else {
      const result = pg.generate(text, { modelo, tipo, framework, technique, references: refs });

      header('⚡ PROMPT GENERATOR PRO');

      // Meta info
      console.log(`  ${bold('Tipo:')}       ${result.tipo}`);
      console.log(`  ${bold('Framework:')}  ${result.frameworkLabel}`);
      console.log(`  ${bold('Modelo:')}     ${result.modelo} (${result.modelProfile?.costTier || '?'})`);
      console.log(`  ${bold('Técnica:')}    ${result.techniqueLabel}`);
      console.log(`  ${bold('Score:')}      ${c(scoreColor(result.score), `${result.score}/100`)} ${c(gradeColor(result.grade), `[${result.grade}]`)}`);
      console.log(`  ${bold('Tokens:')}     ~${result.tokens_estimados}`);
      console.log('');

      // Deep Score breakdown
      subHeader('Deep Score');
      for (const [key, criteria] of Object.entries(result.deepScore.criteria)) {
        const s = criteria.score;
        console.log(`  ${progressBar(s, 100, 15)} ${c(scoreColor(s), String(s).padStart(3))}  ${criteria.label} ${dim(`(${criteria.weight}%)`)}`);
      }
      console.log('');

      // Framework data
      const fw = result.fwData;
      if (fw.framework === 'costar') {
        subHeader('CO-STAR');
        console.log(`  ${c('cyan', 'C:')} ${fw.context}`);
        console.log(`  ${c('cyan', 'O:')} ${fw.objective}`);
        console.log(`  ${c('cyan', 'S:')} ${fw.style}`);
        console.log(`  ${c('cyan', 'T:')} ${pg.TONE_LABELS[fw.tone] || fw.tone}`);
        console.log(`  ${c('cyan', 'A:')} ${fw.audience}`);
        console.log(`  ${c('cyan', 'R:')} ${pg.RESPONSE_LABELS[fw.response] || fw.response}`);
      } else if (fw.framework === 'rtf') {
        subHeader('RTF');
        console.log(`  ${c('cyan', 'R:')} ${fw.role}`);
        console.log(`  ${c('cyan', 'T:')} ${fw.task}`);
        console.log(`  ${c('cyan', 'F:')} ${fw.format}`);
      } else if (fw.framework === 'care') {
        subHeader('CARE');
        console.log(`  ${c('cyan', 'C:')} ${fw.context}`);
        console.log(`  ${c('cyan', 'A:')} ${fw.action}`);
        console.log(`  ${c('cyan', 'R:')} ${fw.result}`);
        console.log(`  ${c('cyan', 'E:')} ${fw.examples}`);
      }
      console.log('');

      // Simulation summary
      const sim = result.simulation;
      subHeader('Simulação');
      console.log(`  Probabilidade de sucesso: ${c(scoreColor(sim.success_probability), `${sim.success_probability}%`)}`);
      console.log(`  Melhor modelo: ${bold(sim.best_model.name)} (fit ${sim.best_model.fitScore})`);
      if (sim.risks.length > 0) {
        console.log(`  ${c('yellow', 'Riscos:')}`);
        sim.risks.forEach(r => console.log(`    ⚠ ${r}`));
      }
      if (sim.suggestions.length > 0) {
        sim.suggestions.forEach(s => console.log(`    💡 ${s}`));
      }
      console.log('');

      // Verification issues
      if (!result.verification.ok) {
        subHeader('Verificação');
        for (let i = 0; i < result.verification.issues.length; i++) {
          console.log(`  ⚠ ${result.verification.issues[i]}`);
          console.log(`    → ${result.verification.sugestoes[i]}`);
        }
        console.log('');
      }

      // Prompt output
      subHeader('Prompt Gerado');
      console.log(result.prompt);
    }
    break;
  }

  // ────────────────────────────────────────────────
  // OPTIMIZE
  // ────────────────────────────────────────────────
  case 'optimize':
  case 'otimizar': {
    const text = extractText(1);
    if (!text) {
      console.log(c('red', 'Erro: forneça o prompt para otimizar.'));
      console.log('Uso: ouro-prompt optimize "seu prompt aqui"');
      process.exit(1);
    }

    const modelo = flags.modelo || flags.model || flags.alvo || 'claude';
    const criador = flags.criador || flags.creator || null;

    // AI-powered optimize
    if (criador) {
      (async () => {
        try {
          header(`🤖 OPTIMIZE via ${criador.toUpperCase()}`);
          console.log(dim(`  Otimizando com ${pg.CREATOR_MODELS[criador]?.label || criador}...\n`));

          const result = await pg.optimizeWithAI(text, { criador, modelo });

          subHeader('ANTES');
          console.log(`  Score: ${c(scoreColor(result.original.score.total), `${result.original.score.total}/100`)} ${c(gradeColor(result.original.score.grade), `[${result.original.score.grade}]`)}`);
          console.log(`  ${dim(text.length > 200 ? text.slice(0, 200) + '...' : text)}`);
          console.log('');

          subHeader('DEPOIS');
          console.log(`  Score: ${c(scoreColor(result.optimized.score.total), `${result.optimized.score.total}/100`)} ${c(gradeColor(result.optimized.score.grade), `[${result.optimized.score.grade}]`)}`);
          console.log(`  Criador: ${result.criadorLabel}`);
          console.log(`  Modelo alvo: ${result.modelo}`);
          console.log(`  Tokens IA: ${result.ai_tokens.input} in / ${result.ai_tokens.output} out | ${result.ai_latency_ms}ms`);
          console.log('');

          const arrow = result.improvement > 0 ? c('green', `↑ +${result.improvement}pts (+${result.improvementPct}%)`) : dim('= sem mudança');
          console.log(`  ${bold('Melhoria:')} ${arrow}`);
          console.log('');

          subHeader('Comparação');
          for (const [key, criteria] of Object.entries(result.original.score.criteria)) {
            const before = criteria.score;
            const after = result.optimized.score.criteria[key].score;
            const diff = after - before;
            const diffStr = diff > 0 ? c('green', `+${diff}`) : diff < 0 ? c('red', `${diff}`) : dim('=');
            console.log(`  ${criteria.label.padEnd(22)} ${String(before).padStart(3)} → ${c(scoreColor(after), String(after).padStart(3))} ${diffStr}`);
          }
          console.log('');

          subHeader('Prompt Otimizado (via IA)');
          console.log(result.optimized.prompt);

        } catch (err) {
          console.log(c('red', `Erro: ${err.message}`));
          console.log(dim('Dica: verifique a API key no .env'));
          process.exit(1);
        }
      })();
      break;
    }

    const result = pg.optimize(text, { modelo });

    header('🔧 OPTIMIZE — Reescrita de Prompt');

    // Before
    subHeader('ANTES');
    console.log(`  Score: ${c(scoreColor(result.original.score.total), `${result.original.score.total}/100`)} ${c(gradeColor(result.original.score.grade), `[${result.original.score.grade}]`)}`);
    console.log(`  ${dim(text.length > 200 ? text.slice(0, 200) + '...' : text)}`);
    console.log('');

    // After
    subHeader('DEPOIS');
    console.log(`  Score: ${c(scoreColor(result.optimized.score.total), `${result.optimized.score.total}/100`)} ${c(gradeColor(result.optimized.score.grade), `[${result.optimized.score.grade}]`)}`);
    console.log(`  Framework: ${result.optimized.frameworkLabel}`);
    console.log(`  Técnica: ${result.optimized.techniqueLabel}`);
    console.log(`  Modelo: ${result.optimized.modelo}`);
    console.log('');

    // Improvement
    const arrow = result.improvement > 0 ? c('green', `↑ +${result.improvement}pts (+${result.improvementPct}%)`) : result.improvement < 0 ? c('red', `↓ ${result.improvement}pts`) : dim('= sem mudança');
    console.log(`  ${bold('Melhoria:')} ${arrow}`);
    console.log('');

    // Deep score comparison
    subHeader('Comparação de Score');
    for (const [key, criteria] of Object.entries(result.original.score.criteria)) {
      const before = criteria.score;
      const after = result.optimized.score.criteria[key].score;
      const diff = after - before;
      const diffStr = diff > 0 ? c('green', `+${diff}`) : diff < 0 ? c('red', `${diff}`) : dim('=');
      console.log(`  ${criteria.label.padEnd(22)} ${String(before).padStart(3)} → ${c(scoreColor(after), String(after).padStart(3))} ${diffStr}`);
    }
    console.log('');

    // Optimized prompt
    subHeader('Prompt Otimizado');
    console.log(result.optimized.prompt);
    break;
  }

  // ────────────────────────────────────────────────
  // VERIFY
  // ────────────────────────────────────────────────
  case 'verify':
  case 'verificar': {
    const text = extractText(1);
    if (!text) {
      console.log(c('red', 'Erro: forneça o prompt para verificar.'));
      process.exit(1);
    }

    header('🔍 VERIFICAÇÃO DE PROMPT');

    const result = pg.verifyPrompt(text);
    const ds = result.deepScore;

    console.log(`  ${bold('Score:')}  ${c(scoreColor(ds.total), `${ds.total}/100`)} ${c(gradeColor(ds.grade), `[${ds.grade}]`)}`);
    console.log(`  ${bold('Status:')} ${result.ok ? c('green', '✅ Aprovado') : c('yellow', '⚠ Ajustes sugeridos')}`);
    console.log('');

    // Deep score breakdown
    subHeader('Análise Detalhada');
    for (const [key, criteria] of Object.entries(ds.criteria)) {
      const s = criteria.score;
      console.log(`  ${progressBar(s, 100, 15)} ${c(scoreColor(s), String(s).padStart(3))}  ${criteria.label}`);
      console.log(`  ${' '.repeat(15)}      ${dim(criteria.detail)}`);
    }
    console.log('');

    if (result.issues.length > 0) {
      subHeader('Problemas');
      for (let i = 0; i < result.issues.length; i++) {
        console.log(`  ${c('yellow', `${i + 1}.`)} ${result.issues[i]}`);
        console.log(`     → ${result.sugestoes[i]}`);
      }
      console.log('');
      console.log(`  ${dim('Dica: use `ouro-prompt optimize "..."` para reescrita automática')}`);
    } else {
      console.log(c('green', '  Nenhum problema encontrado. Prompt bem estruturado.'));
    }
    break;
  }

  // ────────────────────────────────────────────────
  // SIMULATE
  // ────────────────────────────────────────────────
  case 'simulate':
  case 'simular': {
    const text = extractText(1);
    if (!text) {
      console.log(c('red', 'Erro: forneça o prompt para simular.'));
      process.exit(1);
    }

    const modelo = flags.modelo || flags.model || 'claude';
    const sim = pg.simulate(text, modelo);

    header('🎯 SIMULAÇÃO DE EFICÁCIA');

    // Prompt score
    console.log(`  ${bold('Score do Prompt:')}   ${c(scoreColor(sim.prompt_score.total), `${sim.prompt_score.total}/100`)} ${c(gradeColor(sim.prompt_score.grade), `[${sim.prompt_score.grade}]`)}`);
    console.log(`  ${bold('Tokens Estimados:')} ~${sim.tokens_estimados}`);
    console.log(`  ${bold('Modelo Alvo:')}      ${sim.modelo_profile.name} (${sim.modelo_profile.costTier})`);
    console.log(`  ${bold('Prob. Sucesso:')}    ${c(scoreColor(sim.success_probability), `${sim.success_probability}%`)}`);
    console.log('');

    // Model ranking
    subHeader('Ranking de Modelos (melhor fit)');
    for (const m of sim.model_ranking) {
      const icon = m.rank === 1 ? '🥇' : m.rank === 2 ? '🥈' : m.rank === 3 ? '🥉' : '  ';
      const selected = m.model === modelo ? c('cyan', ' ◄ selecionado') : '';
      console.log(`  ${icon} #${m.rank} ${bold(m.name.padEnd(12))} Fit: ${c(scoreColor(m.fitScore), String(m.fitScore).padStart(3))} | ${m.costTier.padEnd(7)} | ${dim(m.strengths.slice(0, 50))}`);
      if (selected) console.log(`     ${selected}`);
    }
    console.log('');

    // Risks
    if (sim.risks.length > 0) {
      subHeader('Riscos');
      sim.risks.forEach(r => console.log(`  ⚠ ${c('yellow', r)}`));
      console.log('');
    }

    // Suggestions
    if (sim.suggestions.length > 0) {
      subHeader('Sugestões');
      sim.suggestions.forEach(s => console.log(`  💡 ${s}`));
      console.log('');
    }
    break;
  }

  // ────────────────────────────────────────────────
  // COMPARE
  // ────────────────────────────────────────────────
  case 'compare':
  case 'comparar': {
    const textA = extractText(1);
    const textB = extractSecondText();

    if (!textA || !textB) {
      console.log(c('red', 'Erro: forneça dois prompts separados por --'));
      console.log('Uso: ouro-prompt compare "prompt A" -- "prompt B"');
      process.exit(1);
    }

    const modelo = flags.modelo || flags.model || 'claude';
    const result = pg.compare(textA, textB, modelo);

    header('⚔ A/B COMPARE');

    // Summary
    console.log(`  ${bold('Prompt A:')} Score ${c(scoreColor(result.promptA.score.total), `${result.promptA.score.total}`)} ${c(gradeColor(result.promptA.score.grade), `[${result.promptA.score.grade}]`)} | ${result.promptA.tokens} tokens`);
    console.log(`  ${bold('Prompt B:')} Score ${c(scoreColor(result.promptB.score.total), `${result.promptB.score.total}`)} ${c(gradeColor(result.promptB.score.grade), `[${result.promptB.score.grade}]`)} | ${result.promptB.tokens} tokens`);
    console.log(`  ${bold('Vencedor:')} ${result.winner === 'empate' ? dim('Empate') : c('green', `Prompt ${result.winner} (+${result.diff}pts)`)}`);
    console.log('');

    // Detailed comparison
    subHeader('Comparação por Critério');
    console.log(`  ${'Critério'.padEnd(24)} ${'A'.padStart(4)}  ${'B'.padStart(4)}  ${'Diff'.padStart(5)}  Melhor`);
    console.log(`  ${'─'.repeat(55)}`);

    for (const [key, data] of Object.entries(result.comparison)) {
      const diffStr = data.diff > 0 ? c('green', `+${data.diff}`.padStart(5)) : data.diff < 0 ? c('red', `${data.diff}`.padStart(5)) : dim('   =');
      const winnerStr = data.winner === 'A' ? c('green', '  A') : data.winner === 'B' ? c('cyan', '  B') : dim('  =');
      console.log(`  ${data.label.padEnd(24)} ${String(data.promptA).padStart(4)}  ${String(data.promptB).padStart(4)}  ${diffStr}${winnerStr}`);
    }
    console.log('');

    // Success probability comparison
    console.log(`  ${bold('Probabilidade de Sucesso:')}`);
    console.log(`    A: ${progressBar(result.promptA.simulation.success_probability, 100, 20)} ${result.promptA.simulation.success_probability}%`);
    console.log(`    B: ${progressBar(result.promptB.simulation.success_probability, 100, 20)} ${result.promptB.simulation.success_probability}%`);
    break;
  }

  // ────────────────────────────────────────────────
  // STATS
  // ────────────────────────────────────────────────
  case 'stats':
  case 'metricas': {
    const stats = pg.getStats();

    header('📊 MÉTRICAS DO PROMPT GENERATOR');

    // Overview
    subHeader('Visão Geral');
    console.log(`  Total de prompts:      ${bold(String(stats.total_prompts))}`);
    console.log(`  Top prompts salvos:    ${bold(String(stats.total_top_prompts))}`);
    console.log(`  Total de tokens:       ${bold(String(stats.total_tokens))}`);
    console.log(`  Score médio:           ${stats.avg_score > 0 ? c(scoreColor(stats.avg_score), `${stats.avg_score}/100`) : dim('N/A')}`);
    console.log(`  Tokens/prompt médio:   ${bold(String(stats.avg_tokens_per_prompt))}`);
    console.log(`  Eficiência (score/tk): ${bold(String(stats.efficiency_ratio))}`);
    console.log('');

    // Score distribution
    if (stats.total_top_prompts > 0) {
      subHeader('Distribuição de Score');
      const grades = ['S', 'A', 'B', 'C', 'D', 'F'];
      const maxCount = Math.max(...Object.values(stats.score_distribution), 1);
      for (const g of grades) {
        const count = stats.score_distribution[g] || 0;
        const bar = '█'.repeat(Math.round((count / maxCount) * 20));
        console.log(`  ${c(gradeColor(g), g)}: ${bar.padEnd(20)} ${count}`);
      }
      console.log('');
    }

    // By type
    if (Object.keys(stats.by_type).length > 0) {
      subHeader('Por Tipo de Tarefa');
      for (const [tipo, data] of Object.entries(stats.by_type)) {
        console.log(`  ${bold(tipo.padEnd(15))} ${String(data.total).padStart(4)} prompts | ${String(data.tokens).padStart(8)} tokens`);
      }
      console.log('');
    }

    // By model
    if (Object.keys(stats.by_model).length > 0) {
      subHeader('Por Modelo');
      for (const [model, data] of Object.entries(stats.by_model)) {
        console.log(`  ${bold(model.padEnd(15))} ${String(data.total).padStart(4)} prompts | ${String(data.tokens).padStart(8)} tokens`);
      }
      console.log('');
    }

    // By framework
    if (Object.keys(stats.by_framework).length > 0) {
      subHeader('Por Framework');
      for (const [fw, count] of Object.entries(stats.by_framework)) {
        console.log(`  ${bold(fw.padEnd(15))} ${count} prompts`);
      }
      console.log('');
    }

    // By technique
    if (Object.keys(stats.by_technique).length > 0) {
      subHeader('Por Técnica');
      for (const [tech, count] of Object.entries(stats.by_technique)) {
        console.log(`  ${bold(tech.padEnd(20))} ${count} prompts`);
      }
      console.log('');
    }

    if (stats.total_prompts === 0 && stats.total_top_prompts === 0) {
      console.log(dim('  Nenhum dado ainda. Use /ouro:prompt ou ouro-prompt generate para começar.'));
    }
    break;
  }

  // ────────────────────────────────────────────────
  // TOP
  // ────────────────────────────────────────────────
  case 'top': {
    const tipo = flags.tipo || flags.type || null;
    const limit = parseInt(flags.limit) || 10;
    const top = pg.getTopByType(tipo, limit);

    header('🏆 TOP PROMPTS');

    if (top.length === 0) {
      console.log(dim('  Nenhum prompt salvo ainda.'));
      console.log(dim('  Use /ouro:prompt para gerar — score > 80 salva automaticamente.'));
    } else {
      for (const p of top) {
        console.log(`  ${c('cyan', p.id)} ${bold(p.nome)}`);
        console.log(`     Score: ${c(scoreColor(p.score), String(p.score))} | Tipo: ${p.tipo} | Usos: ${p.usos}`);
        console.log(`     Modelo: ${p.modelo_alvo} | Framework: ${p.framework} | Técnica: ${p.tecnica}`);
        console.log('');
      }
      console.log(dim(`  Total: ${top.length} prompts${tipo ? ` (filtro: ${tipo})` : ''}`));
    }
    break;
  }

  // ────────────────────────────────────────────────
  // TEMPLATES
  // ────────────────────────────────────────────────
  case 'templates': {
    header('📋 TEMPLATES DISPONÍVEIS');

    const templates = pg.loadTemplates();
    const names = Object.keys(templates);

    if (names.length === 0) {
      console.log(dim('  Nenhum template encontrado.'));
    } else {
      for (const name of names) {
        const content = templates[name];
        const firstLine = content.split('\n').find(l => l.startsWith('# ')) || name;
        const title = firstLine.replace('# Template: ', '');
        // Extract technique suggestion
        const techMatch = content.match(/Técnica Sugerida\n(.+)/);
        const tech = techMatch ? dim(techMatch[1].trim()) : '';
        console.log(`  ${c('green', '●')} ${bold(name.padEnd(20))} ${title}`);
        if (tech) console.log(`    ${tech}`);
      }
      console.log(`\n${dim(`  Total: ${names.length} templates`)}`);
    }
    break;
  }

  // ────────────────────────────────────────────────
  // GUIDED (Iterative Refinement)
  // ────────────────────────────────────────────────
  case 'guided':
  case 'guiado': {
    const tipo = flags.tipo || flags.type || extractText(1) || 'codigo';
    const validTypes = Object.keys(pg.GUIDED_QUESTIONS);

    if (!validTypes.includes(tipo)) {
      console.log(c('red', `Tipo "${tipo}" inválido.`));
      console.log(`Tipos válidos: ${validTypes.join(', ')}`);
      process.exit(1);
    }

    const questions = pg.getGuidedQuestions(tipo);

    header('🎯 MODO GUIADO — Refinamento Iterativo');

    console.log(`  ${bold('Tipo:')} ${tipo}`);
    console.log(`  ${bold('Perguntas:')} ${questions.length}`);
    console.log(`  ${dim('Responda cada pergunta para gerar um prompt de alta qualidade.')}`);
    console.log('');

    // Check if answers were provided via --key flags
    const hasAnswers = questions.some(q => flags[q.key]);

    if (hasAnswers) {
      // Answers provided via flags: generate directly
      const answers = questions.map(q => ({
        key: q.key,
        q: q.q,
        answer: flags[q.key] || '',
      }));

      subHeader('Respostas Fornecidas');
      for (const a of answers) {
        const status = a.answer ? c('green', '●') : c('red', '○');
        console.log(`  ${status} ${bold(a.key)}: ${a.answer || dim('(não respondido)')}`);
      }
      console.log('');

      const modelo = flags.modelo || flags.model || 'claude';
      const result = pg.generateFromAnswers(answers, { modelo, tipo });

      subHeader('Prompt Gerado');
      console.log(`  Score: ${c(scoreColor(result.score), `${result.score}/100`)} ${c(gradeColor(result.grade), `[${result.grade}]`)}`);
      console.log(`  Framework: ${result.frameworkLabel}`);
      console.log(`  Técnica: ${result.techniqueLabel}`);
      console.log('');
      console.log(result.prompt);

    } else {
      // No answers: show questions for the user to answer
      subHeader('Perguntas para Refinamento');
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        console.log(`  ${c('cyan', `${i + 1}.`)} ${bold(`[${q.key}]`)} ${q.q}`);
      }
      console.log('');
      console.log(dim('  Para responder, use flags:'));
      console.log(dim(`  ouro-prompt guided ${tipo} --${questions[0].key} "resposta" --${questions[1].key} "resposta" ...`));
      console.log('');
      console.log(dim('  Ou use a skill /ouro:prompt no Claude para modo interativo.'));
    }
    break;
  }

  // ────────────────────────────────────────────────
  // HELP (default)
  // ────────────────────────────────────────────────
  default:
    header('GSD Ouro — Prompt Generator Pro v0.4');
    console.log('Comandos:\n');
    console.log(`  ${c('cyan', 'generate')}  "texto"                      Gerar prompt otimizado`);
    console.log(`  ${c('cyan', 'guided')}    [tipo]                       Modo guiado (perguntas iterativas)`);
    console.log(`  ${c('cyan', 'optimize')}  "prompt fraco"               Reescrever prompt com framework`);
    console.log(`  ${c('cyan', 'verify')}    "prompt"                     Verificar qualidade (deep score)`);
    console.log(`  ${c('cyan', 'simulate')}  "prompt"                     Simular eficácia por modelo`);
    console.log(`  ${c('cyan', 'compare')}   "A" -- "B"                   Comparar dois prompts A/B`);
    console.log(`  ${c('cyan', 'stats')}                                  Métricas e estatísticas`);
    console.log(`  ${c('cyan', 'top')}       [--tipo X] [--limit N]      Melhores prompts salvos`);
    console.log(`  ${c('cyan', 'templates')}                              Templates disponíveis`);
    console.log('');
    console.log('Flags:\n');
    console.log(`  --modelo     ${dim('claude|gpt|gemini|deepseek')}   Modelo ALVO (quem recebe o prompt)`);
    console.log(`  --criador    ${dim('gemini|deepseek|codestral')}    Modelo CRIADOR (IA que gera o prompt)`);
    console.log(`  --tipo       ${dim('codigo|debug|testes|...')}      Tipo de tarefa (auto-detectado)`);
    console.log(`  --framework  ${dim('costar|rtf|care')}              Framework (auto-selecionado)`);
    console.log(`  --tecnica    ${dim('zero-shot|few-shot-cot|...')}   Técnica (auto-selecionada)`);
    console.log(`  --otimizar                               Gerar 4 variações com ranking`);
    console.log(`  --refs       ${dim('"código ou doc"')}               Materiais de referência`);
    console.log('');
    console.log(`${bold('Modo Guiado')} ${dim('(refinamento iterativo — como AppVida)')}:\n`);
    console.log(`  guided codigo       Perguntas para geração de código`);
    console.log(`  guided debug        Perguntas para debug/fix`);
    console.log(`  guided testes       Perguntas para testes`);
    console.log(`  guided refactor     Perguntas para refatoração`);
    console.log(`  guided documentacao Perguntas para documentação`);
    console.log(`  guided arquitetura  Perguntas para decisões arquiteturais`);
    console.log('');
    console.log(`${bold('Modo IA')} ${dim('(usa provider externo para criar o prompt)')}:\n`);
    console.log(`  --criador gemini     Gemini 2.5 Flash gera o prompt ${dim('(grátis)')}`);
    console.log(`  --criador deepseek   DeepSeek V3 gera o prompt ${dim('(grátis)')}`);
    console.log(`  --criador codestral  Codestral gera o prompt ${dim('(grátis)')}`);
    console.log('');
    console.log('Exemplos:\n');
    console.log(dim('  # Geração local (regras JS):'));
    console.log(dim('  ouro-prompt generate "criar botão de login"'));
    console.log(dim('  ouro-prompt generate "refatorar auth" --modelo deepseek --otimizar'));
    console.log(dim('  ouro-prompt generate "criar API" --refs "export function getUser()..."'));
    console.log(dim(''));
    console.log(dim('  # Modo guiado (iterativo):'));
    console.log(dim('  ouro-prompt guided debug --erro "TypeError null" --contexto "LoginForm"'));
    console.log(dim(''));
    console.log(dim('  # Geração via IA (meta-prompting):'));
    console.log(dim('  ouro-prompt generate "criar auth JWT" --criador gemini --modelo claude'));
    console.log(dim(''));
    console.log(dim('  # Outros:'));
    console.log(dim('  ouro-prompt simulate "seu prompt" --modelo gemini'));
    console.log(dim('  ouro-prompt compare "prompt A" -- "prompt B"'));
    console.log(dim('  ouro-prompt verify "<context>...</context><task>...</task>"'));
}
