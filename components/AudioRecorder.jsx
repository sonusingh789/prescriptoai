'use client';

import { useState, useRef, useCallback } from 'react';

export default function AudioRecorder({ onSubmit, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [blob, setBlob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunksRef.current.length) {
          setBlob(new Blob(chunksRef.current, { type: 'audio/webm' }));
        }
      };
      recorder.start(200);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error(err);
      alert('Microphone access denied or unavailable.');
    }
  }, [startTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    stopTimer();
    setIsRecording(false);
  }, [stopTimer]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleSubmit = useCallback(async () => {
    if (!onSubmit || !blob) return;
    setSubmitting(true);
    try {
      await onSubmit(blob);
    } finally {
      setSubmitting(false);
    }
  }, [onSubmit, blob]);

  const clearRecording = useCallback(() => {
    setBlob(null);
    setRecordingTime(0);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center gap-4">
        {!isRecording && !blob && (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500"
          >
            <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>
        )}
        {isRecording && (
          <button
            type="button"
            onClick={stopRecording}
            className="relative flex h-24 w-24 items-center justify-center rounded-full bg-red-500 text-white shadow-lg ring-4 ring-red-200 ring-offset-2 transition hover:bg-red-600"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-30" />
            <svg className="relative h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
        )}
        {blob && !isRecording && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled || submitting}
              className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit recording'}
            </button>
            <button
              type="button"
              onClick={clearRecording}
              disabled={submitting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        )}
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums text-slate-800">
        {formatTime(recordingTime)}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {isRecording && 'Recording in progress...'}
        {blob && !isRecording && 'Recording complete. Submit or clear.'}
        {!isRecording && !blob && 'Click the button to start recording'}
      </p>
    </div>
  );
}
