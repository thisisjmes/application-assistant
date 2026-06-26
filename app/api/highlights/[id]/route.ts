import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const result = db.prepare(`
    UPDATE highlights SET content = ? WHERE id = ?
  `).run(content.trim(), Number(id));

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Highlight not found' }, { status: 404 });
  }

  const updated = db.prepare('SELECT * FROM highlights WHERE id = ?').get(Number(id));
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = db.prepare('DELETE FROM highlights WHERE id = ?').run(Number(id));

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Highlight not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
