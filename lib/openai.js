import OpenAI from 'openai';
import config from '@/lib/config';
import { validateStructuredPrescription } from '@/utils/validators';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

const PRESCRIPTION_SYSTEM_PROMPT = `You are a clinical medical documentation assistant.

Analyze a doctor-patient conversation transcript and extract structured prescription information.

STRICT RULES:
- Do NOT hallucinate.
- Only extract explicitly mentioned information.
- If a section is missing, return null.
- Only consider doctor's final decisions for diagnosis, medications, investigations and advice.
- Patient statements should only affect Presenting Complaint.
- Ignore casual conversation.
- Normalize medical frequency terms (BD -> Twice daily).
- Normalize duration formats (5d -> 5 days).

Return ONLY valid JSON in the exact format provided by the user message.`;

const PRESCRIPTION_RESPONSE_FORMAT = `Return ONLY valid JSON in this exact format:
{
  "presenting_complaint": {
    "summary": "",
    "duration": "",
    "associated_symptoms": []
  },
  "diagnosis": {
    "primary": "",
    "differential": []
  },
  "medications": [
    {
      "name": "",
      "dosage": "",
      "frequency": "",
      "duration": "",
      "instructions": ""
    }
  ],
  "investigations": [
    {
      "test_name": "",
      "reason": ""
    }
  ],
  "advice_and_followup": {
    "advice": [],
    "follow_up": ""
  }
}`;

function cleanString(value) {
  if (value == null) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function cleanStringArray(value) {
  if (value == null) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr.map(cleanString).filter(Boolean);
}

function normalizeFrequency(value) {
  const v = cleanString(value);
  const upper = v.toUpperCase();
  const map = {
    OD: 'Once daily',
    BD: 'Twice daily',
    TDS: 'Three times daily',
    QID: 'Four times daily',
    HS: 'At bedtime',
    SOS: 'As needed',
  };
  return map[upper] || v;
}

function normalizeDuration(value) {
  const v = cleanString(value);
  if (!v) return '';
  const m = v.match(/^(\d+)\s*([dDwWmMyY])$/);
  if (!m) return v;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const labels = { d: 'day', w: 'week', m: 'month', y: 'year' };
  const label = labels[unit];
  if (!label) return v;
  return `${n} ${label}${n === 1 ? '' : 's'}`;
}

function normalizePrescription(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};

  let presenting = input.presenting_complaint;
  if (presenting && typeof presenting === 'object') {
    presenting = {
      summary: cleanString(presenting.summary),
      duration: cleanString(presenting.duration) || null,
      associated_symptoms: cleanStringArray(presenting.associated_symptoms),
    };
    if (!presenting.summary && !presenting.duration && presenting.associated_symptoms.length === 0) presenting = null;
  } else if (presenting !== null) {
    presenting = null;
  }

  let diagnosis = input.diagnosis;
  if (diagnosis && typeof diagnosis === 'object') {
    diagnosis = {
      primary: cleanString(diagnosis.primary),
      differential: cleanStringArray(diagnosis.differential),
    };
    if (!diagnosis.primary && diagnosis.differential.length === 0) diagnosis = null;
  } else if (diagnosis !== null) {
    diagnosis = null;
  }

  let medications = input.medications;
  if (Array.isArray(medications)) {
    medications = medications
      .map((m) => (m && typeof m === 'object' ? m : {}))
      .map((m) => ({
        name: cleanString(m.name),
        dosage: cleanString(m.dosage),
        frequency: normalizeFrequency(m.frequency),
        duration: normalizeDuration(m.duration),
        instructions: cleanString(m.instructions),
      }))
      .filter((m) => m.name || m.dosage || m.frequency || m.duration || m.instructions);
    if (medications.length === 0) medications = null;
  } else if (medications !== null) {
    medications = null;
  }

  let investigations = input.investigations;
  if (Array.isArray(investigations)) {
    investigations = investigations
      .map((t) => (t && typeof t === 'object' ? t : {}))
      .map((t) => ({
        test_name: cleanString(t.test_name),
        reason: cleanString(t.reason),
      }))
      .filter((t) => t.test_name || t.reason);
    if (investigations.length === 0) investigations = null;
  } else if (investigations !== null) {
    investigations = null;
  }

  let advice = input.advice_and_followup;
  if (advice && typeof advice === 'object') {
    advice = {
      advice: cleanStringArray(advice.advice),
      follow_up: cleanString(advice.follow_up),
    };
    if (advice.advice.length === 0 && !advice.follow_up) advice = null;
  } else if (advice !== null) {
    advice = null;
  }

  return {
    presenting_complaint: presenting,
    diagnosis,
    medications,
    investigations,
    advice_and_followup: advice,
  };
}

export async function transcribeWithWhisper(audioBuffer, filename = 'audio.webm') {
  const file = new File([audioBuffer], filename, { type: 'audio/webm' });
  const transcript = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'text',
  });
  return typeof transcript === 'string' ? transcript : transcript.text;
}

export async function getStructuredPrescriptionFromTranscript(transcript) {
  const userContent = `Analyze the following transcript and extract structured prescription details.\n\nTranscript:\n\"\"\"\n${transcript}\n\"\"\"\n\n${PRESCRIPTION_RESPONSE_FORMAT}`;
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: PRESCRIPTION_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty LLM response');
  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizePrescription(parsed);
    const validated = validateStructuredPrescription(normalized);
    if (!validated.success) {
      console.error('Structured prescription validation error:', validated.error.flatten());
      throw new Error('Structured prescription schema validation failed');
    }
    return validated.data;
  } catch (err) {
    console.error('LLM JSON parse/validate error:', err);
    throw new Error('Failed to parse structured prescription');
  }
}

export async function summarizeTranscript(transcript) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a medical scribe. Summarize only what the patient reports (symptoms and duration) in plain English, 1-2 sentences, <= 220 characters. No speculation about diagnosis or treatment.',
      },
      { role: 'user', content: transcript },
    ],
    temperature: 0.2,
  });
  const text = completion.choices[0]?.message?.content?.trim();
  return text || '';
}

