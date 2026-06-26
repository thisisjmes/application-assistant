import { NextResponse } from 'next/server';
import db from '@/lib/db';

interface ProfileRow {
  id: number;
  about_positioning: string | null;
  voice_tone: string | null;
  updated_at: string;
}

export async function GET() {
  const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get() as ProfileRow | undefined;

  if (!profile) {
    return NextResponse.json({ about_positioning: '', voice_tone: '' });
  }

  return NextResponse.json({
    about_positioning: profile.about_positioning ?? '',
    voice_tone: profile.voice_tone ?? '',
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { about_positioning, voice_tone } = body;

  db.prepare(`
    INSERT INTO profile (id, about_positioning, voice_tone, updated_at)
    VALUES (1, @about_positioning, @voice_tone, datetime('now'))
    ON CONFLICT (id) DO UPDATE SET
      about_positioning = excluded.about_positioning,
      voice_tone        = excluded.voice_tone,
      updated_at        = excluded.updated_at
  `).run({ about_positioning: about_positioning ?? '', voice_tone: voice_tone ?? '' });

  return NextResponse.json({ ok: true });
}
