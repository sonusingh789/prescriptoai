'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

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
    const matchStatus =
      statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading…
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-1 text-2xl font-bold text-slate-900">Conversations</h2>
        <p className="mb-8 text-slate-500">View and manage all consultation records</p>

        {user?.role !== 'doctor' ? (
          <p className="text-slate-600">Only doctors can view conversations.</p>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by patient name, MRN, or diagnosis..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
              </select>
            </div>

            <p className="mb-4 text-sm text-slate-600">
              Showing {filtered.length} of {conversations.length} consultations
            </p>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Patient Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">MRN</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Diagnosis</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking text-slate-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No consultations match your filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
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
                            {c.status === 'approved' ? 'Approved' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/conversations/${c.id}`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
