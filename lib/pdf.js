import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const A4_WIDTH = 595;
const A4_HEIGHT = 842;

const MARGIN_X = 48;
const MARGIN_TOP = 54;
const MARGIN_BOTTOM = 54;

const SIZES = {
  title: 24,
  headerMeta: 10,
  section: 13,
  body: 10,
  small: 9,
};

const COLORS = {
  primary: rgb(0, 0.35, 0.85),
  text: rgb(0.1, 0.1, 0.12),
  muted: rgb(0.35, 0.35, 0.38),
  rule: rgb(0.88, 0.9, 0.94),
  softBg: rgb(0.97, 0.98, 0.99),
  tableHeaderBg: rgb(0.97, 0.98, 1),
  tableBorder: rgb(0.89, 0.91, 0.94),
  rowAlt: rgb(0.985, 0.987, 0.99),
};

const LINE_HEIGHT = 14;
const SECTION_GAP = 14;
const PARAGRAPH_GAP = 12;
const SECTION_TOP_GAP = 10;
const FOOTER_RESERVED = 70;

function isBlank(value) {
  return value == null || String(value).trim() === '';
}

function dashIfBlank(value) {
  return isBlank(value) ? '—' : String(value);
}

function clampText(text, maxLen) {
  const s = String(text ?? '');
  return s.length > maxLen ? s.slice(0, Math.max(0, maxLen - 1)) + '…' : s;
}

function asList(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.filter((x) => !isBlank(x)).map(String);
  const s = String(value).trim();
  return s ? [s] : [];
}

function formatPresentingComplaint(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value !== 'object') return String(value);

  const summary = String(value.summary ?? '').trim();
  const duration = String(value.duration ?? '').trim();
  const symptoms = Array.isArray(value.associated_symptoms)
    ? value.associated_symptoms.map((s) => String(s ?? '').trim()).filter(Boolean)
    : [];

  const lines = [];
  const firstLine = [summary, duration ? `(${duration})` : ''].filter(Boolean).join(' ');
  if (firstLine) lines.push(firstLine);
  if (symptoms.length > 0) lines.push(`Associated symptoms: ${symptoms.join(', ')}`);
  return lines.join('\n');
}

function fitTextToWidth(text, maxWidth, font, size) {
  const s = String(text ?? '');
  if (font.widthOfTextAtSize(s, size) <= maxWidth) return { text: s, size };

  for (let cur = size - 1; cur >= 8; cur--) {
    if (font.widthOfTextAtSize(s, cur) <= maxWidth) return { text: s, size: cur };
  }

  let out = s;
  while (out.length > 0 && font.widthOfTextAtSize(out + '…', 8) > maxWidth) out = out.slice(0, -1);
  return { text: out ? out + '…' : '', size: 8 };
}

function wrapLines(text, maxWidth, font, size) {
  const paragraphs = String(text ?? '').split(/\r?\n/);
  const allLines = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      allLines.push('');
      continue;
    }

    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) {
        line = test;
        continue;
      }

      if (line) allLines.push(line);
      line = w;

      while (font.widthOfTextAtSize(line, size) > maxWidth && line.length > 1) {
        let cut = line.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(line.slice(0, cut) + '…', size) > maxWidth) cut--;
        allLines.push(line.slice(0, cut) + '…');
        line = line.slice(cut);
      }
    }
    if (line) allLines.push(line);
  }

  return allLines;
}

export async function buildPrescriptionPDF(prescriptionData) {
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedStandardFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);
  const timesItalic = await doc.embedStandardFont(StandardFonts.TimesRomanItalic);

  let page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  let y = A4_HEIGHT - MARGIN_TOP;

  const {
    hospitalName = 'PrescriptoAI',
    date = new Date().toISOString().slice(0, 10),
    rxId = '',
    patientDetails = {},
    presentingComplaint = null,
    diagnosis = [],
    medications = [],
    investigations = [],
    advice = [],
    followUp = '',
    doctorName = 'Doctor',
    doctorTitle = '',
    doctorLicense = '',
  } = prescriptionData || {};

  function drawRule(yPos) {
    page.drawRectangle({
      x: MARGIN_X,
      y: yPos,
      width: A4_WIDTH - MARGIN_X * 2,
      height: 1,
      color: COLORS.rule,
    });
  }

  function drawHeader(isContinuedPage = false) {
    const leftX = MARGIN_X;
    const rightX = A4_WIDTH - MARGIN_X;

    const title = fitTextToWidth(hospitalName, 240, helveticaBold, SIZES.title);
    page.drawText(title.text, { x: leftX, y, size: title.size, font: helveticaBold, color: COLORS.primary });

    const meta = `${date}` + (rxId ? `  •  Rx ID: ${rxId}` : '');
    const metaFit = fitTextToWidth(meta, 240, helvetica, SIZES.headerMeta);
    const metaW = helvetica.widthOfTextAtSize(metaFit.text, metaFit.size);
    page.drawText(metaFit.text, { x: rightX - metaW, y: y + 6, size: metaFit.size, font: helvetica, color: COLORS.muted });

    if (!isContinuedPage) {
      const centerMax = 220;
      const docFit = fitTextToWidth(doctorName, centerMax, helveticaBold, 14);
      const docW = helveticaBold.widthOfTextAtSize(docFit.text, docFit.size);
      page.drawText(docFit.text, { x: (A4_WIDTH - docW) / 2, y: y + 5, size: docFit.size, font: helveticaBold, color: COLORS.text });
    }

    y -= 18;
    page.drawRectangle({ x: MARGIN_X, y: y, width: A4_WIDTH - MARGIN_X * 2, height: 2, color: COLORS.primary });
    y -= 22;
  }

  function ensureSpace(minHeight) {
    if (y - minHeight >= MARGIN_BOTTOM + FOOTER_RESERVED) return;
    page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    y = A4_HEIGHT - MARGIN_TOP;
    drawHeader(true);
  }

  function drawSectionTitle(title) {
    ensureSpace(SECTION_TOP_GAP + SIZES.section + SECTION_GAP);
    y -= SECTION_TOP_GAP;
    page.drawText(String(title), { x: MARGIN_X, y, size: SIZES.section, font: helveticaBold, color: COLORS.text });
    y -= SECTION_GAP;
  }

  function drawKeyValues(leftPairs, rightPairs) {
    const leftX = MARGIN_X;
    const rightX = Math.floor(A4_WIDTH / 2) + 10;
    const labelGap = 6;
    const labelW = 62;

    const rows = Math.max(leftPairs.length, rightPairs.length);
    ensureSpace(rows * LINE_HEIGHT + 6);

    for (let i = 0; i < rows; i++) {
      const rowY = y - i * LINE_HEIGHT;
      const l = leftPairs[i] || ['', ''];
      const r = rightPairs[i] || ['', ''];

      page.drawText(`${l[0]}:`, { x: leftX, y: rowY, size: SIZES.body, font: helveticaBold, color: COLORS.text });
      page.drawText(dashIfBlank(l[1]), { x: leftX + labelW + labelGap, y: rowY, size: SIZES.body, font: helvetica, color: COLORS.text });

      page.drawText(`${r[0]}:`, { x: rightX, y: rowY, size: SIZES.body, font: helveticaBold, color: COLORS.text });
      page.drawText(dashIfBlank(r[1]), { x: rightX + labelW + labelGap, y: rowY, size: SIZES.body, font: helvetica, color: COLORS.text });
    }

    y -= rows * LINE_HEIGHT + PARAGRAPH_GAP;
  }

  function drawParagraph(text, maxWidth = A4_WIDTH - MARGIN_X * 2) {
    const lines = wrapLines(text, maxWidth, helvetica, SIZES.body);
    ensureSpace(lines.length * LINE_HEIGHT + PARAGRAPH_GAP);
    for (const line of lines) {
      page.drawText(line, { x: MARGIN_X, y, size: SIZES.body, font: helvetica, color: COLORS.text });
      y -= LINE_HEIGHT;
    }
    y -= PARAGRAPH_GAP;
  }

  function drawBullets(items, maxWidth = A4_WIDTH - MARGIN_X * 2) {
    const list = asList(items);
    const bullet = '•';
    const bulletIndent = 14;

    if (list.length === 0) {
      drawParagraph('—', maxWidth);
      return;
    }

    for (const item of list) {
      const lines = wrapLines(String(item), maxWidth - bulletIndent, helvetica, SIZES.body);
      ensureSpace(lines.length * LINE_HEIGHT + 2);

      page.drawText(bullet, { x: MARGIN_X + 2, y, size: SIZES.body, font: helveticaBold, color: COLORS.text });
      page.drawText(lines[0], { x: MARGIN_X + bulletIndent, y, size: SIZES.body, font: helvetica, color: COLORS.text });
      y -= LINE_HEIGHT;

      for (let i = 1; i < lines.length; i++) {
        page.drawText(lines[i], { x: MARGIN_X + bulletIndent, y, size: SIZES.body, font: helvetica, color: COLORS.text });
        y -= LINE_HEIGHT;
      }
      y -= 2;
    }

    y -= PARAGRAPH_GAP;
  }

  function drawDiagnosisBox(text) {
    const boxX = MARGIN_X;
    const boxW = A4_WIDTH - MARGIN_X * 2;
    const barW = 5;
    const paddingX = 12;
    const paddingY = 10;
    const contentMaxW = boxW - barW - paddingX * 2;

    const lines = wrapLines(text, contentMaxW, helvetica, SIZES.body);
    const boxH = paddingY * 2 + lines.length * LINE_HEIGHT;

    ensureSpace(boxH + 10);

    page.drawRectangle({ x: boxX, y: y - boxH, width: boxW, height: boxH, color: COLORS.softBg });
    page.drawRectangle({ x: boxX, y: y - boxH, width: barW, height: boxH, color: COLORS.primary });

    let ty = y - paddingY - SIZES.body;
    for (const line of lines) {
      page.drawText(line, { x: boxX + barW + paddingX, y: ty, size: SIZES.body, font: helvetica, color: COLORS.text });
      ty -= LINE_HEIGHT;
    }

    y = y - boxH - PARAGRAPH_GAP;
  }

  function drawMedsTable(rows) {
    const tableX = MARGIN_X;
    const tableW = A4_WIDTH - MARGIN_X * 2;
    const colDosage = 90;
    const colFreq = 90;
    const colDur = 90;
    const colMedicine = Math.max(160, tableW - (colDosage + colFreq + colDur));
    const cols = [
      { key: 'name', label: 'Medicine', w: colMedicine },
      { key: 'dosage', label: 'Dosage', w: colDosage },
      { key: 'frequency', label: 'Frequency', w: colFreq },
      { key: 'duration', label: 'Duration', w: colDur },
    ];

    const headerH = 24;
    const rowH = 22;
    const borderW = 1;

    const data = Array.isArray(rows) && rows.length > 0 ? rows : [{ name: '—', dosage: '—', frequency: '—', duration: '—' }];
    const tableH = headerH + data.length * rowH;

    ensureSpace(tableH + 10);

    page.drawRectangle({ x: tableX, y: y - tableH, width: tableW, height: tableH, borderWidth: borderW, borderColor: COLORS.tableBorder });
    page.drawRectangle({ x: tableX, y: y - headerH, width: tableW, height: headerH, color: COLORS.tableHeaderBg });

    let cx = tableX + 10;
    for (const c of cols) {
      page.drawText(c.label, { x: cx, y: y - 16, size: SIZES.body, font: helveticaBold, color: COLORS.text });
      cx += c.w;
    }

    for (let r = 0; r < data.length; r++) {
      const rowYTop = y - headerH - r * rowH;
      const rowY = rowYTop - 16;
      if (r % 2 === 1) {
        page.drawRectangle({ x: tableX, y: rowYTop - rowH, width: tableW, height: rowH, color: COLORS.rowAlt });
      }

      page.drawRectangle({ x: tableX, y: rowYTop - rowH, width: tableW, height: 1, color: COLORS.tableBorder });

      const m = data[r] || {};
      const name = clampText(dashIfBlank(m.name), 44);
      const dosage = clampText(dashIfBlank(m.dosage), 18);
      const frequency = clampText(dashIfBlank(m.frequency), 18);
      const duration = clampText(dashIfBlank(m.duration), 18);

      let tx = tableX + 10;
      page.drawText(name, { x: tx, y: rowY, size: SIZES.body, font: helvetica, color: COLORS.text });
      tx += cols[0].w;
      page.drawText(dosage, { x: tx, y: rowY, size: SIZES.body, font: helvetica, color: COLORS.text });
      tx += cols[1].w;
      page.drawText(frequency, { x: tx, y: rowY, size: SIZES.body, font: helvetica, color: COLORS.text });
      tx += cols[2].w;
      page.drawText(duration, { x: tx, y: rowY, size: SIZES.body, font: helvetica, color: COLORS.text });
    }


    y -= tableH + PARAGRAPH_GAP + 6;
  }

  // Header
  drawHeader(false);

  // Patient Details
  drawSectionTitle('Patient Details');
  const pd = patientDetails || {};
  drawKeyValues(
    [
      ['Name', pd.name],
      ['Gender', pd.gender],
    ],
    [
      ['Age', pd.age],
      ['MRN', pd.mrn],
    ]
  );

  // Presenting Complaint
  drawSectionTitle('Presenting Complaint');
  drawDiagnosisBox(dashIfBlank(formatPresentingComplaint(presentingComplaint)));

  // Diagnosis
  drawSectionTitle('Diagnosis');
  const diagText = asList(diagnosis).join(', ');
  drawDiagnosisBox(dashIfBlank(diagText));

  // Medications
  drawSectionTitle('Rx  Medications');
  drawMedsTable(medications);

  // Investigations
  drawSectionTitle('Investigations');
  drawBullets(investigations);

  // Advice
  drawSectionTitle('Advice');
  const advText = asList(advice).join('; ');
  drawParagraph(dashIfBlank(advText));

  // Follow-up
  drawSectionTitle('Follow-up');
  drawParagraph(dashIfBlank(followUp));

  // Footer / signature
  const footerRuleY = MARGIN_BOTTOM - 6;
  drawRule(footerRuleY);

  const sigW = 170;
  const sigX = A4_WIDTH - MARGIN_X - sigW;
  const sigLineY = footerRuleY + 32;
  page.drawRectangle({ x: sigX, y: sigLineY, width: sigW, height: 1, color: COLORS.tableBorder });
  page.drawText('Dr.', { x: sigX + sigW - 34, y: sigLineY + 10, size: 18, font: timesItalic, color: COLORS.muted });
  page.drawText(doctorName, { x: sigX + 6, y: sigLineY - 14, size: SIZES.body, font: helveticaBold, color: COLORS.text });
  if (!isBlank(doctorTitle)) {
    page.drawText(String(doctorTitle), { x: sigX + 6, y: sigLineY - 28, size: SIZES.small, font: helvetica, color: COLORS.muted });
  }
  if (!isBlank(doctorLicense)) {
    page.drawText(`License: ${doctorLicense}`, { x: sigX + 6, y: sigLineY - 40, size: SIZES.small, font: helvetica, color: COLORS.muted });
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
