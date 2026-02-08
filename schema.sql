-- ==============================================
-- Database Schema برای Birthday Bot با Admin Panel + Birth Year
-- ==============================================

-- جدول کاربران (آپدیت شده با ستون‌های تولد شخصی)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  state TEXT DEFAULT 'idle',
  state_data TEXT DEFAULT '{}',
  is_blocked INTEGER DEFAULT 0,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  birth_year INTEGER,
  birth_month INTEGER,
  birth_day INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول تولدها (با ستون سال)
CREATE TABLE IF NOT EXISTS birthdays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  birth_year INTEGER,
  description TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- جدول یادآوری‌ها
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  description TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- جدول تنظیمات ربات
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول لاگ‌ها
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول آمار broadcast
CREATE TABLE IF NOT EXISTS broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  total_users INTEGER NOT NULL,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Index ها
CREATE INDEX IF NOT EXISTS idx_user_id ON birthdays(user_id);
CREATE INDEX IF NOT EXISTS idx_birth_date ON birthdays(month, day);
CREATE INDEX IF NOT EXISTS idx_birthday_year ON birthdays(birth_year);
CREATE INDEX IF NOT EXISTS idx_reminder_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_date ON reminders(month, day);
CREATE INDEX IF NOT EXISTS idx_last_activity ON users(last_activity);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created_at);

-- مقادیر پیش‌فرض تنظیمات
INSERT OR IGNORE INTO settings (key, value) VALUES ('notifications_enabled', 'true');
INSERT OR IGNORE INTO settings (key, value) VALUES ('notification_time', '9');
INSERT OR IGNORE INTO settings (key, value) VALUES ('max_birthdays_per_user', '50');
INSERT OR IGNORE INTO settings (key, value) VALUES ('min_request_interval', '1');
