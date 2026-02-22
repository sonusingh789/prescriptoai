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
  const [advice, setAdvice] = useState([]);
  const [followUpText, setFollowUpText] = useState('');
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [printing, setPrinting] = useState(false);

  const handlePrintPdf = useCallback(async () => {
    const prescriptionId = data?.prescription?.id;
    const status = data?.prescription?.status;
    if (printing || !prescriptionId || status !== 'approved') return;

    setError('');
    setPrinting(true);

    let objectUrl = '';
    let iframe = null;

    function cleanup() {
      try {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      } catch (_) {}
      try {
        if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
      } catch (_) {}
      objectUrl = '';
      iframe = null;
    }

    try {
      const pdfUrl = `/api/prescriptions/${prescriptionId}/pdf?disposition=inline`;
      const res = await fetch(pdfUrl);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Failed to load PDF (${res.status})`);
      }
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);

      iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = objectUrl;
      document.body.appendChild(iframe);

      const finish = () => {
        cleanup();
        setPrinting(false);
      };

      iframe.onload = () => {
        try {
          const w = iframe.contentWindow;
          if (!w) throw new Error('No iframe window');
          w.focus();
          w.print();

          try {
            w.addEventListener('afterprint', finish, { once: true });
          } catch (_) {}

          // Fallback cleanup in case afterprint doesn't fire.
          setTimeout(finish, 2 * 60 * 1000);
        } catch (_) {
          // Fallback: open in a new tab if the browser blocks iframe printing.
          cleanup();
          const win = window.open(objectUrl || pdfUrl, '_blank', 'noopener,noreferrer');
          if (!win) setError('Popup blocked. Please allow popups to print.');
          setPrinting(false);
        }
      };
    } catch (e) {
      cleanup();
      setError(e?.message || 'Failed to print PDF');
      setPrinting(false);
    }
  }, [data, printing]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (r) => {
        if (r.status === 401) {
          router.push('/login');
          return null;
        }
        return r.json().catch(() => null);
      })
      .then((d) => {
        if (d?.user) setUser(d.user);
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
        setInvestigations((d.prescription?.investigations || []).map((i) => (typeof i === 'string' ? i : i.test_name)));
        // structured_json is already parsed on the server
        const adviceBlock = d.prescription?.structured_json?.advice_and_followup || {};
        setAdvice((adviceBlock.advice || []).slice());
        setFollowUpText(adviceBlock.follow_up || '');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, router]);

  const saveDraft = useCallback(async () => {
    if (!data?.prescription?.id) return false;
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
          advice: advice.filter(Boolean),
          follow_up: followUpText || '',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Save failed');
        return false;
      }
      return true;
    } catch (e) {
      setError(e.message || 'Save failed');
      return false;
    } finally {
      setSaving(false);
    }
  }, [data, medications, investigations]);

  const approve = useCallback(async () => {
    if (!data?.prescription?.id) return;
    setApproving(true);
    setError('');
    try {
      // Save current draft first to ensure medications/investigations are persisted
      const saved = await saveDraft();
      if (!saved) {
        setApproving(false);
        return;
      }

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
  }, [data, saveDraft]);

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

  const addAdvice = useCallback(() => {
    setAdvice((prev) => [...prev, '']);
  }, []);

  const removeAdvice = useCallback((index) => {
    setAdvice((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateAdvice = useCallback((index, value) => {
    setAdvice((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-red-600">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { conversation, prescription } = data;
  const isDraft = prescription.status === 'draft';
  const structured = prescription.structured_json || {};
  const presenting = structured.presenting_complaint || {};
  const diagnosisBlock = structured.diagnosis || {};
  const adviceBlock = structured.advice_and_followup || {};
  const complaints = presenting.associated_symptoms || [];
  const diagnosisList = [diagnosisBlock.primary, ...(diagnosisBlock.differential || [])].filter(Boolean);
  const adviceList = adviceBlock.advice || [];
  const followUp = adviceBlock.follow_up || '';
  const transcript = conversation.transcript || '';

  const complaintSummary = presenting.summary || (() => {
    if (!transcript) return '';
    const clean = transcript.replace(/\s+/g, ' ').trim();
    if (clean.length <= 220) return clean;
    const firstSentence = clean.split(/(?<=[.?!])\s+/)[0] || '';
    if (firstSentence.length >= 80 && firstSentence.length <= 220) return firstSentence;
    return clean.slice(0, 220).trim() + '...';
  })();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading...
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 text-slate-900">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Prescription Review
            </h2>
            
            <p className="text-slate-600">
              Patient: {conversation.patient_name} ({mrn(conversation.patient_id)})
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {prescription.status === 'approved' && (
              <>
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  disabled={printing}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 sm:flex-none"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 9V4h12v5M6 18h12v2H6v-2Zm0 0H4v-6a2 2 0 012-2h12a2 2 0 012 2v6h-2"
                    />
                  </svg>
                  {printing ? 'Preparing…' : 'Print'}
                </button>
                <a
                  href={`/api/prescriptions/${prescription.id}/pdf`}
                  download
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 sm:flex-none"
                >
                  Download PDF
                </a>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking text-slate-500">Patient Information</h3>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-800">{conversation.patient_name}</dd></div>
                <div><dt className="text-slate-500">MRN</dt><dd className="font-medium text-slate-800">{mrn(conversation.patient_id)}</dd></div>
                <div><dt className="text-slate-500">Age / Gender</dt><dd className="font-medium text-slate-800">{[conversation.age && `${conversation.age} years`, conversation.gender].filter(Boolean).join(' / ') || '-'}</dd></div>
                <div><dt className="text-slate-500">Date</dt><dd className="font-medium text-slate-800">{conversation.created_at ? new Date(conversation.created_at).toISOString().slice(0, 10) : '-'}</dd></div>
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking text-slate-500">Clinical Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Presenting Complaints</p>
                  {complaintSummary && (
                    <p className="mt-1 rounded-lg bg-blue-50 px-3 py-2 text-slate-800">{complaintSummary}</p>
                  )}
                  <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">
                    {Array.isArray(complaints) ? complaints.join(', ') : complaints || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Diagnosis</p>
                  <p className="text-slate-800">{Array.isArray(diagnosisList) ? diagnosisList.map((d) => (typeof d === 'string' ? d : d.name)).join(', ') : diagnosisList || '-'}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking text-slate-500">QUICK PREVIEW </h3>
            <div className="space-y-3 text-sm">
              <p className="font-medium text-slate-800">Patient: {conversation.patient_name} ({mrn(conversation.patient_id)})</p>
              <p className="text-slate-600">Presenting Complaints: {Array.isArray(complaints) ? complaints.join(', ') : '-'}</p>
              <p className="text-slate-600">Diagnosis: {Array.isArray(diagnosisList) ? diagnosisList.map((d) => (typeof d === 'string' ? d : d.name)).join(', ') : '-'}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-slate-200"><th className="py-2 font-semibold">Medicine</th><th className="py-2 font-semibold">Dosage</th><th className="py-2 font-semibold">Frequency</th><th className="py-2 font-semibold">Duration</th></tr></thead>
                  <tbody>
                    {medications.map((m, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2">{m.name || '-'}</td>
                        <td className="py-2">{m.dosage || '-'}</td>
                        <td className="py-2">{m.frequency || '-'}</td>
                        <td className="py-2">{m.duration || '-'}</td>
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

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking text-slate-500">Additional Instructions</h3>
          <div className="space-y-4 text-sm">
            <div>
              <label className="text-slate-600 flex items-center justify-between">Advice
                {isDraft && (
                  <button type="button" onClick={addAdvice} className="ml-3 inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium">
                    + Add
                  </button>
                )}
              </label>
              <div className="mt-2 space-y-2">
                {(advice.length === 0 && !isDraft) ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-800">{Array.isArray(advice) ? advice.join(', ') : advice || '-'}</p>
                ) : (
                  advice.map((a, i) => (
                    <div key={i} className="flex gap-2">
                      <input placeholder="Advice" value={a || ''} onChange={(e) => updateAdvice(i, e.target.value)} disabled={!isDraft} className="flex-1 rounded border border-slate-200 bg-white px-3 py-2 text-sm" />
                      {isDraft && (
                        <button type="button" onClick={() => removeAdvice(i)} className="text-red-600 hover:text-red-700" aria-label="Remove">
                          ×
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <label className="text-slate-600">Follow-up</label>
              {isDraft ? (
                <textarea value={followUpText} onChange={(e) => setFollowUpText(e.target.value)} placeholder="Follow-up instructions" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
              ) : (
                <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">{followUpText || '-'}</p>
              )}
            </div>
          </div>
        </section>

        {isDraft && (
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={saveDraft} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              {saving ? 'Saving...' : 'Save draft'}
            </button>
            <button type="button" onClick={approve} disabled={approving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {approving ? 'Approving...' : 'Approve'}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
