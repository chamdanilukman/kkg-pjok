// Middleware to serve static assets first, then handle API routes
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  
  // If it's an API route, let the specific function handle it
  if (url.pathname.startsWith('/api/')) {
    return next();
  }
  
  // For all other routes, serve static assets
  try {
    return await env.ASSETS.fetch(request);
  } catch (e) {
    // If asset not found, serve index.html for SPA routing
    return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
  }
}