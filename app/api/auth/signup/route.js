import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, createToken, getCookieOptions, COOKIE_NAME } from '@/lib/auth';
import { validateSignup } from '@/utils/validation';

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = validateSignup(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, email, password, role } = parsed.data;
    const password_hash = await hashPassword(password);

    await query(
      `INSERT INTO Users (name, email, password_hash, role, created_at)
       VALUES (@name, @email, @password_hash, @role, SYSDATETIME())`,
      { name, email, password_hash, role }
    );

    const userResult = await query(
      `SELECT id, name, email, role FROM Users WHERE email = @email`,
      { email }
    );
    const user = userResult.recordset[0];
    if (!user) return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });

    const token = await createToken({ sub: user.id, email: user.email, role: user.role });
    const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    res.cookies.set(COOKIE_NAME, token, getCookieOptions());
    return res;
  } catch (err) {
    if (err.number === 2627) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    if (err.code === 'ELOGIN' || (err.name === 'ConnectionError' && err.message?.includes('Login failed'))) {
      console.error('Signup error: Database login failed. Enable SQL Server auth and check user/password in lib/db.js');
      return NextResponse.json(
        { error: 'Database unavailable. Check server authentication and credentials.' },
        { status: 503 }
      );
    }
    console.error('Signup error:', err);
    const message = process.env.NODE_ENV === 'development' ? (err.message || String(err)) : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
