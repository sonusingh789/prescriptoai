import { PDFDocument, StandardFonts } from 'pdf-lib';

const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const MARGIN = 50;
const LINE_HEIGHT = 14;
const TITLE_SIZE = 18;
const SUBTITLE_SIZE = 10;
const HEADING_SIZE = 12;
const BODY_SIZE = 10;

export async function buildPrescriptionPDF(prescriptionData) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  const helvetica = await doc.embedStandardFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

  let y = A4_HEIGHT - MARGIN;

  const {
    hospitalName = 'MediScript AI',
    patientDetails = {},
    diagnosis = [],
    medications = [],
    investigations = [],
    advice = [],
    followUp = '',
    doctorName = 'Doctor',
  } = prescriptionData;

  // Title (centered)
  const titleWidth = helveticaBold.widthOfTextAtSize(hospitalName, TITLE_SIZE);
  page.drawText(hospitalName, {
    x: (A4_WIDTH - titleWidth) / 2,
    y,
    size: TITLE_SIZE,
    font: helveticaBold,
  });
  y -= LINE_HEIGHT * 1.2;

  page.drawText('Prescription', {
    x: (A4_WIDTH - helvetica.widthOfTextAtSize('Prescription', SUBTITLE_SIZE)) / 2,
    y,
    size: SUBTITLE_SIZE,
    font: helvetica,
  });
  y -= LINE_HEIGHT * 2;

  // Patient Details
  page.drawText('Patient Details', { x: MARGIN, y, size: HEADING_SIZE, font: helveticaBold });
  y -= LINE_HEIGHT;
  Object.entries(patientDetails).forEach(([k, v]) => {
    if (v != null && v !== '') {
      page.drawText(`${String(k)}: ${String(v)}`, { x: MARGIN, y, size: BODY_SIZE, font: helvetica });
      y -= LINE_HEIGHT * 0.8;
    }
  });
  y -= LINE_HEIGHT * 0.5;

  function drawSection(title, items, format = (x) => x) {
    if (!items || items.length === 0) return;
    page.drawText(title, { x: MARGIN, y, size: HEADING_SIZE, font: helveticaBold });
    y -= LINE_HEIGHT;
    items.forEach((item) => {
      const text = `• ${format(item)}`;
      page.drawText(text.slice(0, 90), { x: MARGIN, y, size: BODY_SIZE, font: helvetica });
      y -= LINE_HEIGHT * 0.8;
    });
    y -= LINE_HEIGHT * 0.5;
  }

  drawSection('Diagnosis', diagnosis, (d) => (typeof d === 'string' ? d : d.name || d));

  // Medications table
  if (medications && medications.length > 0) {
    page.drawText('Medications', { x: MARGIN, y, size: HEADING_SIZE, font: helveticaBold });
    y -= LINE_HEIGHT;
    const colX = { name: 50, dosage: 180, frequency: 280, duration: 380, instructions: 450 };
    page.drawText('Name', { x: colX.name, y, size: BODY_SIZE, font: helveticaBold });
    page.drawText('Dosage', { x: colX.dosage, y, size: BODY_SIZE, font: helveticaBold });
    page.drawText('Frequency', { x: colX.frequency, y, size: BODY_SIZE, font: helveticaBold });
    page.drawText('Duration', { x: colX.duration, y, size: BODY_SIZE, font: helveticaBold });
    page.drawText('Instructions', { x: colX.instructions, y, size: BODY_SIZE, font: helveticaBold });
    y -= LINE_HEIGHT * 0.8;
    medications.forEach((m) => {
      page.drawText(String(m.name || '').slice(0, 18), { x: colX.name, y, size: BODY_SIZE, font: helvetica });
      page.drawText(String(m.dosage || '').slice(0, 12), { x: colX.dosage, y, size: BODY_SIZE, font: helvetica });
      page.drawText(String(m.frequency || '').slice(0, 12), { x: colX.frequency, y, size: BODY_SIZE, font: helvetica });
      page.drawText(String(m.duration || '').slice(0, 12), { x: colX.duration, y, size: BODY_SIZE, font: helvetica });
      page.drawText(String(m.instructions || '').slice(0, 20), { x: colX.instructions, y, size: BODY_SIZE, font: helvetica });
      y -= LINE_HEIGHT * 0.9;
    });
    y -= LINE_HEIGHT * 0.5;
  }

  drawSection('Investigations Advised', investigations, (t) => (typeof t === 'string' ? t : t.test_name || t));
  drawSection('Advice', advice, (a) => (typeof a === 'string' ? a : a));

  if (followUp) {
    page.drawText('Follow-up', { x: MARGIN, y, size: HEADING_SIZE, font: helveticaBold });
    y -= LINE_HEIGHT;
    page.drawText(followUp.slice(0, 80), { x: MARGIN, y, size: BODY_SIZE, font: helvetica });
    y -= LINE_HEIGHT * 1.5;
  }

  y -= LINE_HEIGHT;
  page.drawText('Doctor signature: _________________________', { x: MARGIN, y, size: BODY_SIZE, font: helvetica });
  y -= LINE_HEIGHT;
  page.drawText(doctorName, { x: MARGIN, y, size: BODY_SIZE, font: helvetica });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
