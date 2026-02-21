'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import AudioRecorder from '@/components/AudioRecorder';

export default function RecordPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [error, setError] = useState('');

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
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (user?.role !== 'doctor') return;
    setLoadingPatients(true);
    fetch('/api/patients')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPatients(Array.isArray(d) ? d : []))
      .catch(() => setPatients([]))
      .finally(() => setLoadingPatients(false));
  }, [user?.role]);

  const handleSubmit = useCallback(
    async (audioBlob) => {
      if (!selectedPatientId) {
        setError('Please select a patient');
        return;
      }
      setError('');
      const formData = new FormData();
      formData.append('patient_id', selectedPatientId);
      formData.append('audio', audioBlob, 'recording.webm');
      const res = await fetch('/api/record', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }
      router.push(`/conversations/${data.conversationId}`);
    },
    [selectedPatientId, router]
  );

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading...
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-4xl px-2 sm:px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-slate-900">Record Consultation</h2>
          <p className="text-sm text-slate-500">Start a voice-based consultation recording</p>
        </div>

        {user?.role !== 'doctor' ? (
          <p className="text-slate-600">Only doctors can record consultations.</p>
        ) : (
          <>
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Select Patient</h3>
                <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    disabled={loadingPatients}
                    className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none disabled:opacity-50"
                  >
                    <option value="">Choose patient...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - MRN{String(p.id).padStart(6, '0')}
                        {p.age != null || p.gender ? ` (${[p.age && `${p.age}y`, p.gender].filter(Boolean).join(', ')})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {!loadingPatients && patients.length === 0 && (
                  <p className="mt-2 text-sm text-slate-500">
                    No patients yet.{' '}
                    <a href="/dashboard/patients" className="font-semibold text-blue-600 hover:underline">
                      Add a patient
                    </a>{' '}
                    first.
                  </p>
                )}
                {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              </div>

              <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-white to-slate-50 p-8 sm:p-12">
                <AudioRecorder onSubmit={handleSubmit} disabled={!selectedPatientId || loadingPatients} />
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
