import OpenAI from 'openai';
import config from '@/lib/config';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

const PRESCRIPTION_SYSTEM_PROMPT = `You are a clinical documentation AI assistant.
Extract only what is explicitly stated in the transcript.
Do NOT infer, guess, or speculate about diagnoses, causes, or treatments beyond what is said.
If a field is missing or uncertain, leave it empty or use "uncertain"; never invent data.
Return only valid JSON in the defined structure.`;

const PRESCRIPTION_JSON_SCHEMA = `Return JSON with this exact structure (no extra fields):
{
  "patient_details": {},
  "presenting_complaints": [],
  "history": {},
  "vitals": {},
  "examination_findings": [],
  "diagnosis": [],
  "medications": [],
  "investigations_advised": [],
  "advice": [],
  "follow_up": "",
  "summary": ""
}

Each medications item: { "name": "", "dosage": "", "frequency": "", "duration": "", "instructions": "" }
investigations_advised: array of strings (test names).`;

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
  const userContent = `Transcript of doctor-patient conversation:\n\n${transcript}\n\n${PRESCRIPTION_JSON_SCHEMA}`;
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: PRESCRIPTION_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty LLM response');
  return JSON.parse(raw);
}

export async function summarizeTranscript(transcript) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a medical scribe. Summarize the patient complaints in plain English, 1-2 sentences, <= 220 characters, no doctor instructions.',
      },
      { role: 'user', content: transcript },
    ],
    temperature: 0.2,
  });
  const text = completion.choices[0]?.message?.content?.trim();
  return text || '';
}
