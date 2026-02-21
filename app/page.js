import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <span className="text-lg font-semibold text-slate-800">PrescriptoAI</span>
          <div className="flex gap-4">
            <Link href="/login" className="text-slate-600 hover:text-slate-900">Sign in</Link>
            <Link href="/signup" className="text-emerald-600 hover:underline">Sign up</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4 text-3xl font-bold text-slate-800">AI-powered prescription generation</h1>
        <p className="mb-8 text-slate-600">Record consultations, get structured prescriptions, and download PDFs.</p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700"
        >
          Go to dashboard
        </Link>
      </main>
    </div>
  );
}
