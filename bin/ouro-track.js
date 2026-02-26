#!/usr/bin/env node

/**
 * GSD Ouro — CLI de Rastreamento de Métricas
 *
 * Uso:
 *   node bin/ouro-track.js session start
 *   node bin/ouro-track.js session end
 *   node bin/ouro-track.js task --nome "X" --ia codestral --tokens-in 500 --tokens-out 1200
 *   node bin/ouro-track.js ia --nome codestral --tokens-in 500 --tokens-out 1200
 *   node bin/ouro-track.js prompt --input "texto" --tipo codigo --ia codestral
 *   node bin/ouro-track.js fase --numero 1 --nome "Setup" --status done --progresso 100
 *   node bin/ouro-track.js refresh
 */

const analytics = require('../lib/analytics');

const args = process.argv.slice(2);
const command = args[0];
const subcommand = args[1];

// Parse --key value pairs
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

const ouroDir = analytics.findOuroDir();
if (!ouroDir && command !== undefined) {
  console.error('Pasta .ouro/ nao encontrada. Execute bin/install.js primeiro.');
  process.exit(1);
}

// Flags start after command (and subcommand for 'session')
const flagStart = command === 'session' ? 2 : 1;
const flags = parseFlags(args.slice(flagStart));

switch (command) {
  case 'session': {
    if (subcommand === 'start') {
      const session = analytics.sessionStart(ouroDir);
      console.log(`Sessao iniciada: ${session.sessao_id}`);
    } else if (subcommand === 'end') {
      const session = analytics.sessionEnd(ouroDir);
      if (session) {
        const durMin = Math.round(session.duracao_segundos / 60);
        console.log(`Sessao finalizada: ${session.sessao_id}`);
        console.log(`Duracao: ${durMin}min`);
        console.log(`Tarefas: ${session.tarefas.concluidas}/${session.tarefas.total}`);
        console.log(`Custo: $${session.custo.real.toFixed(4)} (hipotetico: $${session.custo.hipotetico.toFixed(4)})`);
      } else {
        console.log('Nenhuma sessao ativa encontrada.');
      }
    } else if (subcommand === 'status') {
      const active = analytics.getActiveSession(ouroDir);
      if (active) {
        const s = active.session;
        const elapsed = Math.round((Date.now() - new Date(s.timestamp).getTime()) / 60000);
        console.log(`Sessao ativa: ${s.sessao_id} (${elapsed}min)`);
        console.log(`Tarefas: ${s.tarefas.concluidas}/${s.tarefas.total}`);
        console.log(`Custo: $${s.custo.real.toFixed(4)}`);
      } else {
        console.log('Nenhuma sessao ativa.');
      }
    } else {
      console.log('Uso: ouro-track session [start|end|status]');
    }
    break;
  }

  case 'task': {
    const result = analytics.logTask(ouroDir, {
      fase: flags.fase,
      nome: flags.nome,
      ia: flags.ia,
      custo: flags.custo,
      custo_hipotetico: flags['custo-hip'],
      tokens_in: flags['tokens-in'],
      tokens_out: flags['tokens-out'],
      latencia: flags.latencia,
      status: flags.status || 'ok'
    });
    console.log(`Tarefa registrada: ${flags.nome || '(sem nome)'} via ${flags.ia || '?'}`);
    console.log(`Sessao: ${result.tarefas.concluidas}/${result.tarefas.total} tarefas`);
    break;
  }

  case 'ia': {
    const result = analytics.updateIA(ouroDir, {
      nome: flags.nome,
      sucesso: flags.status !== 'falha',
      tokens_in: flags['tokens-in'],
      tokens_out: flags['tokens-out'],
      custo: flags.custo,
      latencia: flags.latencia
    });
    console.log(`IA atualizada: ${result.nome} (${result.chamadas_total} chamadas, ${result.taxa_sucesso_pct}% sucesso)`);
    break;
  }

  case 'prompt': {
    const count = analytics.logPrompt(ouroDir, {
      input: flags.input,
      tipo: flags.tipo,
      ia: flags.ia,
      modo: flags.modo,
      resultado: flags.resultado,
      tokens: flags.tokens,
      custo: flags.custo
    });
    console.log(`Prompt registrado (#${count})`);
    break;
  }

  case 'fase': {
    const result = analytics.updateFase(ouroDir, {
      numero: flags.numero,
      nome: flags.nome,
      status: flags.status,
      progresso: flags.progresso,
      tarefas_total: flags['tarefas-total'],
      tarefas_ok: flags['tarefas-ok'],
      conformidade: flags.conformidade,
      custo_real: flags['custo-real'],
      custo_hipotetico: flags['custo-hip']
    });
    console.log(`Fase ${result.numero} atualizada: ${result.nome} (${result.progresso_pct}%, ${result.status})`);
    break;
  }

  case 'refresh': {
    const dash = analytics.refreshDashboard(ouroDir);
    console.log('Dashboard atualizado:');
    console.log(`  Projeto: ${dash.projeto || '(nao definido)'}`);
    console.log(`  Progresso: ${dash.progresso}%`);
    console.log(`  Economia: ${dash.economia_pct}%`);
    console.log(`  Sessoes: ${dash.sessoes}`);
    console.log(`  Tarefas: ${dash.tarefas_concluidas}`);
    console.log(`  Custo: $${dash.custo_real} (hip: $${dash.custo_hipotetico})`);
    break;
  }

  default:
    console.log('GSD Ouro — Rastreador de Metricas\n');
    console.log('Comandos:');
    console.log('  session start                          Iniciar sessao');
    console.log('  session end                            Finalizar sessao');
    console.log('  session status                         Ver sessao ativa');
    console.log('  task --nome X --ia Y [flags]           Registrar tarefa concluida');
    console.log('  ia --nome X [flags]                    Registrar uso de IA');
    console.log('  prompt --input X --ia Y [flags]        Registrar prompt');
    console.log('  fase --numero N --status S [flags]     Atualizar fase');
    console.log('  refresh                                Recalcular dashboard');
    console.log('\nFlags comuns:');
    console.log('  --custo N          Custo real em USD');
    console.log('  --custo-hip N      Custo hipotetico (se usasse Claude)');
    console.log('  --tokens-in N      Tokens de entrada');
    console.log('  --tokens-out N     Tokens de saida');
    console.log('  --latencia N       Latencia em segundos');
    console.log('  --status ok|falha  Status da tarefa');
    console.log('  --conformidade N   Conformidade com Kit (0-100)');
    console.log('  --progresso N      Progresso da fase (0-100)');
}
