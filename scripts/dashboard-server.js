#!/usr/bin/env node

/**
 * GSD Ouro — Dashboard Server
 * Servidor local leve para o dashboard web
 * Roda em http://localhost:3333
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3333;
const OURO_DIR = path.join(process.cwd(), '.ouro');

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function readMarkdown(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

// API Routes
const routes = {
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

// Serve dashboard HTML
function getDashboardHTML() {
  const htmlPath = path.join(__dirname, '..', 'dashboard', 'index.html');
  if (fs.existsSync(htmlPath)) {
    return fs.readFileSync(htmlPath, 'utf-8');
  }
  return '<html><body><h1>GSD Ouro Dashboard</h1><p>Dashboard HTML não encontrado. Execute a partir do diretório gsd-ouro.</p></body></html>';
}

// HTTP Server
const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // API routes
  if (req.url.startsWith('/api/')) {
    const handler = routes[req.url];
    if (handler) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(handler()));
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found' }));
  }

  // Dashboard HTML
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(getDashboardHTML());
});

server.listen(PORT, () => {
  console.log(`\n🏆 GSD Ouro Dashboard`);
  console.log(`📊 http://localhost:${PORT}\n`);
  console.log(`API disponível em:`);
  console.log(`  GET /api/dashboard  — Métricas gerais`);
  console.log(`  GET /api/sessoes    — Histórico de sessões`);
  console.log(`  GET /api/fases      — Status das fases`);
  console.log(`  GET /api/ias        — Performance das IAs`);
  console.log(`  GET /api/prompts    — Histórico de prompts\n`);
});
