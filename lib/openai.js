import OpenAI from 'openai';
import config from '@/lib/config';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

const PRESCRIPTION_SYSTEM_PROMPT = `You are a clinical documentation AI assistant.
Return only valid JSON in the defined structure.
Do not hallucinate.
Mark uncertain fields as 'uncertain'.`;

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
  "follow_up": ""
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
