import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function apiMenuPlugin(): Plugin {
  const dataDir = path.resolve(__dirname, 'data');
  const dataFilePath = path.join(dataDir, 'menu-data.json');

  const loadData = () => {
    try {
      if (fs.existsSync(dataFilePath)) {
        return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
      }
    } catch {
      // ignore
    }
    return null;
  };

  const saveData = (data: any) => {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch {
      // ignore
    }
  };

  return {
    name: 'api-menu-middleware',
    configureServer(server) {
      server.middlewares.use('/api/menu', (req, res, next) => {
        if (req.method === 'GET') {
          const data = loadData() || { items: null, settings: null, lastUpdated: Date.now() };
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              const current = loadData() || {};
              const updatedData = {
                ...current,
                items: parsed.items !== undefined ? parsed.items : current.items,
                settings: parsed.settings !== undefined ? parsed.settings : current.settings,
                updatedId: parsed.updatedId || null,
                lastUpdated: Date.now(),
              };
              saveData(updatedData);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, lastUpdated: updatedData.lastUpdated }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiMenuPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
