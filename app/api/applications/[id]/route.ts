import { NextResponse } from 'next/server';
import db from '@/lib/db';

const VALID_STATUSES = ['drafting', 'applied', 'interviewing', 'closed'];

interface ApplicationRow {
  id: number;
  company: string;
  role_title: string;
  job_description: string;
  why_company: string | null;
  status: string;
  created_at: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const application = db
    .prepare('SELECT * FROM applications WHERE id = ?')
    .get(Number(id)) as ApplicationRow | undefined;

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const questions = db
    .prepare('SELECT * FROM questions WHERE application_id = ? ORDER BY created_at ASC')
    .all(Number(id));

  return NextResponse.json({ ...application, questions });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { company, role_title, job_description, why_company, status } = body;

  if (!company || !role_title || !job_description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const result = db.prepare(`
    UPDATE applications
    SET company          = @company,
        role_title       = @role_title,
        job_description  = @job_description,
        why_company      = @why_company,
        status           = @status
    WHERE id = @id
  `).run({
    id: Number(id),
    company,
    role_title,
    job_description,
    why_company: why_company || null,
    status: status || 'drafting',
  });

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(Number(id));
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = db.prepare('DELETE FROM applications WHERE id = ?').run(Number(id));

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
