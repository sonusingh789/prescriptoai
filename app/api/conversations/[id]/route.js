import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest, requireDoctor } from '@/lib/auth-request';
import { sanitizeString } from '@/utils/sanitize';

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

export async function POST(request, { params }) {
  try {
    const auth = await getAuthFromRequest();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireDoctor(auth)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await request.json();

    // Get the prescription associated with this conversation
    const presc = await query(
      `SELECT p.id FROM Prescriptions p
       JOIN Conversations c ON c.id = p.conversation_id
       WHERE p.conversation_id = @conversation_id AND c.doctor_id = @doctor_id AND p.status = 'draft'`,
      { conversation_id: id, doctor_id: auth.id }
    );

    if (!presc.recordset[0]) {
      return NextResponse.json({ error: 'Prescription not found or not in draft status' }, { status: 404 });
    }

    const prescription_id = presc.recordset[0].id;

    // Handle medications
    if (Array.isArray(body.medications) && body.medications.length > 0) {
      // Delete existing medications for this prescription
      await query(`DELETE FROM Medications WHERE prescription_id = @prescription_id`, { prescription_id });

      // Insert new medications
      for (const m of body.medications) {
        if (!m.name || !m.name.trim()) {
          return NextResponse.json({ error: 'Medication name is required' }, { status: 400 });
        }

        await query(
          `INSERT INTO Medications (prescription_id, name, dosage, frequency, duration, instructions)
           VALUES (@prescription_id, @name, @dosage, @frequency, @duration, @instructions)`,
          {
            prescription_id,
            name: sanitizeString(m.name, 150),
            dosage: sanitizeString(m.dosage || '', 100),
            frequency: sanitizeString(m.frequency || '', 100),
            duration: sanitizeString(m.duration || '', 100),
            instructions: sanitizeString(m.instructions || '', 255),
          }
        );
      }
    }

    // Handle investigations
    if (Array.isArray(body.investigations) && body.investigations.length > 0) {
      // Delete existing investigations for this prescription
      await query(`DELETE FROM Investigations WHERE prescription_id = @prescription_id`, { prescription_id });

      // Insert new investigations
      for (const inv of body.investigations) {
        const testName = typeof inv === 'string' ? inv : (inv && inv.test_name);

        if (!testName || String(testName).trim() === '') {
          return NextResponse.json({ error: 'Investigation test_name is required' }, { status: 400 });
        }

        await query(
          `INSERT INTO Investigations (prescription_id, test_name)
           VALUES (@prescription_id, @test_name)`,
          {
            prescription_id,
            test_name: sanitizeString(testName, 200),
          }
        );
      }
    }

    // Fetch updated data
    const meds = await query(
      `SELECT id, name, dosage, frequency, duration, instructions FROM Medications WHERE prescription_id = @prescription_id`,
      { prescription_id }
    );

    const inv = await query(
      `SELECT id, test_name FROM Investigations WHERE prescription_id = @prescription_id`,
      { prescription_id }
    );

    return NextResponse.json({
      ok: true,
      prescription_id,
      medications: meds.recordset || [],
      investigations: inv.recordset || [],
    });
  } catch (err) {
    console.error('Conversation POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
