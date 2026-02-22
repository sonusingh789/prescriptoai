'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
];

const statusColors = {
  approved: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  draft: 'bg-amber-100 text-amber-800 ring-amber-200',
};

export default function ConversationsListPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
          const res = await fetch('/api/conversations');
          if (res.ok) {
            const list = await res.json();
            setConversations(Array.isArray(list) ? list : []);
          }
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = conversations.filter((c) => {
    const matchSearch =
      !search ||
      c.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.mrn?.toLowerCase().includes(search.toLowerCase()) ||
      c.diagnosis?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const approvedCount = conversations.filter((c) => c.status === 'approved').length;
  const draftCount = conversations.filter((c) => c.status === 'draft').length;

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading...
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-indigo-50 p-6 ring-1 ring-slate-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Consultations</p>
              <h2 className="text-3xl font-semibold text-slate-900">Conversations</h2>
              <p className="text-sm text-slate-600">Search, filter, and open patient conversations.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-white/80 px-4 py-3 text-center shadow-sm ring-1 ring-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                <p className="text-xl font-semibold text-slate-900">{conversations.length}</p>
              </div>
              <div className="rounded-xl bg-white/80 px-4 py-3 text-center shadow-sm ring-1 ring-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500">Approved</p>
                <p className="text-xl font-semibold text-emerald-700">{approvedCount}</p>
              </div>
              <div className="rounded-xl bg-white/80 px-4 py-3 text-center shadow-sm ring-1 ring-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500">Draft</p>
                <p className="text-xl font-semibold text-amber-700">{draftCount}</p>
              </div>
            </div>
          </div>
        </div>

        {user?.role !== 'doctor' ? (
          <p className="text-slate-600">Only doctors can view conversations.</p>
        ) : (
          <>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xl">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by patient name, MRN, or diagnosis"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                      statusFilter === option.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <p>
                Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of{' '}
                <span className="font-semibold text-slate-900">{conversations.length}</span> consultations
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
                No consultations match your filters.
              </div>
            ) : (
              <>
                <div className="md:hidden">
                  <div className="grid gap-4">
                    {filtered.map((c) => (
                      <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-slate-500">Patient</p>
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
                            <p className="text-xs text-slate-500">MRN</p>
                            <p className="font-medium">{c.mrn || '-'}</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-xs text-slate-500">Date</p>
                            <p className="font-medium">{c.date ? new Date(c.date).toISOString().slice(0, 10) : '-'}</p>
                          </div>
                          <div className="col-span-2 rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-xs text-slate-500">Diagnosis</p>
                            <p className="font-medium">{c.diagnosis || '-'}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-xs uppercase tracking-wide text-slate-500">Tap to view</div>
                          <Link
                            href={`/conversations/${c.id}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                          >
                            View details
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">MRN</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Diagnosis</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => (
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
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {c.date ? new Date(c.date).toISOString().slice(0, 10) : '-'}
                          </td>
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
                            <Link
                              href={`/conversations/${c.id}`}
                              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
