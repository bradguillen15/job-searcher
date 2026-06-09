CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  search_selector TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at DATETIME NOT NULL,
  finished_at DATETIME NULL,
  total_scraped INTEGER NOT NULL DEFAULT 0,
  total_new INTEGER NOT NULL DEFAULT 0,
  total_matched INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id INTEGER NOT NULL REFERENCES boards(id),
  keyword_id INTEGER NOT NULL REFERENCES keywords(id),
  title TEXT NOT NULL,
  company TEXT NULL,
  location TEXT NULL,
  posted_date DATETIME NULL,
  description TEXT NULL,
  url TEXT NOT NULL UNIQUE,
  score INTEGER NULL,
  match_reason TEXT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  run_id INTEGER NOT NULL REFERENCES runs(id),
  scraped_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  type TEXT NOT NULL,
  notes TEXT NULL,
  scheduled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resume (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  skill_profile TEXT NULL,
  current_company TEXT NULL,
  current_salary INTEGER NULL,
  target_salary INTEGER NULL,
  search_mode TEXT NULL,
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
