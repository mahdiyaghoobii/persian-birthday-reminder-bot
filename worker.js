// Birthday Bot with Admin Panel + User Search + Force Join + Birth Year + Persian Numbers
const TELEGRAM_API = 'https://api.telegram.org/bot';
const ADMIN_USER_IDS = [1131070204]; // جایگزین کنید!
const FORCE_JOIN_CHANNEL = '@yakooza'; // مثلاً: '@your_channel' یا null
const FORCE_JOIN_ENABLED = true; // true/false
const MESSAGE_EFFECTS = {
  CELEBRATION: "5046509860389126442",
  FIRE: "5104841245755180586",
  HEART: "5044134455711629726",
  LIKE: "5107584321108051014",
  PARTY: "5046509860389126442",
};
const PERSIAN_MONTHS = [
  { name: "فروردین", days: 31 },
  { name: "اردیبهشت", days: 31 },
  { name: "خرداد", days: 31 },
  { name: "تیر", days: 31 },
  { name: "مرداد", days: 31 },
  { name: "شهریور", days: 31 },
  { name: "مهر", days: 30 },
  { name: "آبان", days: 30 },
  { name: "آذر", days: 30 },
  { name: "دی", days: 30 },
  { name: "بهمن", days: 30 },
  { name: "اسفند", days: 29 },
];

// ========== تبدیل اعداد فارسی به انگلیسی ==========
function convertPersianToEnglishNumbers(str) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), i.toString());
    result = result.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }
  return result;
}

// ========== محاسبه سن دقیق ==========
function calculateAge(birthYear, birthMonth, birthDay) {
  const today = getTodayJalali();
  
  let age = today.year - birthYear;
  
  // اگر ماه و روز تولد هنوز نرسیده، یک سال کم کن
  if (today.month < birthMonth || (today.month === birthMonth && today.day < birthDay)) {
    age--;
  }
  
  return age;
}

// ========== محاسبه سن دقیق با روز و ماه ==========
function calculateDetailedAge(birthYear, birthMonth, birthDay) {
  const today = getTodayJalali();
  
  let years = today.year - birthYear;
  let months = today.month - birthMonth;
  let days = today.day - birthDay;
  
  if (days < 0) {
    months--;
    const prevMonth = today.month === 1 ? 12 : today.month - 1;
    const daysInPrevMonth = PERSIAN_MONTHS[prevMonth - 1].days;
    days += daysInPrevMonth;
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  let result = '';
  if (years > 0) result += `${years} سال`;
  if (months > 0) result += `${result ? ' و ' : ''}${months} ماه`;
  if (days > 0) result += `${result ? ' و ' : ''}${days} روز`;
  
  return result || '0 روز';
}

function gregorianToJalali(g_y, g_m, g_d) {
  const g_days = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const j_months = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let gy = g_y - 1600,
    gm = g_m - 1,
    gd = g_d - 1;
  let g_day_no =
    365 * gy +
    Math.floor((gy + 3) / 4) -
    Math.floor((gy + 99) / 100) +
    Math.floor((gy + 399) / 400) +
    gd +
    g_days[gm];
  if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0))
    g_day_no++;
  let j_day_no = g_day_no - 79;
  let j_np = Math.floor(j_day_no / 12053);
  j_day_no = j_day_no % 12053;
  let jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
  j_day_no %= 1461;
  if (j_day_no >= 366) {
    jy += Math.floor((j_day_no - 1) / 365);
    j_day_no = (j_day_no - 1) % 365;
  }
  let jm = 0;
  for (let i = 0; i < 11 && j_day_no >= j_months[i]; i++) {
    j_day_no -= j_months[i];
    jm++;
  }
  return { year: jy, month: jm + 1, day: j_day_no + 1 };
}

function jalaliToGregorian(j_y, j_m, j_d) {
  const j_months = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let jy = j_y - 979,
    jm = j_m - 1,
    jd = j_d - 1;
  let j_day_no =
    365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4);
  for (let i = 0; i < jm; i++) j_day_no += j_months[i];
  j_day_no += jd;
  let g_day_no = j_day_no + 79;
  let gy = 1600 + 400 * Math.floor(g_day_no / 146097);
  g_day_no = g_day_no % 146097;
  let leap = true;
  if (g_day_no >= 36525) {
    g_day_no--;
    gy += 100 * Math.floor(g_day_no / 36524);
    g_day_no = g_day_no % 36524;
    if (g_day_no >= 365) g_day_no++;
    else leap = false;
  }
  gy += 4 * Math.floor(g_day_no / 1461);
  g_day_no %= 1461;
  if (g_day_no >= 366) {
    leap = false;
    g_day_no--;
    gy += Math.floor(g_day_no / 365);
    g_day_no = g_day_no % 365;
  }
  const g_months = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (let i = 0; i < 12 && g_day_no >= g_months[i]; i++) {
    g_day_no -= g_months[i];
    gm++;
  }
  return { year: gy, month: gm + 1, day: g_day_no + 1 };
}

function getTodayJalali() {
  const now = new Date();
  return gregorianToJalali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
}

function getDaysUntilBirthday(birthMonth, birthDay) {
  const today = getTodayJalali();
  const currentYear = today.year;
  let birthdayThisYear = jalaliToGregorian(currentYear, birthMonth, birthDay);
  let todayGregorian = jalaliToGregorian(today.year, today.month, today.day);
  let birthday = new Date(
    birthdayThisYear.year,
    birthdayThisYear.month - 1,
    birthdayThisYear.day
  );
  let todayDate = new Date(
    todayGregorian.year,
    todayGregorian.month - 1,
    todayGregorian.day
  );
  let diff = Math.floor((birthday - todayDate) / (1000 * 60 * 60 * 24));
  if (diff < 0) {
    birthdayThisYear = jalaliToGregorian(currentYear + 1, birthMonth, birthDay);
    birthday = new Date(
      birthdayThisYear.year,
      birthdayThisYear.month - 1,
      birthdayThisYear.day
    );
    diff = Math.floor((birthday - todayDate) / (1000 * 60 * 60 * 24));
  }
  return diff;
}

function isAdmin(userId) {
  return ADMIN_USER_IDS.includes(userId);
}

// Check if user is member of required channel
async function isChannelMember(env, userId) {
  if (!FORCE_JOIN_ENABLED || !FORCE_JOIN_CHANNEL) return true;
  
  try {
    const url = `${TELEGRAM_API}${env.BOT_TOKEN}/getChatMember?chat_id=${FORCE_JOIN_CHANNEL}&user_id=${userId}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.ok) {
      const status = result.result.status;
      return ['creator', 'administrator', 'member'].includes(status);
    }
    
    console.error('getChatMember failed:', result);
    return false;
  } catch (e) {
    console.error('Channel check error:', e);
    return false;
  }
}

function getForceJoinKeyboard() {
  if (!FORCE_JOIN_CHANNEL) return null;
  
  const channelUsername = FORCE_JOIN_CHANNEL.replace('@', '');
  
  return {
    inline_keyboard: [
      [{ 
        text: '✅ عضویت در کانال', 
        url: `https://t.me/${channelUsername}` 
      }],
      [{ 
        text: '🔄 عضو شدم، بررسی کن', 
        callback_data: 'check_membership' 
      }]
    ]
  };
}

async function logEvent(env, level, message, userId = null) {
  try {
    await env.DB.prepare(
      "INSERT INTO logs (level, message, user_id) VALUES (?, ?, ?)"
    )
      .bind(level, message, userId)
      .run();
  } catch (e) {}
}

async function getUser(env, userId) {
  return await env.DB.prepare("SELECT * FROM users WHERE user_id = ?")
    .bind(userId)
    .first();
}

async function createUser(env, userId) {
  await env.DB.prepare(
    "INSERT OR IGNORE INTO users (user_id, state, state_data) VALUES (?, ?, ?)"
  )
    .bind(userId, "idle", "{}")
    .run();
  await logEvent(env, "info", `کاربر جدید`, userId);
}

async function updateUserState(env, userId, state, stateData = {}) {
  await env.DB.prepare(
    "UPDATE users SET state = ?, state_data = ?, last_activity = CURRENT_TIMESTAMP WHERE user_id = ?"
  )
    .bind(state, JSON.stringify(stateData), userId)
    .run();
}

async function saveBirthday(env, userId, name, month, day, description, birthYear = null) {
  await env.DB.prepare(
    "INSERT INTO birthdays (user_id, name, month, day, description, birth_year) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(userId, name, month, day, description || "", birthYear)
    .run();
  await logEvent(env, "info", `تولد ثبت: ${name}`, userId);
}

async function saveUserBirthday(env, userId, year, month, day) {
  await env.DB.prepare(
    "UPDATE users SET birth_year = ?, birth_month = ?, birth_day = ? WHERE user_id = ?"
  )
    .bind(year, month, day, userId)
    .run();
  await logEvent(env, "info", `تولد شخصی ثبت شد`, userId);
}

async function getBirthdays(env, userId, limit = 1000, offset = 0) {
  const result = await env.DB.prepare(
    `SELECT * FROM birthdays WHERE user_id = ? LIMIT ? OFFSET ?`
  ).bind(userId, limit, offset).all();
  return result.results;
}

async function getBirthdaysCount(env, userId) {
  const result = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM birthdays WHERE user_id = ?"
  )
    .bind(userId)
    .first();
  return result.count;
}

async function getBirthdayById(env, birthdayId) {
  return await env.DB.prepare("SELECT * FROM birthdays WHERE id = ?")
    .bind(birthdayId)
    .first();
}

async function updateBirthday(env, birthdayId, field, value) {
  const allowedFields = ["name", "month", "day", "description", "birth_year"];
  if (!allowedFields.includes(field)) return;
  await env.DB.prepare(`UPDATE birthdays SET ${field} = ? WHERE id = ?`)
    .bind(value, birthdayId)
    .run();
}

async function deleteBirthday(env, birthdayId) {
  await env.DB.prepare("DELETE FROM birthdays WHERE id = ?")
    .bind(birthdayId)
    .run();
}

async function getAllUpcomingBirthdays(env) {
  const result = await env.DB.prepare(
    "SELECT * FROM birthdays ORDER BY month, day"
  ).all();
  return result.results;
}

// ========== Reminder Functions ==========
async function saveReminder(env, userId, name, month, day, description) {
  await env.DB.prepare(
    "INSERT INTO reminders (user_id, name, month, day, description) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(userId, name, month, day, description || "")
    .run();
  await logEvent(env, "info", `یادآوری ثبت: ${name}`, userId);
}

async function getReminders(env, userId, limit = 1000, offset = 0) {
  const result = await env.DB.prepare(
    `SELECT * FROM reminders WHERE user_id = ? LIMIT ? OFFSET ?`
  ).bind(userId, limit, offset).all();
  return result.results;
}

async function getRemindersCount(env, userId) {
  const result = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM reminders WHERE user_id = ?"
  )
    .bind(userId)
    .first();
  return result.count;
}

async function getReminderById(env, reminderId) {
  return await env.DB.prepare("SELECT * FROM reminders WHERE id = ?")
    .bind(reminderId)
    .first();
}

async function updateReminder(env, reminderId, field, value) {
  const allowedFields = ["name", "month", "day", "description"];
  if (!allowedFields.includes(field)) return;
  await env.DB.prepare(`UPDATE reminders SET ${field} = ? WHERE id = ?`)
    .bind(value, reminderId)
    .run();
}

async function deleteReminder(env, reminderId) {
  await env.DB.prepare("DELETE FROM reminders WHERE id = ?")
    .bind(reminderId)
    .run();
}

async function getAllUpcomingReminders(env) {
  const result = await env.DB.prepare(
    "SELECT * FROM reminders ORDER BY month, day"
  ).all();
  return result.results;
}

// ========== Admin Functions ==========
async function getAllUsers(env) {
  const result = await env.DB.prepare(
    "SELECT user_id, created_at, last_activity, is_blocked FROM users ORDER BY created_at DESC"
  ).all();
  return result.results;
}

async function getUsersCount(env) {
  const result = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first();
  return result.count;
}

async function getActiveUsersCount(env, days = 7) {
  const result = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM users WHERE last_activity >= datetime('now', '-' || ? || ' days')"
  )
    .bind(days)
    .first();
  return result.count;
}

async function blockUser(env, userId) {
  await env.DB.prepare("UPDATE users SET is_blocked = 1 WHERE user_id = ?")
    .bind(userId)
    .run();
  await logEvent(env, "warn", `کاربر مسدود شد`, userId);
}

async function unblockUser(env, userId) {
  await env.DB.prepare("UPDATE users SET is_blocked = 0 WHERE user_id = ?")
    .bind(userId)
    .run();
  await logEvent(env, "info", `کاربر رفع مسدودی شد`, userId);
}

async function searchUsers(env, searchTerm) {
  const result = await env.DB.prepare(
    "SELECT DISTINCT u.* FROM users u LEFT JOIN birthdays b ON u.user_id = b.user_id WHERE CAST(u.user_id AS TEXT) LIKE ? OR b.name LIKE ? LIMIT 50"
  )
    .bind(`%${searchTerm}%`, `%${searchTerm}%`)
    .all();
  return result.results;
}

async function sendMessage(env, chatId, text, keyboard = null, messageEffectId = null) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
  };
  if (keyboard) payload.reply_markup = keyboard;
  if (messageEffectId) payload.message_effect_id = messageEffectId;
  
  const url = `${TELEGRAM_API}${env.BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  // اضافه کن: خواندن response body
  await response.json();
}


async function editMessage(env, chatId, messageId, text, keyboard = null) {
  const payload = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: "HTML",
  };
  if (keyboard) payload.reply_markup = keyboard;
  
  const url = `${TELEGRAM_API}${env.BOT_TOKEN}/editMessageText`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  // اضافه کن: خواندن response body
  await response.json();
}


async function deleteMessage(env, chatId, messageId) {
  const url = `${TELEGRAM_API}${env.BOT_TOKEN}/deleteMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
  });
  
  // اضافه کن: خواندن response body
  await response.json();
}


async function answerCallbackQuery(env, callbackQueryId, text = null) {
  const url = `${TELEGRAM_API}${env.BOT_TOKEN}/answerCallbackQuery`;
  const payload = { callback_query_id: callbackQueryId };
  if (text) payload.text = text;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  // اضافه کن: خواندن response body
  await response.json();
}

// ========== Keyboard Functions ==========
function getMainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "➕ اضافه کردن تولد", callback_data: "add_birthday" }],
      [{ text: "📋 لیست تولدها", callback_data: "list_birthdays" }],
      [{ text: "🔔 اضافه کردن یادآوری", callback_data: "add_reminder" }],
      [{ text: "📝 لیست یادآوری‌ها", callback_data: "list_reminders" }],
      [{ text: "👤 ثبت تولد من", callback_data: "my_birthday" }],
    ],
  };
}

function getBackToMainKeyboard() {
  return {
    inline_keyboard: [[{ text: "🏠 بازگشت به منو", callback_data: "back_to_main" }]],
  };
}

function getSkipKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "⏭ رد کردن", callback_data: "skip" }],
      [{ text: "🏠 بازگشت به منو", callback_data: "back_to_main" }]
    ],
  };
}

function getMonthsKeyboard() {
  const buttons = [];
  for (let i = 0; i < PERSIAN_MONTHS.length; i += 3) {
    const row = [];
    for (let j = i; j < i + 3 && j < PERSIAN_MONTHS.length; j++) {
      row.push({
        text: PERSIAN_MONTHS[j].name,
        callback_data: `month_${j + 1}`,
      });
    }
    buttons.push(row);
  }
  buttons.push([{ text: "🏠 بازگشت به منو", callback_data: "back_to_main" }]);
  return { inline_keyboard: buttons };
}

function getPaginationKeyboard(currentPage, totalPages, prefix) {
  const buttons = [];
  const row = [];
  
  if (currentPage > 1) {
    row.push({ text: "◀️ قبلی", callback_data: `${prefix}_page_${currentPage - 1}` });
  }
  
  row.push({ text: `${currentPage} / ${totalPages}`, callback_data: "noop" });
  
  if (currentPage < totalPages) {
    row.push({ text: "بعدی ▶️", callback_data: `${prefix}_page_${currentPage + 1}` });
  }
  
  buttons.push(row);
  buttons.push([{ text: "🏠 بازگشت به منو", callback_data: "back_to_main" }]);
  
  return { inline_keyboard: buttons };
}

// ========== Handler Functions ==========
async function handleStart(env, chatId, userId) {
  // Check force join
  const isMember = await isChannelMember(env, userId);
  if (!isMember) {
    const text = `🔒 <b>عضویت الزامی</b>\n\nبرای استفاده از ربات، ابتدا باید در کانال ما عضو شوید:\n${FORCE_JOIN_CHANNEL}\n\nبعد از عضویت، روی دکمه زیر کلیک کنید.`;
    await sendMessage(env, chatId, text, getForceJoinKeyboard());
    return;
  }

  let user = await getUser(env, userId);
  if (!user) await createUser(env, userId);
  
  const text = `🎉 <b>خوش آمدید!</b>\n\nمن یک ربات یادآوری تولد هستم که به شما کمک می‌کنم تا تولد عزیزانتان را فراموش نکنید.\n\n🌟 <b>امکانات:</b>\n• ثبت تولد دوستان و آشنایان\n• یادآوری 7 روز، 1 روز و در روز تولد\n• ثبت یادآوری‌های دیگر\n• محاسبه سن دقیق\n\nیک گزینه را انتخاب کنید:`;
  
  await sendMessage(env, chatId, text, getMainMenuKeyboard());
}

async function handleMyBirthday(env, chatId, userId, messageId = null) {
  const user = await getUser(env, userId);
  
  if (user.birth_year && user.birth_month && user.birth_day) {
    // نمایش اطلاعات تولد فعلی
    const monthName = PERSIAN_MONTHS[user.birth_month - 1].name;
    const age = calculateAge(user.birth_year, user.birth_month, user.birth_day);
    const detailedAge = calculateDetailedAge(user.birth_year, user.birth_month, user.birth_day);
    const daysUntil = getDaysUntilBirthday(user.birth_month, user.birth_day);
    
    let text = `👤 <b>اطلاعات تولد شما</b>\n\n`;
    text += `📅 تاریخ تولد: ${user.birth_day} ${monthName} ${user.birth_year}\n`;
    text += `🎂 سن شما: ${age} سال\n`;
    text += `⏳ سن دقیق: ${detailedAge}\n\n`;
    
    if (daysUntil === 0) {
      text += `🎉 <b>امروز تولد شماست!</b>\n\nتولدت مبارک! 🎊`;
    } else if (daysUntil === 1) {
      text += `🎈 <b>فردا تولد شماست!</b>`;
    } else {
      text += `⏰ ${daysUntil} روز تا تولد شما باقی مانده`;
    }
    
    const keyboard = {
      inline_keyboard: [
        [{ text: "✏️ ویرایش تولد من", callback_data: "edit_my_birthday" }],
        [{ text: "🏠 بازگشت به منو", callback_data: "back_to_main" }]
      ]
    };
    
    if (messageId) {
      await editMessage(env, chatId, messageId, text, keyboard);
    } else {
      await sendMessage(env, chatId, text, keyboard);
    }
  } else {
    // شروع فرآیند ثبت تولد
    const text = `👤 <b>ثبت تولد شما</b>\n\nلطفاً سال تولد خود را وارد کنید:\n\n<i>مثال: 1370</i>`;
    
    if (messageId) {
      await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
    } else {
      await sendMessage(env, chatId, text, getBackToMainKeyboard());
    }
    
    await updateUserState(env, userId, "waiting_my_birth_year", {});
  }
}

async function handleTextMessage(env, chatId, userId, messageId, text) {
  // Convert Persian/Arabic numbers to English
  text = convertPersianToEnglishNumbers(text.trim());
  
  const user = await getUser(env, userId);
  if (!user) {
    await createUser(env, userId);
    return;
  }

  // Check if user is blocked
  if (user.is_blocked) {
    await sendMessage(
      env,
      chatId,
      "⛔️ شما از استفاده از این ربات محروم شده‌اید."
    );
    return;
  }

  const stateData = JSON.parse(user.state_data || "{}");

  // ========== ثبت تولد شخصی ==========
  if (user.state === "waiting_my_birth_year") {
    const year = parseInt(text);
    if (!year || year < 1300 || year > getTodayJalali().year) {
      await sendMessage(
        env,
        chatId,
        "❌ سال نامعتبر است. لطفاً یک سال معتبر شمسی وارد کنید (مثلاً 1370).",
        getBackToMainKeyboard()
      );
      return;
    }
    
    stateData.year = year;
    await updateUserState(env, userId, "waiting_my_birth_month", stateData);
    await sendMessage(
      env,
      chatId,
      "📅 <b>انتخاب ماه تولد</b>\n\nماه تولد خود را انتخاب کنید:",
      getMonthsKeyboard()
    );
    return;
  }

  if (user.state === "waiting_my_birth_day") {
    const day = parseInt(text);
    const maxDays = PERSIAN_MONTHS[stateData.month - 1].days;
    
    if (!day || day < 1 || day > maxDays) {
      await sendMessage(
        env,
        chatId,
        `❌ روز نامعتبر است. لطفاً عددی بین 1 تا ${maxDays} وارد کنید.`,
        getBackToMainKeyboard()
      );
      return;
    }
    
    await saveUserBirthday(env, userId, stateData.year, stateData.month, day);
    await updateUserState(env, userId, "idle", {});
    
    const monthName = PERSIAN_MONTHS[stateData.month - 1].name;
    const age = calculateAge(stateData.year, stateData.month, day);
    const detailedAge = calculateDetailedAge(stateData.year, stateData.month, day);
    
    let successText = `✅ <b>تولد شما ثبت شد!</b>\n\n`;
    successText += `📅 تاریخ تولد: ${day} ${monthName} ${stateData.year}\n`;
    successText += `🎂 سن شما: ${age} سال\n`;
    successText += `⏳ سن دقیق: ${detailedAge}\n`;
    
    await sendMessage(env, chatId, successText, getMainMenuKeyboard(), MESSAGE_EFFECTS.CELEBRATION);
    return;
  }

  // ========== اضافه کردن تولد ==========
  if (user.state === "waiting_name") {
    if (text.length > 100) {
      await sendMessage(
        env,
        chatId,
        "❌ نام بیش از حد طولانی است. حداکثر 100 کاراکتر.",
        getBackToMainKeyboard()
      );
      return;
    }
    stateData.name = text;
    await updateUserState(env, userId, "waiting_month", stateData);
    await sendMessage(
      env,
      chatId,
      "📅 <b>انتخاب ماه</b>\n\nماه تولد را انتخاب کنید:",
      getMonthsKeyboard()
    );
    return;
  }

  if (user.state === "waiting_day") {
    const day = parseInt(text);
    const maxDays = PERSIAN_MONTHS[stateData.month - 1].days;
    if (!day || day < 1 || day > maxDays) {
      await sendMessage(
        env,
        chatId,
        `❌ روز نامعتبر است. لطفاً عددی بین 1 تا ${maxDays} وارد کنید.`,
        getBackToMainKeyboard()
      );
      return;
    }
    stateData.day = day;
    await updateUserState(env, userId, "waiting_year", stateData);
    
    const text2 = `🎂 <b>سال تولد (اختیاری)</b>\n\nاگر می‌خواهید سن فرد در روز تولد نمایش داده شود، سال تولد را وارد کنید.\n\n<i>مثال: 1370</i>\n\nیا برای رد کردن، روی دکمه زیر کلیک کنید.`;
    await sendMessage(env, chatId, text2, getSkipKeyboard());
    return;
  }

  if (user.state === "waiting_year") {
    let birthYear = null;
    
    if (text && text !== "/skip") {
      const year = parseInt(text);
      if (!year || year < 1300 || year > getTodayJalali().year) {
        await sendMessage(
          env,
          chatId,
          "❌ سال نامعتبر است. لطفاً یک سال معتبر شمسی وارد کنید یا روی دکمه 'رد کردن' کلیک کنید.",
          getSkipKeyboard()
        );
        return;
      }
      birthYear = year;
    }
    
    stateData.birthYear = birthYear;
    await updateUserState(env, userId, "waiting_description", stateData);
    
    const text2 = `📝 <b>توضیحات (اختیاری)</b>\n\nاگر می‌خواهید توضیحاتی اضافه کنید (مثل رابطه، شماره تماس، و...)، آن را وارد کنید.\n\nیا برای رد کردن، روی دکمه زیر کلیک کنید.`;
    await sendMessage(env, chatId, text2, getSkipKeyboard());
    return;
  }

  if (user.state === "waiting_description") {
    const description = text === "/skip" ? "" : text;
    await saveBirthday(
      env,
      userId,
      stateData.name,
      stateData.month,
      stateData.day,
      description,
      stateData.birthYear
    );
    await updateUserState(env, userId, "idle", {});
    
    const monthName = PERSIAN_MONTHS[stateData.month - 1].name;
    let successText = `✅ تولد <b>${stateData.name}</b> با موفقیت ثبت شد!\n\n📅 تاریخ: ${stateData.day} ${monthName}`;
    if (stateData.birthYear) {
      successText += ` ${stateData.birthYear}`;
    }
    
    await sendMessage(
      env,
      chatId,
      successText,
      getMainMenuKeyboard(),
      MESSAGE_EFFECTS.CELEBRATION
    );
    return;
  }

  // ========== اضافه کردن یادآوری ==========
  if (user.state === "waiting_reminder_name") {
    if (text.length > 100) {
      await sendMessage(
        env,
        chatId,
        "❌ نام بیش از حد طولانی است. حداکثر 100 کاراکتر.",
        getBackToMainKeyboard()
      );
      return;
    }
    stateData.name = text;
    await updateUserState(env, userId, "waiting_reminder_month", stateData);
    await sendMessage(
      env,
      chatId,
      "📅 <b>انتخاب ماه</b>\n\nماه یادآوری را انتخاب کنید:",
      getMonthsKeyboard()
    );
    return;
  }

  if (user.state === "waiting_reminder_day") {
    const day = parseInt(text);
    const maxDays = PERSIAN_MONTHS[stateData.month - 1].days;
    if (!day || day < 1 || day > maxDays) {
      await sendMessage(
        env,
        chatId,
        `❌ روز نامعتبر است. لطفاً عددی بین 1 تا ${maxDays} وارد کنید.`,
        getBackToMainKeyboard()
      );
      return;
    }
    stateData.day = day;
    await updateUserState(env, userId, "waiting_reminder_description", stateData);
    
    const text2 = `📝 <b>توضیحات (اختیاری)</b>\n\nاگر می‌خواهید توضیحاتی اضافه کنید، آن را وارد کنید.\n\nیا برای رد کردن، روی دکمه زیر کلیک کنید.`;
    await sendMessage(env, chatId, text2, getSkipKeyboard());
    return;
  }

  if (user.state === "waiting_reminder_description") {
    const description = text === "/skip" ? "" : text;
    await saveReminder(
      env,
      userId,
      stateData.name,
      stateData.month,
      stateData.day,
      description
    );
    await updateUserState(env, userId, "idle", {});
    
    const monthName = PERSIAN_MONTHS[stateData.month - 1].name;
    await sendMessage(
      env,
      chatId,
      `✅ یادآوری <b>${stateData.name}</b> با موفقیت ثبت شد!\n\n📅 تاریخ: ${stateData.day} ${monthName}`,
      getMainMenuKeyboard(),
      MESSAGE_EFFECTS.CELEBRATION
    );
    return;
  }

  // ========== ویرایش اطلاعات تولد ==========
  if (user.state && user.state.startsWith("editing_name_")) {
    const birthdayId = parseInt(user.state.split("_")[2]);
    await updateBirthday(env, birthdayId, "name", text);
    await updateUserState(env, userId, "idle", {});
    await sendMessage(
      env,
      chatId,
      "✅ نام با موفقیت تغییر یافت.",
      getBackToMainKeyboard()
    );
    if (stateData.lastMessageId) {
      setTimeout(async () => {
        await handleViewBirthday(env, chatId, userId, stateData.lastMessageId, birthdayId);
      }, 1500);
    }
    return;
  }

  if (user.state && user.state.startsWith("editing_day_")) {
    const birthdayId = parseInt(user.state.split("_")[2]);
    const birthday = await getBirthdayById(env, birthdayId);
    const day = parseInt(text);
    const maxDays = PERSIAN_MONTHS[birthday.month - 1].days;
    
    if (!day || day < 1 || day > maxDays) {
      await sendMessage(
        env,
        chatId,
        `❌ روز نامعتبر است. لطفاً عددی بین 1 تا ${maxDays} وارد کنید.`,
        getBackToMainKeyboard()
      );
      return;
    }
    
    await updateBirthday(env, birthdayId, "day", day);
    await updateUserState(env, userId, "idle", {});
    await sendMessage(
      env,
      chatId,
      "✅ روز با موفقیت تغییر یافت.",
      getBackToMainKeyboard()
    );
    if (stateData.lastMessageId) {
      setTimeout(async () => {
        await handleViewBirthday(env, chatId, userId, stateData.lastMessageId, birthdayId);
      }, 1500);
    }
    return;
  }

  if (user.state && user.state.startsWith("editing_year_")) {
    const birthdayId = parseInt(user.state.split("_")[2]);
    let birthYear = null;
    
    if (text && text !== "/skip") {
      const year = parseInt(text);
      if (!year || year < 1300 || year > getTodayJalali().year) {
        await sendMessage(
          env,
          chatId,
          "❌ سال نامعتبر است. لطفاً یک سال معتبر شمسی وارد کنید یا /skip بزنید.",
          getBackToMainKeyboard()
        );
        return;
      }
      birthYear = year;
    }
    
    await updateBirthday(env, birthdayId, "birth_year", birthYear);
    await updateUserState(env, userId, "idle", {});
    await sendMessage(
      env,
      chatId,
      "✅ سال تولد با موفقیت تغییر یافت.",
      getBackToMainKeyboard()
    );
    if (stateData.lastMessageId) {
      setTimeout(async () => {
        await handleViewBirthday(env, chatId, userId, stateData.lastMessageId, birthdayId);
      }, 1500);
    }
    return;
  }

  if (user.state && user.state.startsWith("editing_desc_")) {
    const birthdayId = parseInt(user.state.split("_")[2]);
    const description = text === "/skip" ? "" : text;
    await updateBirthday(env, birthdayId, "description", description);
    await updateUserState(env, userId, "idle", {});
    await sendMessage(
      env,
      chatId,
      "✅ توضیحات با موفقیت تغییر یافت.",
      getBackToMainKeyboard()
    );
    if (stateData.lastMessageId) {
      setTimeout(async () => {
        await handleViewBirthday(env, chatId, userId, stateData.lastMessageId, birthdayId);
      }, 1500);
    }
    return;
  }

  // ========== ویرایش یادآوری ==========
  if (user.state && user.state.startsWith("editing_reminder_name_")) {
    const reminderId = parseInt(user.state.split("_")[3]);
    await updateReminder(env, reminderId, "name", text);
    await updateUserState(env, userId, "idle", {});
    await sendMessage(
      env,
      chatId,
      "✅ نام با موفقیت تغییر یافت.",
      getBackToMainKeyboard()
    );
    if (stateData.lastMessageId) {
      setTimeout(async () => {
        await handleViewReminder(env, chatId, userId, stateData.lastMessageId, reminderId);
      }, 1500);
    }
    return;
  }

  if (user.state && user.state.startsWith("editing_reminder_day_")) {
    const reminderId = parseInt(user.state.split("_")[3]);
    const reminder = await getReminderById(env, reminderId);
    const day = parseInt(text);
    const maxDays = PERSIAN_MONTHS[reminder.month - 1].days;
    
    if (!day || day < 1 || day > maxDays) {
      await sendMessage(
        env,
        chatId,
        `❌ روز نامعتبر است. لطفاً عددی بین 1 تا ${maxDays} وارد کنید.`,
        getBackToMainKeyboard()
      );
      return;
    }
    
    await updateReminder(env, reminderId, "day", day);
    await updateUserState(env, userId, "idle", {});
    await sendMessage(
      env,
      chatId,
      "✅ روز با موفقیت تغییر یافت.",
      getBackToMainKeyboard()
    );
    if (stateData.lastMessageId) {
      setTimeout(async () => {
        await handleViewReminder(env, chatId, userId, stateData.lastMessageId, reminderId);
      }, 1500);
    }
    return;
  }

  if (user.state && user.state.startsWith("editing_reminder_desc_")) {
    const reminderId = parseInt(user.state.split("_")[3]);
    const description = text === "/skip" ? "" : text;
    await updateReminder(env, reminderId, "description", description);
    await updateUserState(env, userId, "idle", {});
    await sendMessage(
      env,
      chatId,
      "✅ توضیحات با موفقیت تغییر یافت.",
      getBackToMainKeyboard()
    );
    if (stateData.lastMessageId) {
      setTimeout(async () => {
        await handleViewReminder(env, chatId, userId, stateData.lastMessageId, reminderId);
      }, 1500);
    }
    return;
  }

  // ========== Admin Panel ==========
  if (user.state === "waiting_broadcast_message" && isAdmin(userId)) {
    stateData.broadcastMessage = text;
    await updateUserState(env, userId, "confirm_broadcast", stateData);
    
    const usersCount = await getUsersCount(env);
    const confirmText = `📢 <b>تأیید ارسال پیام همگانی</b>\n\n<b>پیام:</b>\n${text}\n\n<b>تعداد کاربران:</b> ${usersCount}\n\nآیا مطمئن هستید؟`;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ بله، ارسال شود", callback_data: "send_broadcast" },
          { text: "❌ لغو", callback_data: "cancel_broadcast" }
        ]
      ]
    };
    
    await sendMessage(env, chatId, confirmText, keyboard);
    return;
  }

  if (user.state === "waiting_user_search" && isAdmin(userId)) {
    const users = await searchUsers(env, text);
    
    if (users.length === 0) {
      await sendMessage(
        env,
        chatId,
        "❌ کاربری یافت نشد.",
        getBackToMainKeyboard()
      );
      await updateUserState(env, userId, "idle", {});
      return;
    }
    
    let resultText = `🔍 <b>نتایج جستجو</b>\n\nتعداد: ${users.length}\n\n`;
    
    for (const u of users.slice(0, 20)) {
      resultText += `👤 ${u.user_id}${u.is_blocked ? " 🔒" : ""}\n`;
      resultText += `📅 عضویت: ${new Date(u.created_at).toLocaleDateString("fa-IR")}\n`;
      resultText += `────────\n`;
    }
    
    if (users.length > 20) {
      resultText += `\n... و ${users.length - 20} کاربر دیگر`;
    }
    
    await sendMessage(env, chatId, resultText, getBackToMainKeyboard());
    await updateUserState(env, userId, "idle", {});
    return;
  }

  // اگر در حالت idle باشد و پیام تصادفی بفرستد
  await sendMessage(
    env,
    chatId,
    "لطفاً از منوی اصلی یک گزینه را انتخاب کنید یا /start بزنید.",
    getMainMenuKeyboard()
  );
}

async function handleListBirthdays(env, chatId, userId, messageId = null, page = 1) {
  const itemsPerPage = 10;

  // همه تولدهای کاربر
  const allBirthdays = await getBirthdays(env, userId, 1000, 0);
  const totalCount = allBirthdays.length;

  if (totalCount === 0) {
    const text = "<b>هیچ تولدی ثبت نکرده‌اید!</b>";
    const keyboard = {
      inline_keyboard: [
        [{ text: "➕ افزودن تولد جدید", callback_data: "addbirthday" }],
        [{ text: "🔙 بازگشت", callback_data: "backtomain" }]
      ]
    };
    if (messageId) {
      await editMessage(env, chatId, messageId, text, keyboard);
    } else {
      await sendMessage(env, chatId, text, keyboard);
    }
    return;
  }

  // محاسبه daysUntil برای هر تولد
  const enriched = allBirthdays.map(b => ({
    ...b,
    daysUntil: getDaysUntilBirthday(b.month, b.day),
  }));

  // sort بر اساس نزدیک‌ترین تولد
  enriched.sort((a, b) => a.daysUntil - b.daysUntil);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const pageItems = enriched.slice(startIndex, startIndex + itemsPerPage);

  // فقط دکمه‌ها، بدون متن لیست
  const buttons = [];

  for (const b of pageItems) {
    const monthName = PERSIAN_MONTHS[b.month - 1].name;
    let label = `${b.name} - ${b.day} ${monthName}`;
    if (b.daysUntil === 0) {
      label += " (امروز)";
    } else if (b.daysUntil === 1) {
      label += " (۱ روز مانده)";
    } else {
      label += ` (${b.daysUntil} روز مانده)`;
    }

    buttons.push([{
      text: label,
      callback_data: `view${b.id}`
    }]);
  }

  const paginationRow = [];
  if (page > 1) {
    paginationRow.push({
      text: "⬅️ قبلی",
      callback_data: `birthdays_page_${page - 1}`,
    });
  }
  if (totalPages > 1) {
    paginationRow.push({
      text: `${page}/${totalPages}`,
      callback_data: "noop",
    });
  }
  if (page < totalPages) {
    paginationRow.push({
      text: "بعدی ➡️",
      callback_data: `birthdays_page_${page + 1}`,
    });
  }

  if (paginationRow.length > 0) {
    buttons.push(paginationRow);
  }

  buttons.push([{ text: "🔙 بازگشت", callback_data: "backtomain" }]);

  const keyboard = { inline_keyboard: buttons };

  const headerText = "<b>لیست تولد ها 🎂</b>"; // فقط عنوان کوتاه، بدون تکرار جزئیات هر مورد
  if (messageId) {
    await editMessage(env, chatId, messageId, headerText, keyboard);
  } else {
    await sendMessage(env, chatId, headerText, keyboard);
  }
}


async function handleViewBirthday(env, chatId, userId, messageId, birthdayId) {
  const birthday = await getBirthdayById(env, birthdayId);
  if (!birthday || birthday.user_id !== userId) {
    await editMessage(
      env,
      chatId,
      messageId,
      "❌ تولد یافت نشد.",
      getBackToMainKeyboard()
    );
    return;
  }
  
  const monthName = PERSIAN_MONTHS[birthday.month - 1].name;
  const daysUntil = getDaysUntilBirthday(birthday.month, birthday.day);
  
  let text = `👤 <b>${birthday.name}</b>\n\n`;
  text += `📅 تاریخ: ${birthday.day} ${monthName}`;
  if (birthday.birth_year) {
    text += ` ${birthday.birth_year}`;
    const age = calculateAge(birthday.birth_year, birthday.month, birthday.day);
    text += `\n🎂 سن: ${age} سال`;
  }
  text += `\n\n`;
  
  if (daysUntil === 0) {
    text += `🎉 <b>امروز تولدش است!</b>\n`;
  } else if (daysUntil === 1) {
    text += `🎈 فردا تولدش است\n`;
  } else {
    text += `⏰ ${daysUntil} روز تا تولد\n`;
  }
  
  if (birthday.description) {
    text += `\n📝 ${birthday.description}`;
  }
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "✏️ ویرایش", callback_data: `edit_${birthday.id}` }],
      [{ text: "🗑 حذف", callback_data: `delete_${birthday.id}` }],
      [{ text: "🔙 بازگشت به لیست", callback_data: "list_birthdays" }]
    ]
  };
  
  await editMessage(env, chatId, messageId, text, keyboard);
}

async function handleEditMenu(env, chatId, userId, messageId, birthdayId) {
  const birthday = await getBirthdayById(env, birthdayId);
  if (!birthday || birthday.user_id !== userId) {
    await editMessage(
      env,
      chatId,
      messageId,
      "❌ تولد یافت نشد.",
      getBackToMainKeyboard()
    );
    return;
  }
  
  const text = `✏️ <b>ویرایش تولد</b>\n\n👤 ${birthday.name}\n\nچه چیزی را می‌خواهید تغییر دهید؟`;
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "👤 نام", callback_data: `edit_name_${birthday.id}` }],
      [{ text: "📅 ماه", callback_data: `edit_month_${birthday.id}` }],
      [{ text: "🗓 روز", callback_data: `edit_day_${birthday.id}` }],
      [{ text: "🎂 سال تولد", callback_data: `edit_year_${birthday.id}` }],
      [{ text: "📝 توضیحات", callback_data: `edit_desc_${birthday.id}` }],
      [{ text: "🔙 بازگشت", callback_data: `view_${birthday.id}` }]
    ]
  };
  
  await editMessage(env, chatId, messageId, text, keyboard);
}

async function handleDeleteConfirm(env, chatId, userId, messageId, birthdayId) {
  const birthday = await getBirthdayById(env, birthdayId);
  if (!birthday || birthday.user_id !== userId) {
    await editMessage(
      env,
      chatId,
      messageId,
      "❌ تولد یافت نشد.",
      getBackToMainKeyboard()
    );
    return;
  }
  
  const text = `⚠️ <b>تأیید حذف</b>\n\nآیا مطمئن هستید که می‌خواهید تولد <b>${birthday.name}</b> را حذف کنید؟`;
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "✅ بله، حذف شود", callback_data: `confirm_delete_${birthday.id}` }],
      [{ text: "❌ لغو", callback_data: `view_${birthday.id}` }]
    ]
  };
  
  await editMessage(env, chatId, messageId, text, keyboard);
}

async function handleConfirmDelete(env, chatId, userId, messageId, birthdayId) {
  const birthday = await getBirthdayById(env, birthdayId);
  if (!birthday || birthday.user_id !== userId) {
    await editMessage(
      env,
      chatId,
      messageId,
      "❌ تولد یافت نشد.",
      getBackToMainKeyboard()
    );
    return;
  }
  
  await deleteBirthday(env, birthdayId);
  await logEvent(env, "info", `تولد حذف: ${birthday.name}`, userId);
  
  await editMessage(
    env,
    chatId,
    messageId,
    `✅ تولد <b>${birthday.name}</b> حذف شد.`,
    getBackToMainKeyboard()
  );
  
  setTimeout(async () => {
    await handleListBirthdays(env, chatId, userId, messageId);
  }, 1500);
}

// ========== Reminder Handlers ==========
async function handleListReminders(env, chatId, userId, messageId = null, page = 1) {
  const itemsPerPage = 10;

  // همه یادآوری‌ها
  const allReminders = await getReminders(env, userId, 1000, 0);
  const totalCount = allReminders.length;

  if (totalCount === 0) {
    const text = "<b>هیچ یادآوری‌ای ثبت نکرده‌اید!</b>";
    const keyboard = {
      inline_keyboard: [
        [{ text: "➕ افزودن یادآوری جدید", callback_data: "addreminder" }],
        [{ text: "🔙 بازگشت", callback_data: "backtomain" }]
      ]
    };
    if (messageId) {
      await editMessage(env, chatId, messageId, text, keyboard);
    } else {
      await sendMessage(env, chatId, text, keyboard);
    }
    return;
  }

  // محاسبه daysUntil برای هر یادآوری
  const enriched = allReminders.map(r => ({
    ...r,
    daysUntil: getDaysUntilBirthday(r.month, r.day),
  }));

  // sort بر اساس نزدیک‌ترین یادآوری
  enriched.sort((a, b) => a.daysUntil - b.daysUntil);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const pageItems = enriched.slice(startIndex, startIndex + itemsPerPage);

  // فقط دکمه‌ها، بدون متن لیست
  const buttons = [];

  for (const r of pageItems) {
    const monthName = PERSIAN_MONTHS[r.month - 1].name;
    let label = `${r.name} - ${r.day} ${monthName}`;
    if (r.daysUntil === 0) {
      label += " (امروز)";
    } else if (r.daysUntil === 1) {
      label += " (۱ روز مانده)";
    } else {
      label += ` (${r.daysUntil} روز مانده)`;
    }

    buttons.push([{
      text: label,
      callback_data: `viewreminder${r.id}`
    }]);
  }

  const paginationRow = [];
  if (page > 1) {
    paginationRow.push({
      text: "⬅️ قبلی",
      callback_data: `reminders_page_${page - 1}`,
    });
  }
  if (totalPages > 1) {
    paginationRow.push({
      text: `${page}/${totalPages}`,
      callback_data: "noop",
    });
  }
  if (page < totalPages) {
    paginationRow.push({
      text: "بعدی ➡️",
      callback_data: `reminders_page_${page + 1}`,
    });
  }


  buttons.push([{ text: "🔙 بازگشت", callback_data: "backtomain" }]);

  const keyboard = { inline_keyboard: buttons };

  const headerText = "<b>لیست یادآوری‌ها</b>";
  if (messageId) {
    await editMessage(env, chatId, messageId, headerText, keyboard);
  } else {
    await sendMessage(env, chatId, headerText, keyboard);
  }
}


async function handleViewReminder(env, chatId, userId, messageId, reminderId) {
  const reminder = await getReminderById(env, reminderId);
  if (!reminder || reminder.user_id !== userId) {
    await editMessage(
      env,
      chatId,
      messageId,
      "❌ یادآوری یافت نشد.",
      getBackToMainKeyboard()
    );
    return;
  }
  
  const monthName = PERSIAN_MONTHS[reminder.month - 1].name;
  const daysUntil = getDaysUntilBirthday(reminder.month, reminder.day);
  
  let text = `🔔 <b>${reminder.name}</b>\n\n`;
  text += `📅 تاریخ: ${reminder.day} ${monthName}\n\n`;
  
  if (daysUntil === 0) {
    text += `⏰ <b>امروز!</b>\n`;
  } else if (daysUntil === 1) {
    text += `⏰ فردا\n`;
  } else {
    text += `⏰ ${daysUntil} روز مانده\n`;
  }
  
  if (reminder.description) {
    text += `\n📝 ${reminder.description}`;
  }
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "✏️ ویرایش", callback_data: `edit_reminder_${reminder.id}` }],
      [{ text: "🗑 حذف", callback_data: `delete_reminder_${reminder.id}` }],
      [{ text: "🔙 بازگشت به لیست", callback_data: "list_reminders" }]
    ]
  };
  
  await editMessage(env, chatId, messageId, text, keyboard);
}

async function handleEditReminderMenu(env, chatId, userId, messageId, reminderId) {
  const reminder = await getReminderById(env, reminderId);
  if (!reminder || reminder.user_id !== userId) {
    await editMessage(
      env,
      chatId,
      messageId,
      "❌ یادآوری یافت نشد.",
      getBackToMainKeyboard()
    );
    return;
  }
  
  const text = `✏️ <b>ویرایش یادآوری</b>\n\n🔔 ${reminder.name}\n\nچه چیزی را می‌خواهید تغییر دهید؟`;
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "🔔 نام", callback_data: `edit_reminder_name_${reminder.id}` }],
      [{ text: "📅 ماه", callback_data: `edit_reminder_month_${reminder.id}` }],
      [{ text: "🗓 روز", callback_data: `edit_reminder_day_${reminder.id}` }],
      [{ text: "📝 توضیحات", callback_data: `edit_reminder_desc_${reminder.id}` }],
      [{ text: "🔙 بازگشت", callback_data: `view_reminder_${reminder.id}` }]
    ]
  };
  
  await editMessage(env, chatId, messageId, text, keyboard);
}

async function handleDeleteReminderConfirm(env, chatId, userId, messageId, reminderId) {
  const reminder = await getReminderById(env, reminderId);
  if (!reminder || reminder.user_id !== userId) {
    await editMessage(
      env,
      chatId,
      messageId,
      "❌ یادآوری یافت نشد.",
      getBackToMainKeyboard()
    );
    return;
  }
  
  const text = `⚠️ <b>تأیید حذف</b>\n\nآیا مطمئن هستید که می‌خواهید یادآوری <b>${reminder.name}</b> را حذف کنید؟`;
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "✅ بله، حذف شود", callback_data: `confirm_delete_reminder_${reminder.id}` }],
      [{ text: "❌ لغو", callback_data: `view_reminder_${reminder.id}` }]
    ]
  };
  
  await editMessage(env, chatId, messageId, text, keyboard);
}

async function handleConfirmDeleteReminder(env, chatId, userId, messageId, reminderId) {
  const reminder = await getReminderById(env, reminderId);
  if (!reminder || reminder.user_id !== userId) {
    await editMessage(
      env,
      chatId,
      messageId,
      "❌ یادآوری یافت نشد.",
      getBackToMainKeyboard()
    );
    return;
  }
  
  await deleteReminder(env, reminderId);
  await logEvent(env, "info", `یادآوری حذف: ${reminder.name}`, userId);
  
  await editMessage(
    env,
    chatId,
    messageId,
    `✅ یادآوری <b>${reminder.name}</b> حذف شد.`,
    getBackToMainKeyboard()
  );
  
  setTimeout(async () => {
    await handleListReminders(env, chatId, userId, messageId);
  }, 1500);
}

// ========== Admin Panel ==========
async function handleAdminPanel(env, chatId, messageId = null) {
  const totalUsers = await getUsersCount(env);
  const activeUsers7d = await getActiveUsersCount(env, 7);
  const activeUsers30d = await getActiveUsersCount(env, 30);
  
  const text = `👨‍💼 <b>پنل مدیریت</b>\n\n📊 <b>آمار:</b>\n👥 کل کاربران: ${totalUsers}\n🟢 فعال (7 روز): ${activeUsers7d}\n🟡 فعال (30 روز): ${activeUsers30d}\n\nیک گزینه را انتخاب کنید:`;
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "📢 ارسال پیام همگانی", callback_data: "broadcast" }],
      [{ text: "🔍 جستجوی کاربر", callback_data: "search_user" }],
      [{ text: "👥 لیست کاربران", callback_data: "list_users" }],
      [{ text: "📊 آمار کامل", callback_data: "full_stats" }],
      [{ text: "🏠 بازگشت به منو", callback_data: "back_to_main" }]
    ]
  };
  
  if (messageId) {
    await editMessage(env, chatId, messageId, text, keyboard);
  } else {
    await sendMessage(env, chatId, text, keyboard);
  }
}

async function handleCallbackQuery(env, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  
  await answerCallbackQuery(env, callbackQuery.id);
  
  // Check force join for non-admin users
  if (!isAdmin(userId)) {
    const isMember = await isChannelMember(env, userId);
    if (!isMember && data !== 'check_membership') {
      const text = `🔒 <b>عضویت الزامی</b>\n\nبرای استفاده از ربات، ابتدا باید در کانال ما عضو شوید:\n${FORCE_JOIN_CHANNEL}\n\nبعد از عضویت، روی دکمه زیر کلیک کنید.`;
      await editMessage(env, chatId, messageId, text, getForceJoinKeyboard());
      return;
    }
  }
  
  let user = await getUser(env, userId);
  if (!user) {
    await createUser(env, userId);
    user = await getUser(env, userId);
  }
  
  const stateData = JSON.parse(user.state_data || "{}");

  if (data === "check_membership") {
    const isMember = await isChannelMember(env, userId);
    if (isMember) {
      await handleStart(env, chatId, userId);
    } else {
      await answerCallbackQuery(env, callbackQuery.id, "❌ هنوز عضو نشده‌اید!");
    }
    return;
  }

  // ========== دکمه Skip ==========
  if (data === "skip") {
    // بسته به state فعلی، عمل مناسب را انجام بده
    if (user.state === "waiting_year") {
      // رد کردن سال تولد
      stateData.birthYear = null;
      await updateUserState(env, userId, "waiting_description", stateData);
      const text = `📝 <b>توضیحات (اختیاری)</b>\n\nاگر می‌خواهید توضیحاتی اضافه کنید (مثل رابطه، شماره تماس، و...)، آن را وارد کنید.\n\nیا برای رد کردن، روی دکمه زیر کلیک کنید.`;
      await editMessage(env, chatId, messageId, text, getSkipKeyboard());
      return;
    } else if (user.state === "waiting_description") {
      // رد کردن توضیحات تولد
      await saveBirthday(
        env,
        userId,
        stateData.name,
        stateData.month,
        stateData.day,
        "",
        stateData.birthYear
      );
      await updateUserState(env, userId, "idle", {});
      
      const monthName = PERSIAN_MONTHS[stateData.month - 1].name;
      let successText = `✅ تولد <b>${stateData.name}</b> با موفقیت ثبت شد!\n\n📅 تاریخ: ${stateData.day} ${monthName}`;
      if (stateData.birthYear) {
        successText += ` ${stateData.birthYear}`;
      }
      
      await editMessage(env, chatId, messageId, successText, getMainMenuKeyboard());
      return;
    } else if (user.state === "waiting_reminder_description") {
      // رد کردن توضیحات یادآوری
      await saveReminder(
        env,
        userId,
        stateData.name,
        stateData.month,
        stateData.day,
        ""
      );
      await updateUserState(env, userId, "idle", {});
      
      const monthName = PERSIAN_MONTHS[stateData.month - 1].name;
      await editMessage(
        env,
        chatId,
        messageId,
        `✅ یادآوری <b>${stateData.name}</b> با موفقیت ثبت شد!\n\n📅 تاریخ: ${stateData.day} ${monthName}`,
        getMainMenuKeyboard()
      );
      return;
    } else if (user.state && user.state.startsWith("editing_year_")) {
      // رد کردن ویرایش سال
      const birthdayId = parseInt(user.state.split("_")[2]);
      await updateBirthday(env, birthdayId, "birth_year", null);
      await updateUserState(env, userId, "idle", {});
      await editMessage(
        env,
        chatId,
        messageId,
        "✅ سال تولد حذف شد.",
        getBackToMainKeyboard()
      );
      if (stateData.lastMessageId) {
        setTimeout(async () => {
          await handleViewBirthday(env, chatId, userId, stateData.lastMessageId, birthdayId);
        }, 1500);
      }
      return;
    } else if (user.state && user.state.startsWith("editing_desc_")) {
      // رد کردن ویرایش توضیحات
      const birthdayId = parseInt(user.state.split("_")[2]);
      await updateBirthday(env, birthdayId, "description", "");
      await updateUserState(env, userId, "idle", {});
      await editMessage(
        env,
        chatId,
        messageId,
        "✅ توضیحات حذف شد.",
        getBackToMainKeyboard()
      );
      if (stateData.lastMessageId) {
        setTimeout(async () => {
          await handleViewBirthday(env, chatId, userId, stateData.lastMessageId, birthdayId);
        }, 1500);
      }
      return;
    } else if (user.state && user.state.startsWith("editing_reminder_desc_")) {
      // رد کردن ویرایش توضیحات یادآوری
      const reminderId = parseInt(user.state.split("_")[3]);
      await updateReminder(env, reminderId, "description", "");
      await updateUserState(env, userId, "idle", {});
      await editMessage(
        env,
        chatId,
        messageId,
        "✅ توضیحات حذف شد.",
        getBackToMainKeyboard()
      );
      if (stateData.lastMessageId) {
        setTimeout(async () => {
          await handleViewReminder(env, chatId, userId, stateData.lastMessageId, reminderId);
        }, 1500);
      }
      return;
    }
  }

  // ========== Main Menu ==========
  if (data === "add_birthday") {
    const text = "👤 <b>اضافه کردن تولد جدید</b>\n\nنام فرد را وارد کنید:";
    await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
    await updateUserState(env, userId, "waiting_name", {});
  } else if (data === "list_birthdays") {
    await handleListBirthdays(env, chatId, userId, messageId);
  } else if (data === "add_reminder") {
    const text = "🔔 <b>اضافه کردن یادآوری جدید</b>\n\nنام یادآوری را وارد کنید:";
    await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
    await updateUserState(env, userId, "waiting_reminder_name", {});
  } else if (data === "list_reminders") {
    await handleListReminders(env, chatId, userId, messageId);
  } else if (data === "my_birthday") {
    await handleMyBirthday(env, chatId, userId, messageId);
  } else if (data === "edit_my_birthday") {
    const text = `👤 <b>ویرایش تولد من</b>\n\nلطفاً سال تولد جدید خود را وارد کنید:\n\n<i>مثال: 1370</i>`;
    await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
    await updateUserState(env, userId, "waiting_my_birth_year", {});

  // ========== Pagination ==========
  } else if (data.startsWith("birthdays_page_")) {
    const page = parseInt(data.split("_")[2]);
    await handleListBirthdays(env, chatId, userId, messageId, page);
  } else if (data.startsWith("reminders_page_")) {
    const page = parseInt(data.split("_")[2]);
    await handleListReminders(env, chatId, userId, messageId, page);

  // ========== Reminder Actions ==========
  } else if (data.startsWith("view_reminder_")) {
    const reminderId = parseInt(data.split("_")[2]);
    await handleViewReminder(env, chatId, userId, messageId, reminderId);
  } else if (
    data.startsWith("edit_reminder_") &&
    !data.includes("_name_") &&
    !data.includes("_month_") &&
    !data.includes("_day_") &&
    !data.includes("_desc_")
  ) {
    const reminderId = parseInt(data.split("_")[2]);
    await handleEditReminderMenu(env, chatId, userId, messageId, reminderId);
  } else if (data.startsWith("edit_reminder_name_")) {
    const reminderId = parseInt(data.split("_")[3]);
    const text = "🔔 <b>تغییر نام</b>\n\nنام جدید را وارد کنید:";
    await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
    stateData.lastMessageId = messageId;
    await updateUserState(env, userId, `editing_reminder_name_${reminderId}`, stateData);
  } else if (data.startsWith("edit_reminder_month_")) {
    const reminderId = parseInt(data.split("_")[3]);
    const text = "📅 <b>تغییر ماه</b>\n\nماه جدید را انتخاب کنید:";
    await editMessage(env, chatId, messageId, text, getMonthsKeyboard());
    stateData.lastMessageId = messageId;
    await updateUserState(env, userId, `editing_reminder_month_${reminderId}`, stateData);
  } else if (data.startsWith("edit_reminder_day_")) {
    const reminderId = parseInt(data.split("_")[3]);
    const reminder = await getReminderById(env, reminderId);
    const maxDays = PERSIAN_MONTHS[reminder.month - 1].days;
    const text = `🗓 <b>تغییر روز</b>\n\nروز جدید را وارد کنید (1 تا ${maxDays}):`;
    await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
    stateData.lastMessageId = messageId;
    await updateUserState(env, userId, `editing_reminder_day_${reminderId}`, stateData);
  } else if (data.startsWith("edit_reminder_desc_")) {
    const reminderId = parseInt(data.split("_")[3]);
    const text = "📝 <b>تغییر توضیحات</b>\n\nتوضیحات جدید را وارد کنید (یا روی دکمه 'رد کردن' کلیک کنید):";
    await editMessage(env, chatId, messageId, text, getSkipKeyboard());
    stateData.lastMessageId = messageId;
    await updateUserState(env, userId, `editing_reminder_desc_${reminderId}`, stateData);
  } else if (data.startsWith("delete_reminder_")) {
    const reminderId = parseInt(data.split("_")[2]);
    await handleDeleteReminderConfirm(env, chatId, userId, messageId, reminderId);
  } else if (data.startsWith("confirm_delete_reminder_")) {
    const reminderId = parseInt(data.split("_")[3]);
    await handleConfirmDeleteReminder(env, chatId, userId, messageId, reminderId);

  } else if (data.startsWith("month_")) {
    const month = parseInt(data.split("_")[1]);
    stateData.month = month;
    const monthName = PERSIAN_MONTHS[month - 1].name;
    const maxDays = PERSIAN_MONTHS[month - 1].days;

    // ثبت تولد شخصی
    if (user.state === "waiting_my_birth_month") {
      const text = `🗓 <b>انتخاب روز تولد</b>\n\nماه: ${monthName}\n\nلطفاً روز تولد خود را وارد کنید (1 تا ${maxDays}):`;
      await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
      stateData.lastMessageId = messageId;
      await updateUserState(env, userId, "waiting_my_birth_day", stateData);
      return;
    }

    // اضافه کردن تولد (انتخاب ماه)
    if (user.state === "waiting_month") {
      const text = `🗓 <b>انتخاب روز</b>\n\nماه: ${monthName}\n\nلطفاً روز تولد را وارد کنید (1 تا ${maxDays}):`;
      await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
      stateData.lastMessageId = messageId;
      await updateUserState(env, userId, "waiting_day", stateData);
      return;
    }

    // اضافه کردن یادآوری (انتخاب ماه)
    if (user.state === "waiting_reminder_month") {
      const text = `🗓 <b>انتخاب روز</b>\n\nماه: ${monthName}\n\nلطفاً روز یادآوری را وارد کنید (1 تا ${maxDays}):`;
      await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
      stateData.lastMessageId = messageId;
      await updateUserState(env, userId, "waiting_reminder_day", stateData);
      return;
    }

    // ویرایش ماه تولد
    if (user.state && user.state.startsWith("editing_month_")) {
      const birthdayId = parseInt(user.state.split("_")[2]);
      await updateBirthday(env, birthdayId, "month", month);
      await editMessage(
        env,
        chatId,
        messageId,
        "✅ ماه با موفقیت تغییر یافت.",
        getBackToMainKeyboard()
      );
      await updateUserState(env, userId, "idle", {});
      setTimeout(async () => {
        await handleViewBirthday(env, chatId, userId, messageId, birthdayId);
      }, 1500);
      return;
    }

    // ویرایش ماه یادآوری
    if (user.state && user.state.startsWith("editing_reminder_month_")) {
      const reminderId = parseInt(user.state.split("_")[3]);
      await updateReminder(env, reminderId, "month", month);
      await editMessage(
        env,
        chatId,
        messageId,
        "✅ ماه با موفقیت تغییر یافت.",
        getBackToMainKeyboard()
      );
      await updateUserState(env, userId, "idle", {});
      setTimeout(async () => {
        await handleViewReminder(env, chatId, userId, messageId, reminderId);
      }, 1500);
      return;
    }

  } else if (data.startsWith("view_")) {
    const birthdayId = parseInt(data.split("_")[1]);
    await handleViewBirthday(env, chatId, userId, messageId, birthdayId);
  } else if (
    data.startsWith("edit_") &&
    !data.includes("_name_") &&
    !data.includes("_month_") &&
    !data.includes("_day_") &&
    !data.includes("_year_") &&
    !data.includes("_desc_")
  ) {
    const birthdayId = parseInt(data.split("_")[1]);
    await handleEditMenu(env, chatId, userId, messageId, birthdayId);
  } else if (data.startsWith("edit_name_")) {
    const birthdayId = parseInt(data.split("_")[2]);
    const text = "👤 <b>تغییر نام</b>\n\nنام جدید را وارد کنید:";
    await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
    stateData.lastMessageId = messageId;
    await updateUserState(env, userId, `editing_name_${birthdayId}`, stateData);
  } else if (data.startsWith("edit_month_")) {
    const birthdayId = parseInt(data.split("_")[2]);
    const text = "📅 <b>تغییر ماه</b>\n\nماه جدید را انتخاب کنید:";
    await editMessage(env, chatId, messageId, text, getMonthsKeyboard());
    stateData.lastMessageId = messageId;
    await updateUserState(
      env,
      userId,
      `editing_month_${birthdayId}`,
      stateData
    );
  } else if (data.startsWith("edit_day_")) {
    const birthdayId = parseInt(data.split("_")[2]);
    const birthday = await getBirthdayById(env, birthdayId);
    const maxDays = PERSIAN_MONTHS[birthday.month - 1].days;
    const text = `🗓 <b>تغییر روز</b>\n\nروز جدید را وارد کنید (1 تا ${maxDays}):`;
    await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
    stateData.lastMessageId = messageId;
    await updateUserState(env, userId, `editing_day_${birthdayId}`, stateData);
  } else if (data.startsWith("edit_year_")) {
    const birthdayId = parseInt(data.split("_")[2]);
    const text = "🎂 <b>تغییر سال تولد</b>\n\nسال جدید را وارد کنید (یا روی دکمه 'رد کردن' کلیک کنید):";
    await editMessage(env, chatId, messageId, text, getSkipKeyboard());
    stateData.lastMessageId = messageId;
    await updateUserState(env, userId, `editing_year_${birthdayId}`, stateData);
  } else if (data.startsWith("edit_desc_")) {
    const birthdayId = parseInt(data.split("_")[2]);
    const text = "📝 <b>تغییر توضیحات</b>\n\nتوضیحات جدید را وارد کنید (یا روی دکمه 'رد کردن' کلیک کنید):";
    await editMessage(env, chatId, messageId, text, getSkipKeyboard());
    stateData.lastMessageId = messageId;
    await updateUserState(env, userId, `editing_desc_${birthdayId}`, stateData);
  } else if (data.startsWith("delete_")) {
    const birthdayId = parseInt(data.split("_")[1]);
    await handleDeleteConfirm(env, chatId, userId, messageId, birthdayId);
  } else if (data.startsWith("confirm_delete_")) {
    const birthdayId = parseInt(data.split("_")[2]);
    await handleConfirmDelete(env, chatId, userId, messageId, birthdayId);
  } else if (data === "back_to_main") {
    await updateUserState(env, userId, "idle", {});
    const text = "🏠 <b>منوی اصلی</b>\n\nیک گزینه را انتخاب کنید:";
    await editMessage(env, chatId, messageId, text, getMainMenuKeyboard());
  } else if (data === "noop") {
    // Do nothing
  }
  
  // ========== Admin Panel ==========
  if (isAdmin(userId)) {
    if (data === "broadcast") {
      const text = "📢 <b>ارسال پیام همگانی</b>\n\nپیام خود را وارد کنید:";
      await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
      await updateUserState(env, userId, "waiting_broadcast_message", {});
    } else if (data === "send_broadcast") {
      if (user.state === "confirm_broadcast" && stateData.broadcastMessage) {
        const allUsers = await getAllUsers(env);
        let sent = 0;
        let failed = 0;
        
        for (const u of allUsers) {
          if (!u.is_blocked) {
            try {
              await sendMessage(env, u.user_id, stateData.broadcastMessage);
              sent++;
            } catch (e) {
              failed++;
            }
          }
        }
        
        await updateUserState(env, userId, "idle", {});
        await editMessage(
          env,
          chatId,
          messageId,
          `✅ پیام با موفقیت ارسال شد!\n\n📊 آمار:\nارسال شده: ${sent}\nشکست خورده: ${failed}`,
          getBackToMainKeyboard()
        );
        await logEvent(env, "info", `Broadcast sent: ${sent} success, ${failed} failed`, userId);
      }
    } else if (data === "cancel_broadcast") {
      await updateUserState(env, userId, "idle", {});
      await handleAdminPanel(env, chatId, messageId);
    } else if (data === "search_user") {
      const text = "🔍 <b>جستجوی کاربر</b>\n\nID کاربر یا نام تولد را وارد کنید:";
      await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
      await updateUserState(env, userId, "waiting_user_search", {});
    } else if (data === "list_users") {
    // اگر این بخش هنوز نیست، اضافه کن
    const users = await getAllUsers(env);
    let text = `👥 لیست کاربران\n\n📊 تعداد کل: ${users.length}\n\n`;
    
    for (const u of users.slice(0, 50)) {
      text += `👤 ${u.user_id}${u.is_blocked ? " 🔒" : ""}\n`;
      text += `📅 ${new Date(u.created_at).toLocaleDateString("fa-IR")}\n`;
      text += `────────\n`;
    }
    
    if (users.length > 50) {
      text += `\n... و ${users.length - 50} کاربر دیگر`;
    }
    
    await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
    } else if (data === "full_stats") {
    // ⭐ اضافه کردن handler آمار کامل
    const totalUsers = await getUsersCount(env);
    const activeUsers7d = await getActiveUsersCount(env, 7);
    const activeUsers30d = await getActiveUsersCount(env, 30);
    
    // آمار تولدها
    const allBirthdays = await getAllUpcomingBirthdays(env);
    const totalBirthdays = allBirthdays.length;
    
    // آمار یادآوری‌ها
    const allReminders = await getAllUpcomingReminders(env);
    const totalReminders = allReminders.length;
    
    // محاسبه تولدهای این ماه
    const today = getTodayJalali();
    const thisMonthBirthdays = allBirthdays.filter(b => b.month === today.month).length;
    
    let text = `📊 آمار کامل ربات\n\n`;
    text += `👥 کاربران:\n`;
    text += `• کل کاربران: ${totalUsers}\n`;
    text += `• فعال (7 روز): ${activeUsers7d}\n`;
    text += `• فعال (30 روز): ${activeUsers30d}\n\n`;
    text += `🎂 تولدها:\n`;
    text += `• کل تولدها: ${totalBirthdays}\n`;
    text += `• تولدهای این ماه: ${thisMonthBirthdays}\n\n`;
    text += `📝 یادآوری‌ها:\n`;
    text += `• کل یادآوری‌ها: ${totalReminders}\n`;
    
    await editMessage(env, chatId, messageId, text, getBackToMainKeyboard());
    }
  }
}

async function handleCron(env) {
  // ───────────── Birthdays ─────────────
  const allBirthdays = await getAllUpcomingBirthdays(env);

  for (const birthday of allBirthdays) {
    const daysUntil = getDaysUntilBirthday(birthday.month, birthday.day);

    if (daysUntil === 7 || daysUntil === 1 || daysUntil === 0) {
      const monthName = PERSIAN_MONTHS[birthday.month - 1].name;
      let text = `🎂 <b>یادآوری تولد</b>\n\n`;

      if (daysUntil === 7) {
        text += `<b>7 روز</b> دیگر تولد <b>${birthday.name}</b> است!\n\n`;
      } else if (daysUntil === 1) {
        text += `<b>فردا</b> تولد <b>${birthday.name}</b> است!\n\n`;
      } else {
        text = `🎉 <b>امروز تولد</b> <b>${birthday.name}</b> است!\n\n`;
      }

      text += `📅 تاریخ: ${birthday.day} ${monthName}`;
      if (birthday.birth_year) {
        text += ` ${birthday.birth_year}`;
        const age = calculateAge(birthday.birth_year, birthday.month, birthday.day);
        text += `\n🎂 سن: ${age} سال`;
      }
      text += `\n`;
      
      if (birthday.description) text += `\n📝 ${birthday.description}`;

      const effect =
        daysUntil === 0
          ? MESSAGE_EFFECTS.FIRE
          : daysUntil === 1
          ? MESSAGE_EFFECTS.PARTY
          : MESSAGE_EFFECTS.CELEBRATION;

      await sendMessage(env, birthday.user_id, text, null, effect);
    }
  }

  // ───────────── Reminders ─────────────
  const allReminders = await getAllUpcomingReminders(env);

  for (const reminder of allReminders) {
    const daysUntil = getDaysUntilBirthday(reminder.month, reminder.day);

    if (daysUntil === 7 || daysUntil === 1 || daysUntil === 0) {
      const monthName = PERSIAN_MONTHS[reminder.month - 1].name;

      let text = `🔔 <b>یادآوری</b>\n\n`;
      if (daysUntil === 7) {
        text += `<b>7 روز</b> دیگر موعدِ <b>${reminder.name}</b> است!\n\n`;
      } else if (daysUntil === 1) {
        text += `<b>فردا</b> موعدِ <b>${reminder.name}</b> است!\n\n`;
      } else {
        text += `⏰ <b>امروز</b> موعدِ <b>${reminder.name}</b> است!\n\n`;
      }

      text += `📅 تاریخ: ${reminder.day} ${monthName}\n`;
      if (reminder.description) text += `💬 ${reminder.description}`;

      const effect =
        daysUntil === 0
          ? MESSAGE_EFFECTS.HEART
          : daysUntil === 1
          ? MESSAGE_EFFECTS.PARTY
          : MESSAGE_EFFECTS.CELEBRATION;

      await sendMessage(env, reminder.user_id, text, null, effect);
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/webhook" && request.method === "POST") {
      try {
        const update = await request.json();
        if (update.message) {
          const message = update.message;
          const chatId = message.chat.id;
          const userId = message.from.id;
          if (message.text) {
            if (message.text === "/start")
              await handleStart(env, chatId, userId);
            else if (message.text === "/admin" && isAdmin(userId))
              await handleAdminPanel(env, chatId, null);
            else
              await handleTextMessage(
                env,
                chatId,
                userId,
                message.message_id,
                message.text
              );
          }
        } else if (update.callback_query) {
          await handleCallbackQuery(env, update.callback_query);
        }
        return new Response("OK", { status: 200 });
      } catch (error) {
        console.error("Error:", error);
        return new Response("Error", { status: 500 });
      }
    }
    return new Response("Birthday Bot - Enhanced Version", { status: 200 });
  },
  async scheduled(event, env, ctx) {
    await handleCron(env);
  },
};
