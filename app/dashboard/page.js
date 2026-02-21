'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

function CardIcon({ className, children }) {
  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${className}`}>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [patientCount, setPatientCount] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => {
        if (r.status === 401) {
          router.push('/login');
          return null;
        }
        return r.json();
      })
      .then(async (data) => {
        if (data) setUser(data.user);
        if (data?.user?.role === 'doctor') {
          const [convRes, patientsRes] = await Promise.all([
            fetch('/api/conversations'),
            fetch('/api/patients'),
          ]);
          if (convRes.ok) {
            const list = await convRes.json();
            setConversations(Array.isArray(list) ? list : []);
          }
          if (patientsRes.ok) {
            const patients = await patientsRes.json();
            setPatientCount(Array.isArray(patients) ? patients.length : 0);
          }
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading…
      </div>
    );
  }

  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const todayConversations = conversations.filter((c) => c.date && String(c.date).slice(0, 10) === today);
  const draftCount = conversations.filter((c) => c.status === 'draft').length;
  const approvedCount = conversations.filter((c) => c.status === 'approved').length;

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-1 text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="mb-8 text-slate-500">Welcome back, Doctor. Here&apos;s your overview.</p>

        {user?.role === 'doctor' ? (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Consultations Today</span>
                  <CardIcon className="bg-blue-100 text-blue-600">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </CardIcon>
                </div>
                <p className="text-2xl font-bold text-slate-900">{todayConversations.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Draft Prescriptions</span>
                  <CardIcon className="bg-amber-100 text-amber-600">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </CardIcon>
                </div>
                <p className="text-2xl font-bold text-slate-900">{draftCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Approved Prescriptions</span>
                  <CardIcon className="bg-emerald-100 text-emerald-600">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </CardIcon>
                </div>
                <p className="text-2xl font-bold text-slate-900">{approvedCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Total Patients</span>
                  <CardIcon className="bg-emerald-100 text-emerald-600">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </CardIcon>
                </div>
                <p className="text-2xl font-bold text-slate-900">{patientCount}</p>
              </div>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <h3 className="border-b border-slate-200 px-6 py-4 text-lg font-semibold text-slate-900">
                Recent Activity
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">MRN</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Diagnosis</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                          No consultations yet. Start by recording a consultation.
                        </td>
                      </tr>
                    ) : (
                      conversations.slice(0, 10).map((c) => (
                        <tr key={c.id} className="border-b border-slate-100">
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-800">{c.patient_name}</p>
                            {(c.age != null || c.gender) && (
                              <p className="text-xs text-slate-500">
                                {[c.age && `${c.age}y`, c.gender].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{c.mrn}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {c.date ? new Date(c.date).toISOString().slice(0, 10) : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{c.diagnosis || '—'}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                c.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/conversations/${c.id}`}
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <p className="text-slate-600">
            You do not have access to prescription recording. Only doctors can create prescriptions.
          </p>
        )}
      </div>
    </AppShell>
  );
}
