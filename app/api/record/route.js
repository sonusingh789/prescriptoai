import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest, requireDoctor } from '@/lib/auth-request';
import { transcribeWithWhisper, getStructuredPrescriptionFromTranscript, summarizeTranscript } from '@/lib/openai';
import { sanitizeTranscript } from '@/utils/sanitize';
import { validateRecordBody } from '@/utils/validation';

export async function POST(request) {
  try {
    const auth = await getAuthFromRequest();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireDoctor(auth)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const formData = await request.formData();
    const patientId = formData.get('patient_id');
    const file = formData.get('audio');
    const parsed = validateRecordBody({ patient_id: patientId });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid patient_id', details: parsed.error.flatten() }, { status: 400 });
    }
    if (!file || !(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ error: 'Audio file required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const transcript = await transcribeWithWhisper(buffer, file.name || 'audio.webm');
    const sanitizedTranscript = sanitizeTranscript(transcript);

    const structured = await getStructuredPrescriptionFromTranscript(sanitizedTranscript);
    const summary = await summarizeTranscript(sanitizedTranscript);
    const structuredJson = JSON.stringify({ ...structured, summary });

    await query(
      `INSERT INTO Conversations (patient_id, doctor_id, audio_url, transcript, created_at)
       VALUES (@patient_id, @doctor_id, NULL, @transcript, SYSDATETIME())`,
      { patient_id: parsed.data.patient_id, doctor_id: auth.id, transcript: sanitizedTranscript }
    );
    const convResult = await query(
      `SELECT TOP 1 id FROM Conversations WHERE doctor_id = @doctor_id ORDER BY created_at DESC`,
      { doctor_id: auth.id }
    );
    const conversationId = convResult.recordset[0]?.id;
    if (!conversationId) return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });

    await query(
      `INSERT INTO Prescriptions (conversation_id, structured_json, status, created_at)
       VALUES (@conversation_id, @structured_json, 'draft', SYSDATETIME())`,
      { conversation_id: conversationId, structured_json: structuredJson }
    );
    const prescResult = await query(
      `SELECT id FROM Prescriptions WHERE conversation_id = @conversation_id`,
      { conversation_id: conversationId }
    );
    const prescriptionId = prescResult.recordset[0]?.id;

    const meds = Array.isArray(structured.medications) ? structured.medications : [];
    for (const m of meds) {
      await query(
        `INSERT INTO Medications (prescription_id, name, dosage, frequency, duration, instructions)
         VALUES (@prescription_id, @name, @dosage, @frequency, @duration, @instructions)`,
        {
          prescription_id: prescriptionId,
          name: m.name || '',
          dosage: m.dosage || '',
          frequency: m.frequency || '',
          duration: m.duration || '',
          instructions: m.instructions || '',
        }
      );
    }
    const inv = Array.isArray(structured.investigations_advised) ? structured.investigations_advised : [];
    for (const t of inv) {
      const testName = typeof t === 'string' ? t : t?.test_name || '';
      if (testName) {
        await query(
          `INSERT INTO Investigations (prescription_id, test_name) VALUES (@prescription_id, @test_name)`,
          { prescription_id: prescriptionId, test_name: testName }
        );
      }
    }

    return NextResponse.json({ conversationId, prescriptionId });
  } catch (err) {
    console.error('Record/upload error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
