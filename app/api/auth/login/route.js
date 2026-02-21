import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, createToken, getCookieOptions, COOKIE_NAME } from '@/lib/auth';
import { validateLogin } from '@/utils/validation';

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = validateLogin(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { email, password } = parsed.data;

    const result = await query(
      `SELECT id, name, email, password_hash, role FROM Users WHERE email = @email`,
      { email }
    );
    const user = result.recordset[0];
    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    const token = await createToken({ sub: user.id, email: user.email, role: user.role });
    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    res.cookies.set(COOKIE_NAME, token, getCookieOptions());
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
