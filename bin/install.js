#!/usr/bin/env node

/**
 * GSD Ouro — Instalador
 * Inicializa a estrutura .ouro/ em um projeto existente
 */

const fs = require('fs');
const path = require('path');

const OURO_DIR = '.ouro';

const TEMPLATE_FILES = {
  'config.json': JSON.stringify({
    version: '0.1.0',
    perfil_ia: 'economico',
    ia_primaria: 'claude-sonnet',
    ias_gratuitas: ['codestral', 'gemini-pro', 'deepseek-v3'],
    meta_economia: 80,
    meta_custo_hora: 0.10
  }, null, 2),

  'PROJECT.md': `# Projeto: {nome}\n\n## Descrição\n{descrição}\n\n## Stack\n{stack}\n\n## Público-Alvo\n{público}\n`,

  'STATE.md': `# Estado Atual\n\n## Sessão\n- Início: —\n- Fase atual: —\n- Última tarefa: —\n\n## Progresso\n- Fases completas: 0\n- Tarefas concluídas: 0\n- Conformidade Kit: —\n`,

  'ROADMAP.md': `# Roadmap do Projeto\n\n## Fases\n\n### Fase 1: {nome}\n- Status: ⏳ Pendente\n- Tarefas: —\n\n_Adicione fases com /ouro:planejar_\n`,

  'REQUIREMENTS.md': `# Requisitos\n\n## v1 (MVP)\n- [ ] {requisito 1}\n\n## v2\n- [ ] {requisito futuro}\n\n## Fora de Escopo\n- {item}\n`,

  'active_context.md': `# Contexto Ativo\n\nÚltima atualização: —\nFase: —\nTarefa: —\nÚltimo arquivo: —\n`,

  'KIT_OURO.md': `# Kit Padrão Ouro — {Projeto}\n\n> Fonte única de verdade para componentes e padrões deste projeto.\n\n## Componentes\n_A ser mapeado com /ouro:novo-projeto_\n\n## Padrões de Código\n_A ser definido_\n`
};

const ANALYTICS_DIRS = [
  'analytics',
  'analytics/sessoes',
  'analytics/fases',
  'analytics/prompts',
  'analytics/ias',
  'analytics/quick',
  'phases'
];

function install(targetDir) {
  const ouroPath = path.join(targetDir || process.cwd(), OURO_DIR);

  if (fs.existsSync(ouroPath)) {
    console.log('⚠️  Pasta .ouro/ já existe. Use --force para reiniciar.');
    if (!process.argv.includes('--force')) return;
  }

  // Criar diretório principal
  fs.mkdirSync(ouroPath, { recursive: true });
  console.log('📁 Criado .ouro/');

  // Criar subdiretórios
  ANALYTICS_DIRS.forEach(dir => {
    const dirPath = path.join(ouroPath, dir);
    fs.mkdirSync(dirPath, { recursive: true });
  });
  console.log('📁 Criado analytics/ e phases/');

  // Criar arquivos template
  Object.entries(TEMPLATE_FILES).forEach(([filename, content]) => {
    const filePath = path.join(ouroPath, filename);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`📄 Criado ${filename}`);
  });

  // Dashboard inicial
  const dashboardData = {
    projeto: '',
    milestone: 1,
    progresso: 0,
    economia_pct: 0,
    custo_real: 0,
    custo_hipotetico: 0,
    conformidade: 0,
    sessoes: 0,
    tarefas_concluidas: 0,
    alertas: []
  };
  fs.writeFileSync(
    path.join(ouroPath, 'analytics', 'dashboard.json'),
    JSON.stringify(dashboardData, null, 2),
    'utf-8'
  );
  console.log('📊 Criado dashboard.json');

  console.log('\n✅ GSD Ouro inicializado!');
  console.log('Próximo passo: /ouro:novo-projeto para configurar seu projeto.\n');
}

// Executar
if (process.argv.includes('--global')) {
  console.log('🏆 GSD Ouro — Instalação Global');
  console.log('Use /ouro:novo-projeto dentro de qualquer projeto para iniciar.\n');
} else {
  install(process.argv[2]);
}
