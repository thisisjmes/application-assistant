import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const roles = db.prepare(`
    SELECT * FROM roles ORDER BY start_date DESC
  `).all();

  const highlights = db.prepare(`
    SELECT * FROM highlights ORDER BY created_at ASC
  `).all() as { role_id: number; [key: string]: unknown }[];

  const highlightsByRole = highlights.reduce<Record<number, unknown[]>>((acc, h) => {
    if (!acc[h.role_id]) acc[h.role_id] = [];
    acc[h.role_id].push(h);
    return acc;
  }, {});

  const result = (roles as { id: number; [key: string]: unknown }[]).map(role => ({
    ...role,
    highlights: highlightsByRole[role.id] ?? [],
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, company, start_date, end_date, location, description } = body;

  if (!title || !company || !start_date || !location || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const stmt = db.prepare(`
    INSERT INTO roles (title, company, start_date, end_date, location, description)
    VALUES (@title, @company, @start_date, @end_date, @location, @description)
  `);

  const result = stmt.run({ title, company, start_date, end_date: end_date || null, location, description });
  const newRole = db.prepare('SELECT * FROM roles WHERE id = ?').get(result.lastInsertRowid);

  return NextResponse.json({ ...(newRole as object), highlights: [] }, { status: 201 });
}
