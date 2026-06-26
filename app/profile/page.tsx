'use client';

import { useState, useEffect, useRef } from 'react';

export default function ProfilePage() {
  const [aboutPositioning, setAboutPositioning] = useState('');
  const [voiceTone, setVoiceTone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setAboutPositioning(data.about_positioning ?? '');
        setVoiceTone(data.voice_tone ?? '');
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        about_positioning: aboutPositioning,
        voice_tone: voiceTone,
      }),
    });
    setSaving(false);
    setSaved(true);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
        <div className="flex items-center gap-4">
          <span
            className="text-sm text-green-600 transition-opacity duration-700"
            style={{ opacity: saved ? 1 : 0 }}
          >
            Saved
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded text-sm bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          About &amp; Positioning
        </label>
        <p className="text-xs text-gray-400">
          Your background summary, through-line, why you&apos;re in the market, what&apos;s distinctive, education.
        </p>
        <textarea
          value={aboutPositioning}
          onChange={e => setAboutPositioning(e.target.value)}
          rows={14}
          className="w-full rounded border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-y"
          placeholder="Paste your background here…"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Voice &amp; Tone Rules
        </label>
        <p className="text-xs text-gray-400">
          Your writing rules — plain, grounded, punchy, no first-person in bullets, banned phrases, etc.
        </p>
        <textarea
          value={voiceTone}
          onChange={e => setVoiceTone(e.target.value)}
          rows={10}
          className="w-full rounded border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-y"
          placeholder="Paste your voice and tone rules here…"
        />
      </div>
    </div>
  );
}
