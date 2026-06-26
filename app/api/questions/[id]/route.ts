import { NextResponse } from 'next/server';
import db from '@/lib/db';

interface QuestionRow {
  id: number;
  application_id: number;
  question_text: string;
  draft_response: string | null;
  final_response: string | null;
  is_locked: number;
  created_at: string;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const current = db
    .prepare('SELECT * FROM questions WHERE id = ?')
    .get(Number(id)) as QuestionRow | undefined;

  if (!current) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  const draft_response  = 'draft_response'  in body ? body.draft_response  : current.draft_response;
  const final_response  = 'final_response'  in body ? body.final_response  : current.final_response;
  const question_text   = 'question_text'   in body ? body.question_text   : current.question_text;
  const is_locked       = 'is_locked'       in body
    ? (body.is_locked ? 1 : 0)
    : current.is_locked;

  db.prepare(`
    UPDATE questions
    SET question_text  = @question_text,
        draft_response = @draft_response,
        final_response = @final_response,
        is_locked      = @is_locked
    WHERE id = @id
  `).run({ id: Number(id), question_text, draft_response, final_response, is_locked });

  const updated = db.prepare('SELECT * FROM questions WHERE id = ?').get(Number(id));
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = db.prepare('DELETE FROM questions WHERE id = ?').run(Number(id));

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
