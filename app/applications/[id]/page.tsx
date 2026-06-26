'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Question = {
  id: number;
  application_id: number;
  question_text: string;
  draft_response: string | null;
  final_response: string | null;
  is_locked: number;
  created_at: string;
};

type ApplicationDetail = {
  id: number;
  company: string;
  role_title: string;
  job_description: string;
  why_company: string | null;
  status: 'drafting' | 'applied' | 'interviewing' | 'closed';
  created_at: string;
  questions: Question[];
};

type AppFormData = {
  company: string;
  role_title: string;
  job_description: string;
  why_company: string;
  status: ApplicationDetail['status'];
};

const STATUS_STYLES: Record<ApplicationDetail['status'], string> = {
  drafting:     'bg-gray-100 text-gray-600',
  applied:      'bg-blue-100 text-blue-700',
  interviewing: 'bg-amber-100 text-amber-700',
  closed:       'bg-red-100 text-red-600',
};

export default function ApplicationDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Top-section edit form
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailsForm, setDetailsForm] = useState<AppFormData>({
    company: '', role_title: '', job_description: '', why_company: '', status: 'drafting',
  });
  const [savingDetails, setSavingDetails] = useState(false);

  // Status inline dropdown
  const [savingStatus, setSavingStatus] = useState(false);

  // Draft response per question: id → current text
  const [draftEdits, setDraftEdits] = useState<Record<number, string>>({});
  const [savingDraftId, setSavingDraftId] = useState<number | null>(null);

  // Add question
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [addQuestionText, setAddQuestionText] = useState('');
  const [addingQuestion, setAddingQuestion] = useState(false);

  // Edit question text
  const [editingQId, setEditingQId] = useState<number | null>(null);
  const [editQText, setEditQText] = useState('');
  const [savingQText, setSavingQText] = useState(false);

  // Per-question action feedback
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [lockingId, setLockingId] = useState<number | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/applications/${id}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json() as Promise<ApplicationDetail>;
      })
      .then(data => {
        if (!data) return;
        setApp(data);
        setDetailsForm({
          company:         data.company,
          role_title:      data.role_title,
          job_description: data.job_description,
          why_company:     data.why_company ?? '',
          status:          data.status,
        });
        const edits: Record<number, string> = {};
        data.questions.forEach(q => { edits[q.id] = q.draft_response ?? ''; });
        setDraftEdits(edits);
        setLoading(false);
      });
  }, [id]);

  // ── Application detail handlers ────────────────────────────────────────────

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;
    setSavingDetails(true);
    const res = await fetch(`/api/applications/${app.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...detailsForm, why_company: detailsForm.why_company || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setApp(prev => prev ? { ...prev, ...updated } : prev);
      setEditingDetails(false);
    }
    setSavingDetails(false);
  };

  const handleStatusChange = async (newStatus: ApplicationDetail['status']) => {
    if (!app) return;
    setSavingStatus(true);
    const res = await fetch(`/api/applications/${app.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company:         app.company,
        role_title:      app.role_title,
        job_description: app.job_description,
        why_company:     app.why_company,
        status:          newStatus,
      }),
    });
    if (res.ok) {
      setApp(prev => prev ? { ...prev, status: newStatus } : prev);
      setDetailsForm(prev => ({ ...prev, status: newStatus }));
    }
    setSavingStatus(false);
  };

  // ── Question handlers ──────────────────────────────────────────────────────

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app || !addQuestionText.trim()) return;
    setAddingQuestion(true);
    const res = await fetch(`/api/applications/${app.id}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_text: addQuestionText }),
    });
    if (res.ok) {
      const newQ: Question = await res.json();
      setApp(prev => prev ? { ...prev, questions: [...prev.questions, newQ] } : prev);
      setDraftEdits(prev => ({ ...prev, [newQ.id]: '' }));
      setAddQuestionText('');
      setShowAddQuestion(false);
    }
    setAddingQuestion(false);
  };

  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm('Delete this question?')) return;
    const res = await fetch(`/api/questions/${qId}`, { method: 'DELETE' });
    if (res.ok) {
      setApp(prev => prev
        ? { ...prev, questions: prev.questions.filter(q => q.id !== qId) }
        : prev
      );
    }
  };

  const handleSaveQuestionText = async (qId: number) => {
    if (!editQText.trim()) return;
    setSavingQText(true);
    const res = await fetch(`/api/questions/${qId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_text: editQText }),
    });
    if (res.ok) {
      const updated: Question = await res.json();
      setApp(prev => prev
        ? { ...prev, questions: prev.questions.map(q => q.id === qId ? updated : q) }
        : prev
      );
      setEditingQId(null);
    }
    setSavingQText(false);
  };

  const handleSaveDraft = async (qId: number) => {
    setSavingDraftId(qId);
    const res = await fetch(`/api/questions/${qId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft_response: draftEdits[qId] ?? '' }),
    });
    if (res.ok) {
      const updated: Question = await res.json();
      setApp(prev => prev
        ? { ...prev, questions: prev.questions.map(q => q.id === qId ? updated : q) }
        : prev
      );
    }
    setSavingDraftId(null);
  };

  const handleLock = async (q: Question) => {
    setLockingId(q.id);
    const res = await fetch(`/api/questions/${q.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_locked: !q.is_locked }),
    });
    if (res.ok) {
      const updated: Question = await res.json();
      setApp(prev => prev
        ? { ...prev, questions: prev.questions.map(x => x.id === q.id ? updated : x) }
        : prev
      );
    }
    setLockingId(null);
  };

  const handleCopy = (q: Question) => {
    const text = draftEdits[q.id] ?? q.draft_response ?? '';
    navigator.clipboard.writeText(text);
    setCopiedId(q.id);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExport = () => {
    if (!app) return;
    const lines: string[] = [
      `${app.company} — ${app.role_title}`,
      `Status: ${app.status}`,
      '',
      'JOB DESCRIPTION',
      '─'.repeat(40),
      app.job_description,
    ];
    if (app.why_company) {
      lines.push('', 'WHY THIS COMPANY', '─'.repeat(40), app.why_company);
    }
    app.questions.forEach((q, i) => {
      lines.push('', `Q${i + 1}: ${q.question_text}`, '─'.repeat(40));
      const response = q.final_response || q.draft_response;
      lines.push(response ? response : '(no response yet)');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${app.company}-${app.role_title}`
      .replace(/[^a-z0-9\s-]/gi, '')
      .replace(/\s+/g, '_') + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-gray-400">Loading…</div>;
  }

  if (notFound || !app) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-sm text-gray-500">Application not found.</p>
        <button
          onClick={() => router.push('/applications')}
          className="mt-3 text-sm text-gray-400 hover:text-gray-700 hover:underline"
        >
          ← Back to applications
        </button>
      </div>
    );
  }

  const setDetails =
    (key: keyof AppFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setDetailsForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      {/* ── Back link ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => router.push('/applications')}
        className="text-xs text-gray-400 hover:text-gray-700 hover:underline"
      >
        ← Applications
      </button>

      {/* ── Application details ───────────────────────────────────────────── */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">

        {/* Header bar */}
        <div className="px-5 py-4 bg-white flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">
              {app.company}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{app.role_title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            {/* Status dropdown — auto-saves on change */}
            <select
              value={app.status}
              disabled={savingStatus}
              onChange={e => handleStatusChange(e.target.value as ApplicationDetail['status'])}
              className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-1 focus:ring-gray-400 cursor-pointer disabled:opacity-50 ${STATUS_STYLES[app.status]}`}
            >
              <option value="drafting">Drafting</option>
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="closed">Closed</option>
            </select>
            {!editingDetails && (
              <button
                onClick={() => setEditingDetails(true)}
                className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
              >
                Edit details
              </button>
            )}
          </div>
        </div>

        {/* Edit details form */}
        {editingDetails ? (
          <form
            onSubmit={handleSaveDetails}
            className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Company *</label>
                <input
                  value={detailsForm.company}
                  onChange={setDetails('company')}
                  required
                  autoFocus
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Role title *</label>
                <input
                  value={detailsForm.role_title}
                  onChange={setDetails('role_title')}
                  required
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Job description *</label>
              <textarea
                value={detailsForm.job_description}
                onChange={setDetails('job_description')}
                required
                rows={6}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white resize-y focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Why this company <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={detailsForm.why_company}
                onChange={setDetails('why_company')}
                rows={3}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white resize-y focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingDetails}
                className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {savingDetails ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingDetails(false);
                  setDetailsForm({
                    company: app.company,
                    role_title: app.role_title,
                    job_description: app.job_description,
                    why_company: app.why_company ?? '',
                    status: app.status,
                  });
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 bg-white"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* Read-only view of details */
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-4">
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                Job Description
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.job_description}</p>
            </div>
            {app.why_company && (
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                  Why This Company
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.why_company}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Questions ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Questions
            {app.questions.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({app.questions.length})
              </span>
            )}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
            >
              Export .txt
            </button>
            {!showAddQuestion && (
              <button
                onClick={() => setShowAddQuestion(true)}
                className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700"
              >
                + Add Question
              </button>
            )}
          </div>
        </div>

        {/* Add question form */}
        {showAddQuestion && (
          <form
            onSubmit={handleAddQuestion}
            className="border border-gray-200 rounded-lg mb-4 p-4 bg-white space-y-3"
          >
            <div>
              <label className="block text-xs text-gray-500 mb-1">Question text *</label>
              <input
                value={addQuestionText}
                onChange={e => setAddQuestionText(e.target.value)}
                required
                autoFocus
                placeholder="e.g. Tell me about a time you led a project under pressure."
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500 placeholder:text-gray-300"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addingQuestion || !addQuestionText.trim()}
                className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {addingQuestion ? 'Adding…' : 'Add question'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddQuestion(false); setAddQuestionText(''); }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {app.questions.length === 0 && !showAddQuestion && (
          <p className="text-sm text-gray-400">No questions yet. Add one to start drafting responses.</p>
        )}

        {/* Question cards */}
        <ul className="space-y-3">
          {app.questions.map((q, index) => {
            const isLocked = q.is_locked === 1;
            const draftValue = draftEdits[q.id] ?? '';
            const savedDraft = q.draft_response ?? '';
            const isDirty = draftValue !== savedDraft;

            return (
              <li
                key={q.id}
                className={`border rounded-lg overflow-hidden ${
                  isLocked ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'
                }`}
              >
                {/* Question header */}
                <div className="px-4 py-3 flex items-start gap-3">
                  <span className="text-xs font-mono text-gray-400 shrink-0 mt-0.5 w-6">
                    Q{index + 1}
                  </span>

                  {editingQId === q.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        value={editQText}
                        onChange={e => setEditQText(e.target.value)}
                        autoFocus
                        className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-500"
                      />
                      <button
                        onClick={() => handleSaveQuestionText(q.id)}
                        disabled={savingQText || !editQText.trim()}
                        className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50 shrink-0"
                      >
                        {savingQText ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingQId(null)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="flex-1 text-sm font-medium text-gray-800">{q.question_text}</p>
                      <div className="flex gap-1 shrink-0">
                        {isLocked && (
                          <span className="text-xs text-amber-600 font-medium px-1.5 py-0.5">
                            🔒 Locked
                          </span>
                        )}
                        {!isLocked && (
                          <button
                            onClick={() => {
                              setEditingQId(q.id);
                              setEditQText(q.question_text);
                            }}
                            className="text-xs text-gray-400 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-100"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-0.5 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Draft response */}
                <div className="border-t border-gray-100 px-4 py-3">
                  <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                    Draft Response
                  </label>
                  <textarea
                    value={draftValue}
                    onChange={e =>
                      setDraftEdits(prev => ({ ...prev, [q.id]: e.target.value }))
                    }
                    disabled={isLocked}
                    rows={5}
                    placeholder={isLocked ? '' : 'Write or generate a draft response…'}
                    className={`w-full text-sm border rounded px-2 py-1.5 resize-y focus:outline-none focus:ring-1 focus:ring-gray-500 placeholder:text-gray-300 ${
                      isLocked
                        ? 'border-amber-200 bg-amber-50 text-gray-600 cursor-not-allowed'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  />

                  {/* Action bar */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <button
                      onClick={() => {/* placeholder — AI wired in next step */}}
                      disabled={isLocked}
                      className="text-xs px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ✦ Generate Draft
                    </button>

                    <button
                      onClick={() => handleLock(q)}
                      disabled={lockingId === q.id}
                      className={`text-xs px-2.5 py-1 rounded disabled:opacity-50 ${
                        isLocked
                          ? 'border border-amber-300 text-amber-700 hover:bg-amber-100'
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {lockingId === q.id ? '…' : isLocked ? '🔓 Unlock' : '🔒 Lock'}
                    </button>

                    <button
                      onClick={() => handleCopy(q)}
                      disabled={!draftValue}
                      className="text-xs px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {copiedId === q.id ? '✓ Copied' : 'Copy'}
                    </button>

                    {isDirty && !isLocked && (
                      <button
                        onClick={() => handleSaveDraft(q.id)}
                        disabled={savingDraftId === q.id}
                        className="text-xs px-2.5 py-1 bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50 ml-auto"
                      >
                        {savingDraftId === q.id ? 'Saving…' : 'Save draft'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
