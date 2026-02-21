'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';

const mrn = (id) => `MRN${String(id).padStart(6, '0')}`;

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [medications, setMedications] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.status === 401 ? null : r.json()))
      .then((d) => {
        if (d?.user) setUser(d.user);
        if (r.status === 401) router.push('/login');
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/conversations/${id}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (r.status === 401) {
          router.push('/login');
          return null;
        }
        if (!r.ok) throw new Error(body.error || `Failed to load (${r.status})`);
        return body;
      })
      .then((d) => {
        if (!d) return;
        setData(d);
        setMedications(d.prescription?.medications?.slice() || []);
        setInvestigations(
          (d.prescription?.investigations || []).map((i) => (typeof i === 'string' ? i : i.test_name))
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, router]);

  const saveDraft = useCallback(async () => {
    if (!data?.prescription?.id) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/prescriptions/${data.prescription.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medications: medications.map((m) => ({
            name: m.name ?? '',
            dosage: m.dosage ?? '',
            frequency: m.frequency ?? '',
            duration: m.duration ?? '',
            instructions: m.instructions ?? '',
          })),
          investigations: investigations.filter(Boolean).map((t) => ({ test_name: t })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Save failed');
        return;
      }
    } finally {
      setSaving(false);
    }
  }, [data, medications, investigations]);

  const approve = useCallback(async () => {
    if (!data?.prescription?.id) return;
    setApproving(true);
    setError('');
    try {
      const res = await fetch(`/api/prescriptions/${data.prescription.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Approve failed');
        return;
      }
      setData((prev) => ({
        ...prev,
        prescription: { ...prev.prescription, status: 'approved' },
      }));
      window.open(`/api/prescriptions/${data.prescription.id}/pdf`, '_blank');
    } finally {
      setApproving(false);
    }
  }, [data]);

  const addMedication = useCallback(() => {
    setMedications((prev) => [...prev, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  }, []);

  const removeMedication = useCallback((index) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateMedication = useCallback((index, field, value) => {
    setMedications((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const addInvestigation = useCallback(() => {
    setInvestigations((prev) => [...prev, '']);
  }, []);

  const removeInvestigation = useCallback((index) => {
    setInvestigations((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateInvestigation = useCallback((index, value) => {
    setInvestigations((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-red-600">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { conversation, prescription } = data;
  const isDraft = prescription.status === 'draft';
  const structured = prescription.structured_json || {};
  const complaints = structured.presenting_complaints;
  const diagnosisList = structured.diagnosis || [];
  const adviceList = structured.advice || [];
  const followUp = structured.follow_up || '';

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading…
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Prescription Review</h2>
            <p className="text-slate-600">
              Patient: {conversation.patient_name} ({mrn(conversation.patient_id)})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/prescriptions/${prescription.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Preview PDF
            </a>
            {prescription.status === 'approved' && (
              <a
                href={`/api/prescriptions/${prescription.id}/pdf`}
                download
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Download PDF
              </a>
            )}
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking text-slate-500">Patient Information</h3>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-800">{conversation.patient_name}</dd></div>
                <div><dt className="text-slate-500">MRN</dt><dd className="font-medium text-slate-800">{mrn(conversation.patient_id)}</dd></div>
                <div><dt className="text-slate-500">Age / Gender</dt><dd className="font-medium text-slate-800">{[conversation.age && `${conversation.age} years`, conversation.gender].filter(Boolean).join(' / ') || '—'}</dd></div>
                <div><dt className="text-slate-500">Date</dt><dd className="font-medium text-slate-800">{conversation.created_at ? new Date(conversation.created_at).toISOString().slice(0, 10) : '—'}</dd></div>
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking text-slate-500">Clinical Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Presenting Complaints</p>
                  <p className="text-slate-800">{Array.isArray(complaints) ? complaints.join(', ') : complaints || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Diagnosis</p>
                  <p className="text-slate-800">{Array.isArray(diagnosisList) ? diagnosisList.map((d) => (typeof d === 'string' ? d : d.name)).join(', ') : diagnosisList || '—'}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking text-slate-500">MediScript AI — Prescription</h3>
            <div className="space-y-3 text-sm">
              <p className="font-medium text-slate-800">Patient: {conversation.patient_name} ({mrn(conversation.patient_id)})</p>
              <p className="text-slate-600">Diagnosis: {Array.isArray(diagnosisList) ? diagnosisList.map((d) => (typeof d === 'string' ? d : d.name)).join(', ') : '—'}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-200"><th className="py-2 font-semibold">Medicine</th><th className="py-2 font-semibold">Dosage</th><th className="py-2 font-semibold">Frequency</th><th className="py-2 font-semibold">Duration</th></tr></thead>
                  <tbody>
                    {medications.map((m, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2">{m.name || '—'}</td>
                        <td className="py-2">{m.dosage || '—'}</td>
                        <td className="py-2">{m.frequency || '—'}</td>
                        <td className="py-2">{m.duration || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {adviceList.length > 0 && <p className="text-slate-700"><span className="font-medium">Advice:</span> {Array.isArray(adviceList) ? adviceList.join(', ') : adviceList}</p>}
              {followUp && <p className="text-slate-700"><span className="font-medium">Follow-up:</span> {followUp}</p>}
            </div>
          </div>
        </div>

        {conversation.transcript && (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking text-slate-500">Transcript</h3>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{conversation.transcript}</p>
          </section>
        )}

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking text-slate-500">Medications</h3>
            {isDraft && (
              <button type="button" onClick={addMedication} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <span className="text-lg">+</span> Add
              </button>
            )}
          </div>
          <div className="space-y-3">
            {medications.map((m, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                <input placeholder="Medicine" value={m.name || ''} onChange={(e) => updateMedication(i, 'name', e.target.value)} disabled={!isDraft} className="min-w-[120px] rounded border border-slate-200 bg-white px-2 py-1.5 text-sm" />
                <input placeholder="Dosage" value={m.dosage || ''} onChange={(e) => updateMedication(i, 'dosage', e.target.value)} disabled={!isDraft} className="w-24 rounded border border-slate-200 bg-white px-2 py-1.5 text-sm" />
                <input placeholder="Frequency" value={m.frequency || ''} onChange={(e) => updateMedication(i, 'frequency', e.target.value)} disabled={!isDraft} className="w-28 rounded border border-slate-200 bg-white px-2 py-1.5 text-sm" />
                <input placeholder="Duration" value={m.duration || ''} onChange={(e) => updateMedication(i, 'duration', e.target.value)} disabled={!isDraft} className="w-24 rounded border border-slate-200 bg-white px-2 py-1.5 text-sm" />
                <input placeholder="Instructions" value={m.instructions || ''} onChange={(e) => updateMedication(i, 'instructions', e.target.value)} disabled={!isDraft} className="min-w-[120px] flex-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-sm" />
                {isDraft && (
                  <button type="button" onClick={() => removeMedication(i)} className="text-red-600 hover:text-red-700" aria-label="Remove">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking text-slate-500">Investigations</h3>
            {isDraft && (
              <button type="button" onClick={addInvestigation} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <span className="text-lg">+</span> Add
              </button>
            )}
          </div>
          <div className="space-y-2">
            {investigations.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="Test name" value={t} onChange={(e) => updateInvestigation(i, e.target.value)} disabled={!isDraft} className="flex-1 rounded border border-slate-200 bg-white px-3 py-2 text-sm" />
                {isDraft && (
                  <button type="button" onClick={() => removeInvestigation(i)} className="text-red-600 hover:text-red-700" aria-label="Remove">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking text-slate-500">Additional Instructions</h3>
          <div className="space-y-4 text-sm">
            <div>
              <label className="text-slate-600">Advice</label>
              <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">{Array.isArray(adviceList) ? adviceList.join(', ') : adviceList || '—'}</p>
            </div>
            <div>
              <label className="text-slate-600">Follow-up</label>
              <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">{followUp || '—'}</p>
            </div>
          </div>
        </section>

        {isDraft && (
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={saveDraft} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button type="button" onClick={approve} disabled={approving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {approving ? 'Approving…' : 'Approve'}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}