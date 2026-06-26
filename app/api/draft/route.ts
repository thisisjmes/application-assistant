import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import db from '@/lib/db';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { application_id, question_id } = await request.json();
    if (!application_id || !question_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const profile = db.prepare(
      'SELECT about_positioning, voice_tone FROM profile WHERE id = 1'
    ).get() as { about_positioning: string; voice_tone: string } | undefined;

    const roles = db.prepare('SELECT * FROM roles ORDER BY start_date DESC').all() as any[];
    for (const role of roles) {
      role.highlights = db
        .prepare('SELECT content FROM highlights WHERE role_id = ?')
        .all(role.id) as { content: string }[];
    }

    const application = db
      .prepare('SELECT * FROM applications WHERE id = ?')
      .get(application_id) as any;
    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    const question = db
      .prepare('SELECT * FROM questions WHERE id = ?')
      .get(question_id) as any;
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    const styleExamples = db
      .prepare(
        `SELECT question_text, final_response FROM questions
         WHERE application_id = ? AND id != ? AND is_locked = 1 AND final_response IS NOT NULL
         LIMIT 3`
      )
      .all(application_id, question_id) as { question_text: string; final_response: string }[];

    const experienceText = roles
      .map((r: any) => {
        const period = r.end_date ? `${r.start_date} – ${r.end_date}` : `${r.start_date} – Present`;
        const highlights = r.highlights.map((h: any) => `  - ${h.content}`).join('\n');
        return [
          `${r.title} at ${r.company} (${period})${r.location ? ', ' + r.location : ''}`,
          r.description || '',
          highlights ? `Highlights:\n${highlights}` : '',
        ].filter(Boolean).join('\n');
      })
      .join('\n\n');

    const styleText =
      styleExamples.length > 0
        ? `STYLE EXAMPLES (locked answers from this application — match this voice):\n${styleExamples
            .map((e, i) => `Example ${i + 1}:\nQ: ${e.question_text}\nA: ${e.final_response}`)
            .join('\n\n')}`
        : '';

    const systemPrompt = [
      profile?.about_positioning ? `POSITIONING:\n${profile.about_positioning}` : '',
      profile?.voice_tone ? `VOICE & TONE RULES:\n${profile.voice_tone}` : '',
      'Write a direct, polished response to the application question. Output only the response — no preamble, no "here is your draft", no commentary.',
    ]
      .filter(Boolean)
      .join('\n\n');

    const userMessage = [
      `WORK EXPERIENCE:\n${experienceText}`,
      `JOB DESCRIPTION:\n${application.job_description}`,
      application.why_company ? `WHY THIS COMPANY:\n${application.why_company}` : '',
      styleText,
      `QUESTION TO ANSWER:\n${question.question_text}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const draft = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    return NextResponse.json({ draft });
  } catch (err) {
    console.error('Draft error:', err);
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 });
  }
}