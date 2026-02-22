import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest, requireDoctor } from '@/lib/auth-request';
import { buildPrescriptionPDF } from '@/lib/pdf';

export async function GET(request, { params }) {
  try {
    const url = new URL(request.url);
    const disposition = url.searchParams.get('disposition'); // 'inline' | 'attachment' (default: attachment)

    const auth = await getAuthFromRequest();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!requireDoctor(auth)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const presc = await query(
      `SELECT p.id, p.structured_json, p.status, p.approved_at,
              c.patient_id,
              pat.name AS patient_name, pat.age, pat.gender
       FROM Prescriptions p
       JOIN Conversations c ON c.id = p.conversation_id
       JOIN Patients pat ON pat.id = c.patient_id
       WHERE p.id = @id AND c.doctor_id = @doctor_id`,
      { id, doctor_id: auth.id }
    );
    const prescription = presc.recordset[0];
    if (!prescription) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (prescription.status !== 'approved') {
      return NextResponse.json({ error: 'Prescription must be approved to download PDF' }, { status: 400 });
    }

    const meds = await query(
      `SELECT name, dosage, frequency, duration, instructions FROM Medications WHERE prescription_id = @id`,
      { id }
    );
    const inv = await query(
      `SELECT test_name FROM Investigations WHERE prescription_id = @id`,
      { id }
    );
    const user = await query(`SELECT name FROM Users WHERE id = @id`, { id: auth.id });
    const doctorName = user.recordset[0]?.name || 'Doctor';

    const structured = JSON.parse(prescription.structured_json || '{}');
    const presentingComplaint = structured.presenting_complaint || null;
    const diagnosisBlock = structured.diagnosis || {};
    const adviceBlock = structured.advice_and_followup || {};
    const pdfData = {
      hospitalName: 'MediScript AI',
      date: prescription.approved_at ? new Date(prescription.approved_at).toISOString().slice(0, 10) : undefined,
      rxId: String(prescription.id),
      patientDetails: {
        name: prescription.patient_name || '',
        age: prescription.age ?? '',
        gender: prescription.gender ?? '',
        mrn: `MRN${String(prescription.patient_id).padStart(6, '0')}`,
      },
      presentingComplaint,
      diagnosis: [diagnosisBlock.primary, ...(diagnosisBlock.differential || [])].filter(Boolean),
      medications: meds.recordset || [],
      investigations: (inv.recordset || []).map((r) => r.test_name),
      advice: adviceBlock.advice || [],
      followUp: adviceBlock.follow_up || '',
      doctorName,
    };

    const pdfBuffer = await buildPrescriptionPDF(pdfData);
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition === 'inline' ? 'inline' : 'attachment'}; filename="prescription-${id}.pdf"`,
      },
    });
  } catch (err) {
    console.error('PDF error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
