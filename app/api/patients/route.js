import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth-request';
import { validateCreatePatient } from '@/utils/validation';

export async function GET() {
  try {
    const auth = await getAuthFromRequest();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (auth.role !== 'doctor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const result = await query(
      `SELECT id, name, age, gender, phone FROM Patients ORDER BY name`
    );
    return NextResponse.json(result.recordset || []);
  } catch (err) {
    console.error('Patients list error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await getAuthFromRequest();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (auth.role !== 'doctor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const parsed = validateCreatePatient(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, age, gender, phone } = parsed.data;
    await query(
      `INSERT INTO Patients (name, age, gender, phone) VALUES (@name, @age, @gender, @phone)`,
      {
        name,
        age: age ?? null,
        gender: gender ?? null,
        phone: (phone && String(phone).trim()) || null,
      }
    );
    const result = await query(
      `SELECT id, name, age, gender, phone FROM Patients WHERE name = @name ORDER BY id DESC`,
      { name }
    );
    const patient = result.recordset?.[0];
    return NextResponse.json(patient || { name, age, gender, phone });
  } catch (err) {
    console.error('Create patient error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
