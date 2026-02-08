-- ==============================================
-- Migration Script - اضافه کردن ستون‌های جدید و جداول ادمین
-- ==============================================

-- 1. اضافه کردن ستون‌های جدید به جدول users (اگر وجود نداشته باشند)
ALTER TABLE users ADD COLUMN is_blocked INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_activity DATETIME DEFAULT CURRENT_TIMESTAMP;

-- 2. ساخت جدول تنظیمات
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. ساخت جدول لاگ‌ها
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. ساخت جدول broadcasts
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

-- 5. ساخت Index ها
CREATE INDEX IF NOT EXISTS idx_user_id ON birthdays(user_id);
CREATE INDEX IF NOT EXISTS idx_birth_date ON birthdays(month, day);
CREATE INDEX IF NOT EXISTS idx_last_activity ON users(last_activity);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created_at);

-- 6. مقادیر پیش‌فرض تنظیمات
INSERT OR IGNORE INTO settings (key, value) VALUES ('notifications_enabled', 'true');
INSERT OR IGNORE INTO settings (key, value) VALUES ('notification_time', '9');
INSERT OR IGNORE INTO settings (key, value) VALUES ('max_birthdays_per_user', '50');
INSERT OR IGNORE INTO settings (key, value) VALUES ('min_request_interval', '1');

-- 7. آپدیت last_activity برای کاربران موجود (اگر NULL باشند)
UPDATE users SET last_activity = created_at WHERE last_activity IS NULL;
