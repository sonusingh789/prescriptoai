'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';

export default function PatientsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', gender: '', phone: '' });
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');

  function loadPatients() {
    setLoadingList(true);
    fetch('/api/patients')
      .then((r) => {
        if (r.status === 401) {
          router.push('/login');
          return null;
        }
        if (!r.ok) throw new Error('Failed to load patients');
        return r.json();
      })
      .then((data) => {
        if (data) setPatients(Array.isArray(data) ? data : []);
      })
      .catch(() => setPatients([]))
      .finally(() => setLoadingList(false));
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => {
        if (r.status === 401) {
          router.push('/login');
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setUser(data.user);
        if (data?.user?.role === 'doctor') loadPatients();
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setSuccess('');
    const payload = {
      name: form.name.trim(),
      age: form.age === '' ? undefined : Number(form.age),
      gender: form.gender || undefined,
      phone: form.phone.trim() || undefined,
    };
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSubmitError(data.error || data.details?.fieldErrors?.name?.[0] || 'Failed to add patient');
      return;
    }
    setForm({ name: '', age: '', gender: '', phone: '' });
    setSuccess(`${data.name || 'Patient'} added successfully.`);
    loadPatients();
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading...
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-5xl px-2 sm:px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-slate-900">Patients</h2>
          <p className="text-sm text-slate-500">Add and manage patients for consultations.</p>
        </div>

        {user?.role !== 'doctor' ? (
          <p className="text-slate-600">Only doctors can manage patients.</p>
        ) : (
          <>
            <section className="mb-10 rounded-2xl border  border-slate-200 bg-gradient-to-r from-sky-50 via-white to-indigo-50 p-6 ring-1 ring-slate-100 p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-800">Add patient</h3>
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                    Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label htmlFor="age" className="mb-1 block text-sm font-medium text-slate-700">
                    Age
                  </label>
                  <input
                    id="age"
                    type="number"
                    min={0}
                    max={150}
                    value={form.age}
                    onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                    placeholder="Age"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="mb-1 block text-sm font-medium text-slate-700">
                    Gender
                  </label>
                  <select
                    id="gender"
                    value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="Phone number"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  {submitError && <p className="mb-2 text-sm text-red-600">{submitError}</p>}
                  {success && <p className="mb-2 text-sm text-emerald-600">{success}</p>}
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Add patient
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-slate-800">All patients</h3>
                <p className="text-sm text-slate-500">Total: {patients.length}</p>
              </div>
              {loadingList ? (
                <div className="px-6 py-8 text-center text-slate-500">Loading...</div>
              ) : patients.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500">No patients yet. Add one above.</div>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {patients.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <p className="text-sm text-slate-500">
                          {[p.age != null && `${p.age}y`, p.gender && p.gender].filter(Boolean).join(' - ') || '-'}
                        </p>
                      </div>
                      {p.phone && <span className="text-sm text-slate-600">{p.phone}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

