export async function onRequestPost(context) {
  const { request, env } = context;
  
  // Set environment variables
  if (env.NEON_DATABASE_URL) {
    process.env.NEON_DATABASE_URL = env.NEON_DATABASE_URL;
  }
  if (env.JWT_SECRET) {
    process.env.JWT_SECRET = env.JWT_SECRET;
  }
  
  try {
    const headers = {};
    for (const [key, value] of request.headers.entries()) {
      headers[key.toLowerCase()] = value;
    }

    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const req = {
      method: 'POST',
      headers,
      body,
    };

    let responseData = null;
    let responseStatus = 200;

    const res = {
      status(code) {
        responseStatus = code;
        return {
          json: (data) => {
            responseData = data;
            return new Response(JSON.stringify(data), {
              status: code,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              },
            });
          }
        };
      }
    };

    // Import and call the actual login handler
    const bcrypt = await import('bcryptjs');
    const jwt = await import('jsonwebtoken');
    
    // Inline the login logic to avoid import issues
    const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET;
    if (!JWT_SECRET) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Simple database query using Neon
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.NEON_DATABASE_URL);
    
    // Find user
    const users = await sql`SELECT * FROM users WHERE email = ${email} AND deleted_at IS NULL`;
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    await sql`UPDATE users SET last_login_at = now() WHERE id = ${user.id}`;

    // Remove password_hash from response
    const { password_hash, ...safeUser } = user;

    return res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: safeUser
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error', error: String(error?.message || error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestOptions(context) {
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