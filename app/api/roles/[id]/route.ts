import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, company, start_date, end_date, location, description } = body;

  if (!title || !company || !start_date || !location || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const stmt = db.prepare(`
    UPDATE roles
    SET title = @title, company = @company, start_date = @start_date,
        end_date = @end_date, location = @location, description = @description
    WHERE id = @id
  `);

  const result = stmt.run({ id: Number(id), title, company, start_date, end_date: end_date || null, location, description });

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  const updated = db.prepare('SELECT * FROM roles WHERE id = ?').get(Number(id));
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = db.prepare('DELETE FROM roles WHERE id = ?').run(Number(id));

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
