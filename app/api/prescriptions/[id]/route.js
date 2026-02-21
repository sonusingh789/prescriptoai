import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest, requireDoctor } from '@/lib/auth-request';
import { sanitizeString } from '@/utils/sanitize';

export async function PATCH(request, { params }) {
  try {
    const auth = await getAuthFromRequest();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireDoctor(auth)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await request.json();
    if (body.approve === true) {
      const presc = await query(
        `SELECT p.id, p.conversation_id FROM Prescriptions p
         JOIN Conversations c ON c.id = p.conversation_id
         WHERE p.id = @id AND c.doctor_id = @doctor_id AND p.status = 'draft'`,
        { id, doctor_id: auth.id }
      );
      const prescription = presc.recordset[0];
      if (!prescription) return NextResponse.json({ error: 'Not found or already approved' }, { status: 404 });

      await query(
        `UPDATE Prescriptions SET status = 'approved', approved_by = @approved_by, approved_at = SYSDATETIME() WHERE id = @id`,
        { id, approved_by: auth.id }
      );
      await query(
        `INSERT INTO AuditLogs (prescription_id, edited_by, change_description, timestamp)
         VALUES (@prescription_id, @edited_by, @change_description, SYSDATETIME())`,
        { prescription_id: id, edited_by: auth.id, change_description: 'Prescription approved' }
      );
      return NextResponse.json({ ok: true, status: 'approved' });
    }

    if (body.medications || body.investigations) {
      const presc = await query(
        `SELECT p.id FROM Prescriptions p
         JOIN Conversations c ON c.id = p.conversation_id
         WHERE p.id = @id AND c.doctor_id = @doctor_id AND p.status = 'draft'`,
        { id, doctor_id: auth.id }
      );
      if (!presc.recordset[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      if (Array.isArray(body.medications)) {
        await query(`DELETE FROM Medications WHERE prescription_id = @id`, { id });
        for (const m of body.medications) {
          await query(
            `INSERT INTO Medications (prescription_id, name, dosage, frequency, duration, instructions)
             VALUES (@prescription_id, @name, @dosage, @frequency, @duration, @instructions)`,
            {
              prescription_id: id,
              name: sanitizeString(m.name, 150),
              dosage: sanitizeString(m.dosage, 100),
              frequency: sanitizeString(m.frequency, 100),
              duration: sanitizeString(m.duration, 100),
              instructions: sanitizeString(m.instructions, 255),
            }
          );
        }
      }
      if (Array.isArray(body.investigations)) {
        await query(`DELETE FROM Investigations WHERE prescription_id = @id`, { id });
        for (const t of body.investigations) {
          const testName = typeof t === 'string' ? t : (t && t.test_name);
          if (testName != null && String(testName).trim() !== '') {
            await query(
              `INSERT INTO Investigations (prescription_id, test_name) VALUES (@prescription_id, @test_name)`,
              { prescription_id: id, test_name: sanitizeString(testName, 200) }
            );
          }
        }
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  } catch (err) {
    console.error('Prescription PATCH error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
