import { z } from 'zod';

const presentingComplaintSchema = z.object({
  summary: z.string(),
  duration: z.string().nullable(),
  associated_symptoms: z.array(z.string()),
});

const diagnosisSchema = z.object({
  primary: z.string(),
  differential: z.array(z.string()),
});

const medicationSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
  instructions: z.string(),
});

const investigationSchema = z.object({
  test_name: z.string(),
  reason: z.string(),
});

const adviceAndFollowupSchema = z.object({
  advice: z.array(z.string()),
  follow_up: z.string(),
});

export const structuredPrescriptionSchema = z.object({
  presenting_complaint: presentingComplaintSchema.nullable(),
  diagnosis: diagnosisSchema.nullable(),
  medications: z.array(medicationSchema).nullable(),
  investigations: z.array(investigationSchema).nullable(),
  advice_and_followup: adviceAndFollowupSchema.nullable(),
});

export function validateStructuredPrescription(body) {
  return structuredPrescriptionSchema.safeParse(body);
}
