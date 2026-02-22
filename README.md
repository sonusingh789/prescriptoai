# PrescriptoAI (MediScript AI)

PrescriptoAI is a Next.js app for doctors to record patient consultations, generate a structured prescription using OpenAI, review/edit it, and download a clean PDF.

## Features

- Doctor authentication (JWT cookie)
- Patient management (name, age, gender, phone)
- Record audio in the browser and upload it for transcription
- Structured extraction (presenting complaint, diagnosis, medications, investigations, advice/follow-up)
- Prescription review workflow (draft → approved)
- PDF download for approved prescriptions

## Tech stack

- Next.js App Router (`app/`)
- SQL Server via `mssql`
- OpenAI (`whisper-1` transcription + chat completion for structuring)
- PDF generation via `pdf-lib`
- Tailwind CSS

## Quickstart

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env.local` file in the project root:

```bash
JWT_SECRET="replace-with-a-long-random-secret-min-32-chars"
OPENAI_API_KEY="sk-..."
```

Notes:
- Keep `.env.local` private (do not commit it).
- Rotate keys immediately if you accidentally shared them.

### 3) Configure the database connection (SQL Server)

Database connection is configured in `lib/db.js`. Update these values to match your SQL Server setup:

- `server` (machine name / instance, e.g. `localhost\\SQLEXPRESS`)
- `user` / `password`
- `database`

The app expects SQL Server authentication to be enabled (not Windows-only auth).

### 4) Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## How it works (workflow)

1. Sign up / sign in as a **doctor**.
2. Add a patient in **Dashboard → Patients**.
3. Go to **Record**, select a patient, and record audio.
4. The backend:
   - Transcribes audio with OpenAI Whisper
   - Extracts a structured prescription JSON with OpenAI Chat Completions
   - Stores a draft prescription + medications + investigations in SQL Server
5. Open the conversation, review/edit, then **Approve**.
6. Download the PDF (only available once approved).

## API routes (high level)

Auth:
- `POST /api/auth/signup` – create user + set auth cookie
- `POST /api/auth/login` – sign in + set auth cookie
- `POST /api/auth/logout` – clear auth cookie
- `GET /api/auth/me` – return current user

Patients:
- `GET /api/patients` – list patients
- `POST /api/patients` – create patient

Conversations & prescriptions:
- `POST /api/record` – upload audio + create conversation + create draft prescription
- `GET /api/conversations` – list conversations for current doctor
- `GET /api/conversations/:id` – conversation details + prescription + meds/investigations
- `POST /api/conversations/:id` – update meds/investigations for a **draft** prescription
- `PATCH /api/prescriptions/:id` – approve or update prescription items (draft-only)
- `GET /api/prescriptions/:id/pdf` – generate PDF for an **approved** prescription

## Data model (tables used)

The app reads/writes these SQL Server tables:

- `Users` (signup/login)
- `Patients`
- `Conversations`
- `Prescriptions`
- `Medications`
- `Investigations`
- `AuditLogs` (records approvals)

If you don’t have a schema yet, create tables/columns to match what the API queries in `app/api/**/route.js`.

## Configuration notes

- Auth uses an HTTP-only cookie named `prescriptoai_token` with a 7-day JWT.
- OpenAI configuration lives in `lib/config.js` and reads `OPENAI_API_KEY`.
- Database configuration is currently hardcoded in `lib/db.js` (recommended: move to environment variables for production).

## Troubleshooting

- **Signup says database login failed**
  - Enable SQL Server authentication, verify user/password, and update `lib/db.js`.
- **Record fails**
  - Ensure `OPENAI_API_KEY` is set and the server can reach OpenAI.
  - Browser recording requires microphone permissions (and generally HTTPS in production).
- **PDF download says “must be approved”**
  - Approve the prescription first; the PDF route rejects drafts by design.

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run start` – run production server
- `npm run lint` – run ESLint
