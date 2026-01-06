import activitiesHandler from '../../api/activities/index';
import registerActivityHandler from '../../api/activities/register';
import attendanceHandler from '../../api/attendance/index';
import auditLogsHandler from '../../api/audit-logs/index';
import loginHandler from '../../api/auth/login';
import signupHandler from '../../api/auth/signup';
import galleryHandler from '../../api/gallery/index';
import iuranChecklistHandler from '../../api/iuran/checklist';
import iuranConfigHandler from '../../api/iuran/config';
import iuranPembayaranHandler from '../../api/iuran/pembayaran';
import meetingsHandler from '../../api/meetings/index';
import transactionsHandler from '../../api/transactions/index';
import usersPublicHandler from '../../api/users/public';
import usersHandler from '../../api/users/index';

type Handler = (req: any, res: any) => Promise<any> | any;

const routes: Array<{ prefix: string; handler: Handler }> = [
  { prefix: '/auth/login', handler: loginHandler },
  { prefix: '/auth/signup', handler: signupHandler },
  { prefix: '/activities/register', handler: registerActivityHandler },
  { prefix: '/activities', handler: activitiesHandler },
  { prefix: '/transactions', handler: transactionsHandler },
  { prefix: '/attendance', handler: attendanceHandler },
  { prefix: '/meetings', handler: meetingsHandler },
  { prefix: '/audit-logs', handler: auditLogsHandler },
  { prefix: '/gallery', handler: galleryHandler },
  { prefix: '/users/public', handler: usersPublicHandler },
  { prefix: '/users', handler: usersHandler },
  { prefix: '/iuran/config', handler: iuranConfigHandler },
  { prefix: '/iuran/pembayaran', handler: iuranPembayaranHandler },
  { prefix: '/iuran/checklist', handler: iuranChecklistHandler },
];

function setProcessEnv(env: Record<string, string>) {
  if (env.NEON_DATABASE_URL) {
    process.env.NEON_DATABASE_URL = env.NEON_DATABASE_URL;
  }
  if (env.JWT_SECRET) {
    process.env.JWT_SECRET = env.JWT_SECRET;
  }
  if (env.VITE_NEON_URL && !process.env.NEON_DATABASE_URL) {
    process.env.NEON_DATABASE_URL = env.VITE_NEON_URL;
  }
  if (env.VITE_JWT_SECRET && !process.env.JWT_SECRET) {
    process.env.JWT_SECRET = env.VITE_JWT_SECRET;
  }
}

function findHandler(pathname: string) {
  return routes.find((route) => pathname.startsWith(route.prefix));
}

function toQueryObject(searchParams: URLSearchParams) {
  const query: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    query[key] = value;
  }
  return query;
}

async function toRequestBody(request: Request) {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return undefined;
  }
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return undefined;
  }
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

function createResponseCollector() {
  let response: Response | null = null;

  const setJsonResponse = (status: number, data: any) => {
    response = new Response(JSON.stringify(data), {
      status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
    return response;
  };

  return {
    status(code: number) {
      return {
        json: (data: any) => setJsonResponse(code, data),
        end: () => {
          response = new Response(null, { 
            status: code,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          });
          return response;
        },
      };
    },
    json(data: any) {
      return setJsonResponse(200, data);
    },
    getResponse() {
      return response;
    },
  };
}

export async function onRequestPost(context: any) {
  return handleRequest(context, 'POST');
}

export async function onRequestGet(context: any) {
  return handleRequest(context, 'GET');
}

export async function onRequestPut(context: any) {
  return handleRequest(context, 'PUT');
}

export async function onRequestDelete(context: any) {
  return handleRequest(context, 'DELETE');
}

export async function onRequestPatch(context: any) {
  return handleRequest(context, 'PATCH');
}

export async function onRequestOptions(context: any) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function handleRequest(context: any, method: string) {
  const { request, env } = context;
  setProcessEnv(env || {});

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/^\/api/, '') || '/';
  const route = findHandler(pathname);

  if (!route) {
    return new Response(JSON.stringify({ message: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const headers: Record<string, string> = {};
  for (const [key, value] of request.headers.entries()) {
    headers[key.toLowerCase()] = value;
  }

  const req = {
    method: method,
    headers,
    query: toQueryObject(url.searchParams),
    body: await toRequestBody(request),
  };

  const res = createResponseCollector();

  try {
    await route.handler(req, res);
  } catch (error: any) {
    return new Response(
      JSON.stringify({ message: 'Internal Server Error', error: String(error?.message || error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return res.getResponse() || new Response(null, { status: 204 });
}