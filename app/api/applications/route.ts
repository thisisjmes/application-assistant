import { NextResponse } from 'next/server';
import db from '@/lib/db';

const VALID_STATUSES = ['drafting', 'applied', 'interviewing', 'closed'];

export async function GET() {
  const applications = db.prepare(`
    SELECT * FROM applications ORDER BY created_at DESC
  `).all();

  return NextResponse.json(applications);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { company, role_title, job_description, why_company, status = 'drafting' } = body;

  if (!company || !role_title || !job_description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO applications (company, role_title, job_description, why_company, status)
    VALUES (@company, @role_title, @job_description, @why_company, @status)
  `).run({ company, role_title, job_description, why_company: why_company || null, status });

  const newApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(newApp, { status: 201 });
}
