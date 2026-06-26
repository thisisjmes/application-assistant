import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS profile (
    id          INTEGER PRIMARY KEY DEFAULT 1,
    about_positioning TEXT,
    voice_tone  TEXT,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS roles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    company     TEXT NOT NULL,
    start_date  TEXT NOT NULL,
    end_date    TEXT,
    location    TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS highlights (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id     INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    company         TEXT NOT NULL,
    role_title      TEXT NOT NULL,
    job_description TEXT NOT NULL,
    why_company     TEXT,
    status          TEXT NOT NULL DEFAULT 'drafting'
                      CHECK (status IN ('drafting', 'applied', 'interviewing', 'closed')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id   INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    question_text    TEXT NOT NULL,
    draft_response   TEXT,
    final_response   TEXT,
    is_locked        INTEGER NOT NULL DEFAULT 0 CHECK (is_locked IN (0, 1)),
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export default db;
