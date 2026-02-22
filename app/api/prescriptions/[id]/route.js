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
    console.log('Request body:', JSON.stringify(body, null, 2));
    
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

    if (body.medications || body.investigations || body.advice !== undefined || body.follow_up !== undefined) {
      const presc = await query(
        `SELECT p.id FROM Prescriptions p
         JOIN Conversations c ON c.id = p.conversation_id
         WHERE p.id = @id AND c.doctor_id = @doctor_id AND p.status = 'draft'`,
        { id, doctor_id: auth.id }
      );
      if (!presc.recordset[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      if (Array.isArray(body.medications)) {
        try {
          console.log('Processing medications:', body.medications);
          await query(`DELETE FROM Medications WHERE prescription_id = @prescription_id`, { prescription_id: id });
          console.log('Deleted existing medications for prescription:', id);
          
          for (const m of body.medications) {
            console.log('Processing medication:', m);
            // Accept medications even with empty fields, matching record.js behavior
            const medData = {
              prescription_id: id,
              name: sanitizeString(m.name || '', 150),
              dosage: sanitizeString(m.dosage || '', 100),
              frequency: sanitizeString(m.frequency || '', 100),
              duration: sanitizeString(m.duration || '', 100),
              instructions: sanitizeString(m.instructions || '', 255),
            };
            console.log('Inserting medication data:', medData);
            await query(
              `INSERT INTO Medications (prescription_id, name, dosage, frequency, duration, instructions)
               VALUES (@prescription_id, @name, @dosage, @frequency, @duration, @instructions)`,
              medData
            );
            console.log('Medication inserted successfully');
          }
        } catch (medicationErr) {
          console.error('Medication insert error:', medicationErr);
          return NextResponse.json({ error: 'Failed to save medications', details: medicationErr.message }, { status: 500 });
        }
      }

      if (Array.isArray(body.investigations)) {
        try {
          console.log('Processing investigations:', body.investigations);
          await query(`DELETE FROM Investigations WHERE prescription_id = @prescription_id`, { prescription_id: id });
          console.log('Deleted existing investigations for prescription:', id);
          
          for (const t of body.investigations) {
            const testName = typeof t === 'string' ? t : (t && t.test_name);
            console.log('Processing investigation:', t, 'testName:', testName);
            // Only insert if testName is not null/undefined/empty, matching record.js behavior
            if (testName) {
              const invData = {
                prescription_id: id,
                test_name: sanitizeString(testName, 200),
              };
              console.log('Inserting investigation data:', invData);
              await query(
                `INSERT INTO Investigations (prescription_id, test_name) VALUES (@prescription_id, @test_name)`,
                invData
              );
              console.log('Investigation inserted successfully');
            }
          }
        } catch (invErr) {
          console.error('Investigation insert error:', invErr);
          return NextResponse.json({ error: 'Failed to save investigations', details: invErr.message }, { status: 500 });
        }
      }
      // Persist advice and follow_up into structured_json if provided
      if (body.advice !== undefined || body.follow_up !== undefined) {
        try {
          const cur = await query(`SELECT structured_json FROM Prescriptions WHERE id = @id`, { id });
          const curObj = cur.recordset[0] ? JSON.parse(cur.recordset[0].structured_json || '{}') : {};
          curObj.advice_and_followup = curObj.advice_and_followup || {};
          if (Array.isArray(body.advice)) {
            curObj.advice_and_followup.advice = body.advice.map((a) => sanitizeString(a || '', 500));
          }
          if (typeof body.follow_up === 'string') {
            curObj.advice_and_followup.follow_up = sanitizeString(body.follow_up || '', 2000);
          }
          await query(`UPDATE Prescriptions SET structured_json = @structured_json WHERE id = @id`, {
            structured_json: JSON.stringify(curObj),
            id,
          });
        } catch (jsonErr) {
          console.error('Failed to update structured_json:', jsonErr);
          return NextResponse.json({ error: 'Failed to save additional instructions', details: jsonErr.message }, { status: 500 });
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
