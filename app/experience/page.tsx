'use client';

import { useState, useEffect } from 'react';

type Highlight = {
  id: number;
  role_id: number;
  content: string;
  created_at: string;
};

type Role = {
  id: number;
  title: string;
  company: string;
  start_date: string;
  end_date: string | null;
  location: string;
  description: string;
  created_at: string;
  highlights: Highlight[];
};

type RoleFormData = {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
  location: string;
  description: string;
};

const emptyForm: RoleFormData = {
  title: '',
  company: '',
  start_date: '',
  end_date: '',
  location: '',
  description: '',
};

function formatDateRange(start: string, end: string | null): string {
  const fmt = (d: string) => {
    const [year, month] = d.split('-');
    return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-AU', {
      month: 'short',
      year: 'numeric',
    });
  };
  return `${fmt(start)} – ${end ? fmt(end) : 'Present'}`;
}

function RoleForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: {
  form: RoleFormData;
  onChange: (f: RoleFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const set =
    (key: keyof RoleFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...form, [key]: e.target.value });

  return (
    <form onSubmit={onSubmit} className="p-4 space-y-3 bg-white">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Title *</label>
          <input
            value={form.title}
            onChange={set('title')}
            required
            autoFocus
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Company *</label>
          <input
            value={form.company}
            onChange={set('company')}
            required
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start date * (YYYY-MM)</label>
          <input
            value={form.start_date}
            onChange={set('start_date')}
            required
            placeholder="2022-01"
            pattern="\d{4}-\d{2}"
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">End date (blank = present)</label>
          <input
            value={form.end_date}
            onChange={set('end_date')}
            placeholder="2024-03"
            pattern="\d{4}-\d{2}"
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Location *</label>
        <input
          value={form.location}
          onChange={set('location')}
          required
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Description *</label>
        <textarea
          value={form.description}
          onChange={set('description')}
          required
          rows={3}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ExperiencePage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const [showAddRole, setShowAddRole] = useState(false);
  const [addForm, setAddForm] = useState<RoleFormData>(emptyForm);
  const [addingRole, setAddingRole] = useState(false);

  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editRoleForm, setEditRoleForm] = useState<RoleFormData>(emptyForm);
  const [savingRole, setSavingRole] = useState(false);

  const [addHighlightRoleId, setAddHighlightRoleId] = useState<number | null>(null);
  const [addHighlightText, setAddHighlightText] = useState('');
  const [addingHighlight, setAddingHighlight] = useState(false);

  const [editingHighlightId, setEditingHighlightId] = useState<number | null>(null);
  const [editHighlightText, setEditHighlightText] = useState('');
  const [savingHighlight, setSavingHighlight] = useState(false);

  useEffect(() => {
    fetch('/api/roles')
      .then(r => r.json())
      .then((data: Role[]) => {
        setRoles(data);
        setLoading(false);
      });
  }, []);

  const toggleExpanded = (id: number) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── Role handlers ──────────────────────────────────────────────────────────

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingRole(true);
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    if (res.ok) {
      const newRole: Role = await res.json();
      setRoles(prev => [newRole, ...prev]);
      setAddForm(emptyForm);
      setShowAddRole(false);
    }
    setAddingRole(false);
  };

  const startEditRole = (role: Role) => {
    setEditingRoleId(role.id);
    setEditRoleForm({
      title: role.title,
      company: role.company,
      start_date: role.start_date,
      end_date: role.end_date ?? '',
      location: role.location,
      description: role.description,
    });
  };

  const handleSaveRole = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    setSavingRole(true);
    const res = await fetch(`/api/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editRoleForm),
    });
    if (res.ok) {
      const updated: Role = await res.json();
      setRoles(prev =>
        prev.map(r => (r.id === id ? { ...updated, highlights: r.highlights } : r))
      );
      setEditingRoleId(null);
    }
    setSavingRole(false);
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm('Delete this role and all its highlights?')) return;
    const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
    if (res.ok) setRoles(prev => prev.filter(r => r.id !== id));
  };

  // ── Highlight handlers ─────────────────────────────────────────────────────

  const handleAddHighlight = async (roleId: number) => {
    if (!addHighlightText.trim()) return;
    setAddingHighlight(true);
    const res = await fetch(`/api/roles/${roleId}/highlights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: addHighlightText }),
    });
    if (res.ok) {
      const h: Highlight = await res.json();
      setRoles(prev =>
        prev.map(r => (r.id === roleId ? { ...r, highlights: [...r.highlights, h] } : r))
      );
      setAddHighlightText('');
      setAddHighlightRoleId(null);
    }
    setAddingHighlight(false);
  };

  const startEditHighlight = (h: Highlight) => {
    setEditingHighlightId(h.id);
    setEditHighlightText(h.content);
  };

  const handleSaveHighlight = async (h: Highlight) => {
    setSavingHighlight(true);
    const res = await fetch(`/api/highlights/${h.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editHighlightText }),
    });
    if (res.ok) {
      const updated: Highlight = await res.json();
      setRoles(prev =>
        prev.map(r =>
          r.id === h.role_id
            ? { ...r, highlights: r.highlights.map(x => (x.id === h.id ? updated : x)) }
            : r
        )
      );
      setEditingHighlightId(null);
    }
    setSavingHighlight(false);
  };

  const handleDeleteHighlight = async (h: Highlight) => {
    const res = await fetch(`/api/highlights/${h.id}`, { method: 'DELETE' });
    if (res.ok) {
      setRoles(prev =>
        prev.map(r =>
          r.id === h.role_id
            ? { ...r, highlights: r.highlights.filter(x => x.id !== h.id) }
            : r
        )
      );
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-gray-400">Loading…</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Experience</h1>
        {!showAddRole && (
          <button
            onClick={() => setShowAddRole(true)}
            className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-700"
          >
            + Add role
          </button>
        )}
      </div>

      {/* Add role form */}
      {showAddRole && (
        <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
          <RoleForm
            form={addForm}
            onChange={setAddForm}
            onSubmit={handleAddRole}
            onCancel={() => {
              setShowAddRole(false);
              setAddForm(emptyForm);
            }}
            submitting={addingRole}
            submitLabel="Add role"
          />
        </div>
      )}

      {roles.length === 0 && !showAddRole && (
        <p className="text-sm text-gray-400">No roles yet. Add one to get started.</p>
      )}

      <ul className="space-y-2">
        {roles.map(role => (
          <li key={role.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {editingRoleId === role.id ? (
              <RoleForm
                form={editRoleForm}
                onChange={setEditRoleForm}
                onSubmit={e => handleSaveRole(e, role.id)}
                onCancel={() => setEditingRoleId(null)}
                submitting={savingRole}
                submitLabel="Save changes"
              />
            ) : (
              <>
                {/* Role header row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => toggleExpanded(role.id)}
                >
                  <span className="text-gray-400 text-[10px] w-3 shrink-0">
                    {expanded.has(role.id) ? '▼' : '▶'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 text-sm">{role.title}</span>
                    <span className="text-gray-400 mx-1.5">·</span>
                    <span className="text-gray-600 text-sm">{role.company}</span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                    {formatDateRange(role.start_date, role.end_date)}
                  </span>
                  <div
                    className="flex gap-1.5 shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => startEditRole(role)}
                      className="text-xs text-gray-400 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-0.5 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expanded body */}
                {expanded.has(role.id) && (
                  <div className="border-t border-gray-100 bg-gray-50 px-8 py-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{role.location}</span>
                      <span className="text-xs text-gray-300 sm:hidden">
                        {formatDateRange(role.start_date, role.end_date)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{role.description}</p>

                    {/* Highlights section */}
                    <div className="pt-1">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Highlights
                      </p>

                      {role.highlights.length === 0 && (
                        <p className="text-xs text-gray-400 mb-2">No highlights yet.</p>
                      )}

                      <ul className="space-y-2 mb-3">
                        {role.highlights.map(h => (
                          <li key={h.id}>
                            {editingHighlightId === h.id ? (
                              <div className="flex gap-2">
                                <textarea
                                  value={editHighlightText}
                                  onChange={e => setEditHighlightText(e.target.value)}
                                  rows={3}
                                  autoFocus
                                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-gray-500 bg-white"
                                />
                                <div className="flex flex-col gap-1 shrink-0">
                                  <button
                                    onClick={() => handleSaveHighlight(h)}
                                    disabled={savingHighlight}
                                    className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingHighlightId(null)}
                                    className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 bg-white"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2 group">
                                <span className="text-gray-400 mt-0.5 shrink-0">·</span>
                                <p className="flex-1 text-sm text-gray-700">{h.content}</p>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button
                                    onClick={() => startEditHighlight(h)}
                                    className="text-xs text-gray-400 hover:text-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-200"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteHighlight(h)}
                                    className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-0.5 rounded hover:bg-red-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>

                      {/* Add highlight */}
                      {addHighlightRoleId === role.id ? (
                        <div className="flex gap-2">
                          <textarea
                            value={addHighlightText}
                            onChange={e => setAddHighlightText(e.target.value)}
                            rows={3}
                            autoFocus
                            placeholder="Describe the highlight. Include: what you did, the outcome or number, and the skill/theme it shows."
                            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-gray-500 bg-white placeholder:text-gray-400"
                          />
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => handleAddHighlight(role.id)}
                              disabled={addingHighlight || !addHighlightText.trim()}
                              className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => {
                                setAddHighlightRoleId(null);
                                setAddHighlightText('');
                              }}
                              className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 bg-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddHighlightRoleId(role.id)}
                          className="text-xs text-gray-400 hover:text-gray-700 hover:underline"
                        >
                          + Add highlight
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
