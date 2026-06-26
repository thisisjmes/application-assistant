'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Application = {
  id: number;
  company: string;
  role_title: string;
  job_description: string;
  why_company: string | null;
  status: 'drafting' | 'applied' | 'interviewing' | 'closed';
  created_at: string;
};

type AppFormData = {
  company: string;
  role_title: string;
  job_description: string;
  why_company: string;
  status: 'drafting' | 'applied' | 'interviewing' | 'closed';
};

const emptyForm: AppFormData = {
  company: '',
  role_title: '',
  job_description: '',
  why_company: '',
  status: 'drafting',
};

const STATUS_STYLES: Record<Application['status'], string> = {
  drafting:     'bg-gray-100 text-gray-600',
  applied:      'bg-blue-100 text-blue-700',
  interviewing: 'bg-amber-100 text-amber-700',
  closed:       'bg-red-100 text-red-600',
};

const STATUS_LABELS: Record<Application['status'], string> = {
  drafting:     'Drafting',
  applied:      'Applied',
  interviewing: 'Interviewing',
  closed:       'Closed',
};

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AppFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/applications')
      .then(r => r.json())
      .then((data: Application[]) => {
        setApplications(data);
        setLoading(false);
      });
  }, []);

  const set =
    (key: keyof AppFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        why_company: form.why_company || null,
      }),
    });
    if (res.ok) {
      const newApp: Application = await res.json();
      setApplications(prev => [newApp, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
    }
    setSubmitting(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Delete this application and all its questions?')) return;
    const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
    if (res.ok) setApplications(prev => prev.filter(a => a.id !== id));
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-gray-400">Loading…</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Applications</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-700"
          >
            + New Application
          </button>
        )}
      </div>

      {/* New application inline form */}
      {showForm && (
        <div className="border border-gray-200 rounded-lg mb-5 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-4 space-y-3 bg-white">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Company *</label>
                <input
                  value={form.company}
                  onChange={set('company')}
                  required
                  autoFocus
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Role title *</label>
                <input
                  value={form.role_title}
                  onChange={set('role_title')}
                  required
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Job description *</label>
              <textarea
                value={form.job_description}
                onChange={set('job_description')}
                required
                rows={6}
                placeholder="Paste the job description here…"
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 resize-y focus:outline-none focus:ring-1 focus:ring-gray-500 placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Why this company <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={form.why_company}
                onChange={set('why_company')}
                rows={3}
                placeholder="What excites you about this company or role?"
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 resize-y focus:outline-none focus:ring-1 focus:ring-gray-500 placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={form.status}
                onChange={set('status')}
                className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500 bg-white"
              >
                <option value="drafting">Drafting</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create application'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {applications.length === 0 && !showForm && (
        <p className="text-sm text-gray-400">No applications yet. Create one to get started.</p>
      )}

      {/* Application list */}
      <ul className="space-y-2">
        {applications.map(app => (
          <li
            key={app.id}
            onClick={() => router.push(`/applications/${app.id}`)}
            className="border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 group"
          >
            {/* Text */}
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm text-gray-900">{app.company}</span>
              <span className="text-gray-400 mx-1.5">·</span>
              <span className="text-sm text-gray-600">{app.role_title}</span>
            </div>

            {/* Status badge */}
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[app.status]}`}
            >
              {STATUS_LABELS[app.status]}
            </span>

            {/* Delete */}
            <button
              onClick={e => handleDelete(e, app.id)}
              className="text-xs text-gray-300 hover:text-red-500 px-1.5 py-0.5 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
