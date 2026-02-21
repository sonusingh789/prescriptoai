'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

const statusColors = {
  approved: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  draft: 'bg-amber-100 text-amber-800 ring-amber-200',
};

function StatCard({ title, value, icon, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? '-' : d.toISOString().slice(0, 10);
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

  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = conversations.filter((c) => c.date && String(c.date).slice(0, 10) === today).length;
    const draftCount = conversations.filter((c) => c.status === 'draft').length;
    const approvedCount = conversations.filter((c) => c.status === 'approved').length;
    return { todayCount, draftCount, approvedCount };
  }, [conversations]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  const isDoctor = user?.role === 'doctor';
  const recent = conversations.slice(0, 10);

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 text-white shadow-lg">
          <div className="px-5 py-6 sm:px-8 sm:py-9">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.22em] text-indigo-100 sm:text-xs">Dashboard</p>
                <h1 className="text-3xl font-semibold leading-snug sm:text-4xl">Welcome back, {user.name || 'Doctor'}</h1>
                <p className="text-sm text-indigo-50 sm:text-base">
                  Quick snapshot of your consultations, prescriptions, and patients. Optimized for phone and desktop.
                </p>
              </div>
              {isDoctor && (
                <div className="flex w-full flex-wrap gap-3 md:w-auto md:justify-end">
                  <Link
                    href="/record"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-md shadow-indigo-900/10 transition hover:-translate-y-0.5 hover:shadow-lg md:flex-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v12m6-6H6" />
                    </svg>
                    New Consultation
                  </Link>
                  <Link
                    href="/dashboard/patients"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 md:flex-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857M7 10a4 4 0 118 0 4 4 0 01-8 0z" />
                    </svg>
                    Patients
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {isDoctor ? (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Consultations Today"
                value={metrics.todayCount}
                accent="bg-white text-indigo-600 ring-1 ring-white/50"
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
              <StatCard
                title="Draft Prescriptions"
                value={metrics.draftCount}
                accent="bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                title="Approved Prescriptions"
                value={metrics.approvedCount}
                accent="bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              />
              <StatCard
                title="Total Patients"
                value={patientCount}
                accent="bg-sky-50 text-sky-600 ring-1 ring-sky-200"
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857M7 10a4 4 0 118 0 4 4 0 01-8 0z" />
                  </svg>
                }
              />
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
                  <p className="text-sm text-slate-500">Latest consultations and prescriptions</p>
                </div>
                <Link
                  href="/conversations"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View all conversations
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {recent.length === 0 ? (
                <div className="px-6 py-10 text-center text-slate-500">
                  No consultations yet. Start by recording a consultation.
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="grid gap-3 px-4 py-4 md:hidden">
                    {recent.map((c) => (
                      <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
                            <p className="text-lg font-semibold text-slate-900">{c.patient_name}</p>
                            {(c.age != null || c.gender) && (
                              <p className="text-xs text-slate-500">
                                {[c.age && `${c.age}y`, c.gender].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                              statusColors[c.status] || statusColors.draft
                            }`}
                          >
                            {c.status === 'approved' ? 'Approved' : 'Draft'}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">MRN</p>
                            <p className="font-medium">{c.mrn || '-'}</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Date</p>
                            <p className="font-medium">{formatDate(c.date)}</p>
                          </div>
                          <div className="col-span-2 rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Diagnosis</p>
                            <p className="font-medium">{c.diagnosis || '-'}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs uppercase tracking-wide text-slate-500">Tap to view</span>
                          <Link
                            href={`/conversations/${c.id}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            View details
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
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
                        {recent.map((c) => (
                          <tr key={c.id} className="border-b border-slate-100 transition hover:bg-slate-50/50">
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-800">{c.patient_name}</p>
                              {(c.age != null || c.gender) && (
                                <p className="text-xs text-slate-500">
                                  {[c.age && `${c.age}y`, c.gender].filter(Boolean).join(', ')}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{c.mrn}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{formatDate(c.date)}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{c.diagnosis || '-'}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                                  statusColors[c.status] || statusColors.draft
                                }`}
                              >
                                {c.status === 'approved' ? 'Approved' : 'Draft'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Link href={`/conversations/${c.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
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
