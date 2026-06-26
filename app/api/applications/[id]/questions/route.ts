import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { question_text } = body;

  if (!question_text) {
    return NextResponse.json({ error: 'question_text is required' }, { status: 400 });
  }

  const application = db
    .prepare('SELECT id FROM applications WHERE id = ?')
    .get(Number(id));

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const result = db.prepare(`
    INSERT INTO questions (application_id, question_text)
    VALUES (@application_id, @question_text)
  `).run({ application_id: Number(id), question_text });

  const newQuestion = db.prepare('SELECT * FROM questions WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(newQuestion, { status: 201 });
}
