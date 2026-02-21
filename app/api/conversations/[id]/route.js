import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest, requireDoctor } from '@/lib/auth-request';

export async function GET(request, { params }) {
  try {
    const auth = await getAuthFromRequest();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireDoctor(auth)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const conv = await query(
      `SELECT c.id, c.patient_id, c.doctor_id, c.transcript, c.created_at,
              p.name AS patient_name, p.age, p.gender, p.phone
       FROM Conversations c
       JOIN Patients p ON p.id = c.patient_id
       WHERE c.id = @id AND c.doctor_id = @doctor_id`,
      { id, doctor_id: auth.id }
    );
    const conversation = conv.recordset[0];
    if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const presc = await query(
      `SELECT id, structured_json, status, approved_by, approved_at, created_at
       FROM Prescriptions WHERE conversation_id = @id`,
      { id }
    );
    const prescription = presc.recordset[0];
    if (!prescription) return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });

    const meds = await query(
      `SELECT id, name, dosage, frequency, duration, instructions FROM Medications WHERE prescription_id = @prescription_id`,
      { prescription_id: prescription.id }
    );
    const inv = await query(
      `SELECT id, test_name FROM Investigations WHERE prescription_id = @prescription_id`,
      { prescription_id: prescription.id }
    );

    const structured = JSON.parse(prescription.structured_json || '{}');
    return NextResponse.json({
      conversation: {
        id: conversation.id,
        patient_id: conversation.patient_id,
        patient_name: conversation.patient_name,
        age: conversation.age,
        gender: conversation.gender,
        phone: conversation.phone,
        transcript: conversation.transcript,
        created_at: conversation.created_at,
      },
      prescription: {
        id: prescription.id,
        status: prescription.status,
        approved_by: prescription.approved_by,
        approved_at: prescription.approved_at,
        created_at: prescription.created_at,
        structured_json: structured,
        medications: meds.recordset || [],
        investigations: inv.recordset || [],
      },
    });
  } catch (err) {
    console.error('Conversation get error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
