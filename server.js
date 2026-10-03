import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Path to compiled frontend assets
const distPath = path.join(__dirname, 'dist');

// Enable JSON body parsing for API requests
app.use(express.json({ limit: '10mb' }));

// Enable compression headers and security headers
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Menu Digital Acougue');
  next();
});

// Server-side data persistence for Menu & Prices
const dataDir = path.join(__dirname, 'data');
const dataFilePath = path.join(dataDir, 'menu-data.json');

function loadServerData() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const raw = fs.readFileSync(dataFilePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[API] Erro ao ler dados do servidor:', err);
  }
  return null;
}

function saveServerData(data) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[API] Erro ao salvar dados no servidor:', err);
    return false;
  }
}

// Health check endpoint (frequently used by Hostinger / Cloud / Docker / PM2)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// API Routes for Automatic Polling & Price Synchronization
app.get('/api/menu', (req, res) => {
  const data = loadServerData();
  if (data && (data.items || data.settings)) {
    return res.status(200).json(data);
  }
  return res.status(200).json({ items: null, settings: null, lastUpdated: Date.now() });
});

app.post('/api/menu', (req, res) => {
  const { items, settings, updatedId } = req.body;
  const current = loadServerData() || {};
  const updatedData = {
    ...current,
    items: items !== undefined ? items : current.items,
    settings: settings !== undefined ? settings : current.settings,
    updatedId: updatedId || null,
    lastUpdated: Date.now(),
  };
  saveServerData(updatedData);
  return res.status(200).json({ success: true, lastUpdated: updatedData.lastUpdated });
});

// Serve static assets from 'dist'
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
  }));

  // SPA fallback: any route goes to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Helpful fallback if build hasn't run yet on Hostinger
  app.get('*', (req, res) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Menu Digital - Hostinger</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #14110f; color: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: #1e1916; border: 1px solid #3d3028; border-radius: 16px; padding: 32px; max-width: 540px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); text-align: center; }
          h1 { color: #f59e0b; margin-top: 0; font-size: 24px; }
          p { color: #d4d4d4; font-size: 14px; line-height: 1.6; }
          .code-box { background: #0c0a09; padding: 12px; border-radius: 8px; color: #fbbf24; font-family: monospace; font-size: 13px; margin: 16px 0; border: 1px solid #292524; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🥩 Servidor Hostinger Inicializado!</h1>
          <p>O arquivo <code>server.js</code> está funcionando corretamente na porta <strong>${PORT}</strong>.</p>
          <p>Para exibir o visual completo do Menu Digital, gere os arquivos estáticos executando o comando abaixo no terminal da Hostinger:</p>
          <div class="code-box">npm run build</div>
          <p>Em seguida, atualize esta página.</p>
        </div>
      </body>
      </html>
    `);
  });
}

app.listen(PORT, HOST, () => {
  console.log(`[Hostinger] Servidor do Menu Digital rodando em http://${HOST}:${PORT}`);
});
