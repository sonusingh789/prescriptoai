import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth-request';

export async function GET() {
  const auth = await getAuthFromRequest();
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await query(
      `SELECT id, name, email, role FROM Users WHERE id = @id`,
      { id: auth.id }
    );
    const user = result.recordset[0];
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err) {
    console.error('Auth me error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
