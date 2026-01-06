import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { parse } from 'url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      basicSsl(),
      react(),
      {
        name: 'api-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api')) {
              const parsedUrl = parse(req.url, true);
              const { pathname, query } = parsedUrl;
              const apiPath = pathname?.replace('/api', '') || '/';

              // Attach query to req for handlers
              (req as any).query = query;
              let filePath = '';
              if (apiPath.startsWith('/auth/login')) filePath = './api/auth/login.ts';
              else if (apiPath.startsWith('/auth/signup')) filePath = './api/auth/signup.ts';
              else if (apiPath.startsWith('/activities/register')) filePath = './api/activities/register.ts';
              else if (apiPath.startsWith('/activities')) filePath = './api/activities/index.ts';
              else if (apiPath.startsWith('/transactions')) filePath = './api/transactions/index.ts';
              else if (apiPath.startsWith('/attendance')) filePath = './api/attendance/index.ts';
              else if (apiPath.startsWith('/meetings')) filePath = './api/meetings/index.ts';
              else if (apiPath.startsWith('/audit-logs')) filePath = './api/audit-logs/index.ts';
              else if (apiPath.startsWith('/gallery')) filePath = './api/gallery/index.ts';
              else if (apiPath.startsWith('/users/public')) filePath = './api/users/public.ts';
              else if (apiPath.startsWith('/users')) filePath = './api/users/index.ts';
              else if (apiPath.startsWith('/iuran/config')) filePath = './api/iuran/config.ts';
              else if (apiPath.startsWith('/iuran/pembayaran')) filePath = './api/iuran/pembayaran.ts';
              else if (apiPath.startsWith('/iuran/checklist')) filePath = './api/iuran/checklist.ts';

              if (filePath) {
                try {
                  // Set environment variables for the handler
                  process.env.NEON_DATABASE_URL = env.NEON_DATABASE_URL || env.VITE_NEON_URL;
                  process.env.JWT_SECRET = env.JWT_SECRET || env.VITE_JWT_SECRET;

                  const { default: handler } = await server.ssrLoadModule(filePath);

                  // Simple req/res mock for Vite's connect middleware
                  const mockRes = {
                    status: (code: number) => ({
                      json: (data: any) => {
                        res.statusCode = code;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                      }
                    })
                  };

                  // Parse body for write requests
                  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                    let body = '';
                    req.on('data', chunk => body += chunk);
                    req.on('end', async () => {
                      try {
                        (req as any).body = body ? JSON.parse(body) : {};
                        await handler(req, mockRes);
                      } catch (e) {
                        res.statusCode = 500;
                        res.end(JSON.stringify({ message: 'Error parsing body' }));
                      }
                    });
                    return;
                  }

                  await handler(req, mockRes);
                  return;
                } catch (e) {
                  console.error('API Error:', e);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ message: 'Internal Server Error', error: String(e) }));
                  return;
                }
              }
            }
            next();
          });
        }
      }
    ],
    server: {
      host: '0.0.0.0',
      https: true
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
