import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest, requireDoctor } from '@/lib/auth-request';

export async function GET() {
  try {
    const auth = await getAuthFromRequest();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireDoctor(auth)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const result = await query(
      `SELECT c.id, c.patient_id, c.created_at,
              p.name AS patient_name, p.age, p.gender,
              pr.id AS prescription_id, pr.status AS prescription_status, pr.structured_json
       FROM Conversations c
       JOIN Patients p ON p.id = c.patient_id
       LEFT JOIN Prescriptions pr ON pr.conversation_id = c.id
       WHERE c.doctor_id = @doctor_id
       ORDER BY c.created_at DESC`,
      { doctor_id: auth.id }
    );
    const rows = result.recordset || [];
    const list = rows.map((r) => {
      let diagnosis = '';
      if (r.structured_json) {
        try {
          const s = typeof r.structured_json === 'string' ? JSON.parse(r.structured_json) : r.structured_json;
          const d = s.diagnosis;
          diagnosis = Array.isArray(d) ? d.map((x) => (typeof x === 'string' ? x : x?.name)).filter(Boolean).join(', ') : '';
        } catch (_) {}
      }
      return {
        id: r.id,
        patient_id: r.patient_id,
        patient_name: r.patient_name,
        age: r.age,
        gender: r.gender,
        mrn: `MRN${String(r.patient_id).padStart(6, '0')}`,
        date: r.created_at,
        status: r.prescription_status || 'draft',
        diagnosis: diagnosis || '—',
      };
    });
    return NextResponse.json(list);
  } catch (err) {
    console.error('Conversations list error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
