#!/usr/bin/env node

/**
 * GSD Ouro — Dashboard Server
 * Servidor local leve para o dashboard web
 * Roda em http://localhost:3333
 *
 * GET  /api/*           — Leitura de métricas
 * POST /api/track/*     — Escrita de métricas
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const analytics = require('../lib/analytics');

const PORT = 3333;
const OURO_DIR = path.join(process.cwd(), '.ouro');

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

// Parse POST body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// GET routes (leitura)
const getRoutes = {
  '/api/dashboard': () => readJSON(path.join(OURO_DIR, 'analytics', 'dashboard.json')) || {},
  '/api/sessoes': () => {
    const dir = path.join(OURO_DIR, 'analytics', 'sessoes');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => readJSON(path.join(dir, f)))
      .filter(Boolean)
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  },
  '/api/fases': () => {
    const dir = path.join(OURO_DIR, 'analytics', 'fases');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => readJSON(path.join(dir, f)))
      .filter(Boolean);
  },
  '/api/ias': () => {
    const dir = path.join(OURO_DIR, 'analytics', 'ias');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => readJSON(path.join(dir, f)))
      .filter(Boolean);
  },
  '/api/prompts': () => {
    const file = path.join(OURO_DIR, 'analytics', 'prompts', 'historico.json');
    return readJSON(file) || [];
  }
};

// POST routes (escrita)
const postRoutes = {
  '/api/track/session/start': async () => {
    return analytics.sessionStart(OURO_DIR);
  },
  '/api/track/session/end': async () => {
    const session = analytics.sessionEnd(OURO_DIR);
    return session || { error: 'Nenhuma sessao ativa' };
  },
  '/api/track/task': async (body) => {
    return analytics.logTask(OURO_DIR, body);
  },
  '/api/track/ia': async (body) => {
    return analytics.updateIA(OURO_DIR, body);
  },
  '/api/track/prompt': async (body) => {
    return analytics.logPrompt(OURO_DIR, body);
  },
  '/api/track/fase': async (body) => {
    return analytics.updateFase(OURO_DIR, body);
  },
  '/api/track/refresh': async () => {
    return analytics.refreshDashboard(OURO_DIR);
  }
};

// Serve dashboard HTML
function getDashboardHTML() {
  const htmlPath = path.join(__dirname, '..', 'dashboard', 'index.html');
  if (fs.existsSync(htmlPath)) {
    return fs.readFileSync(htmlPath, 'utf-8');
  }
  return '<html><body><h1>GSD Ouro Dashboard</h1><p>Dashboard HTML nao encontrado.</p></body></html>';
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // GET API routes
  if (req.method === 'GET' && req.url.startsWith('/api/')) {
    const handler = getRoutes[req.url];
    if (handler) return sendJSON(res, 200, handler());
    return sendJSON(res, 404, { error: 'Not found' });
  }

  // POST API routes
  if (req.method === 'POST' && req.url.startsWith('/api/track/')) {
    const handler = postRoutes[req.url];
    if (!handler) return sendJSON(res, 404, { error: 'Not found' });
    try {
      const body = await parseBody(req);
      const result = await handler(body);
      return sendJSON(res, 200, { ok: true, data: result });
    } catch (err) {
      return sendJSON(res, 400, { error: err.message });
    }
  }

  // Dashboard HTML
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(getDashboardHTML());
});

server.listen(PORT, () => {
  console.log(`\nGSD Ouro Dashboard`);
  console.log(`http://localhost:${PORT}\n`);
  console.log('API de leitura (GET):');
  console.log('  /api/dashboard     Metricas gerais');
  console.log('  /api/sessoes       Historico de sessoes');
  console.log('  /api/fases         Status das fases');
  console.log('  /api/ias           Performance das IAs');
  console.log('  /api/prompts       Historico de prompts');
  console.log('\nAPI de escrita (POST):');
  console.log('  /api/track/session/start   Iniciar sessao');
  console.log('  /api/track/session/end     Finalizar sessao');
  console.log('  /api/track/task            Registrar tarefa');
  console.log('  /api/track/ia              Registrar uso de IA');
  console.log('  /api/track/prompt          Registrar prompt');
  console.log('  /api/track/fase            Atualizar fase');
  console.log('  /api/track/refresh         Recalcular dashboard\n');
});
