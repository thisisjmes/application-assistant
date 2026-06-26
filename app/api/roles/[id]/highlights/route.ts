import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const role = db.prepare('SELECT id FROM roles WHERE id = ?').get(Number(id));
  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  const result = db.prepare(`
    INSERT INTO highlights (role_id, content) VALUES (?, ?)
  `).run(Number(id), content.trim());

  const newHighlight = db.prepare('SELECT * FROM highlights WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(newHighlight, { status: 201 });
}
