import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(1).max(150).trim(),
  email: z.string().email().max(150).trim().toLowerCase(),
  password: z.string().min(8).max(100),
  role: z.enum(['doctor', 'admin']),
});

const loginSchema = z.object({
  email: z.string().email().max(150).trim().toLowerCase(),
  password: z.string().min(1).max(100),
});

const recordSchema = z.object({
  patient_id: z.coerce.number().int().positive(),
});

const createPatientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150).trim(),
  age: z.preprocess((v) => (v === '' || v === undefined ? undefined : Number(v)), z.number().int().min(0).max(150).optional()),
  gender: z.enum(['male', 'female', 'other', '']).optional().transform((v) => (v === '' ? null : v)),
  phone: z.string().max(20).trim().optional().or(z.literal('')),
});

export function validateSignup(body) {
  return signupSchema.safeParse(body);
}

export function validateLogin(body) {
  return loginSchema.safeParse(body);
}

export function validateRecordBody(body) {
  return recordSchema.safeParse(body);
}

export function validateCreatePatient(body) {
  return createPatientSchema.safeParse(body);
}
