/**
 * StudyAbroad — แจ้งเตือนผ่าน LINE (Google Apps Script)
 * วางไฟล์นี้ใน Apps Script ของ Google Sheet ใหม่ (ส่วนขยาย › Apps Script)
 *
 * Script properties ที่ต้องตั้ง (ตั้งค่าโปรเจกต์ › Script properties):
 *   LINE_TOKEN   = Channel access token (long-lived) จาก LINE Developers › Messaging API
 *   LINE_USER_ID = Your user ID จาก LINE Developers › Basic settings (ขึ้นต้นด้วย U)
 *   SECRET       = รหัสลับที่ตั้งเอง ต้องตรงกับที่ใส่ในแอป
 *
 * จากนั้นรันฟังก์ชัน setup() หนึ่งครั้ง แล้ว Deploy เป็น Web app
 * (Execute as: Me · Who has access: Anyone) แล้วนำ URL ไปใส่ในแอป
 */

const SHEET = 'items';
const SEND_HOUR = 8; // เวลาส่งแจ้งเตือนทุกวัน (ชั่วโมงตามเขตเวลาที่แอปส่งมา)
const LEAD = {
  task:     [7, 1, 0],
  doc:      [60, 30, 7, 1, 0],
  passport: [210, 180, 90, 30, 7],
  trip:     [30, 7, 1, 0],
  end:      [60, 30, 7, 0],
  event:    [3, 0]
};
const ICON = {task:'🗓️', doc:'📄', passport:'🛂', trip:'✈️', end:'🏁', event:'📌'};

const P = () => PropertiesService.getScriptProperties();
const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out({ok:false, error:'bad json'}); }
  if (!d || d.secret !== P().getProperty('SECRET')) return out({ok:false, error:'secret'});
  if (d.action === 'test') { push('✅ StudyAbroad เชื่อม LINE สำเร็จแล้ว\nจะเตือนทุกวันเวลา ' + SEND_HOUR + ':00 เมื่อมีเรื่องที่ต้องทำ'); return out({ok:true}); }
  if (d.action === 'sync') { store(d); return out({ok:true, n:(d.items || []).length}); }
  return out({ok:false, error:'action'});
}

function doGet() { return out({ok:true, app:'StudyAbroad LINE reminder', synced:P().getProperty('SYNCED') || null}); }

function store(d) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
  sh.clear();
  const rows = [['id', 'date', 'title', 'kind']].concat((d.items || []).slice(0, 500).map(i => [String(i.id), String(i.date), String(i.title).slice(0, 200), String(i.kind)]));
  const rg = sh.getRange(1, 1, rows.length, 4);
  rg.setNumberFormat('@'); // เก็บวันที่เป็นข้อความ ไม่ให้ Sheets แปลงเอง
  rg.setValues(rows);
  P().setProperties({RATE:JSON.stringify(d.rate || null), TZ:d.tz || 'Asia/Bangkok', SYNCED:new Date().toISOString()});
}

function daily() {
  const tz = P().getProperty('TZ') || 'Asia/Bangkok';
  const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET);
  const lines = [], late = [];
  if (sh && sh.getLastRow() > 1) {
    for (const [id, date, title, kind] of sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()) {
      const left = daysBetween(today, String(date));
      if (isNaN(left)) continue;
      if ((LEAD[kind] || [0]).indexOf(left) >= 0) lines.push((ICON[kind] || '•') + ' ' + title + ' — ' + (left === 0 ? 'วันนี้' : 'อีก ' + left + ' วัน') + ' (' + date + ')');
      else if (kind === 'task' && left < 0 && (-left) % 7 === 0) late.push('⚠️ ' + title + ' — เลยกำหนด ' + (-left) + ' วัน');
    }
  }
  const rateLine = checkRate(today);
  if (rateLine) lines.push(rateLine);
  if (!lines.length && !late.length) return;
  push(['🎓 StudyAbroad · ' + today].concat(lines, late).join('\n'));
}

function checkRate(today) {
  let r; try { r = JSON.parse(P().getProperty('RATE') || 'null'); } catch (e) { r = null; }
  if (!r || !r.curr || !r.target) return '';
  if (P().getProperty('RATE_ALERTED') === today) return '';
  try {
    const d = JSON.parse(UrlFetchApp.fetch('https://open.er-api.com/v6/latest/THB', {muteHttpExceptions:true}).getContentText());
    const per = d && d.rates && d.rates[r.curr] ? 1 / d.rates[r.curr] : 0;
    if (per && per <= r.target) { P().setProperty('RATE_ALERTED', today); return '💱 1 ' + r.curr + ' = ' + per.toFixed(2) + ' บาท ถึงเรทเป้าหมาย ' + r.target + ' แล้ว'; }
  } catch (e) {}
  return '';
}

function daysBetween(a, b) {
  const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
  return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 864e5);
}

function push(text) {
  const token = P().getProperty('LINE_TOKEN'), to = P().getProperty('LINE_USER_ID');
  if (!token || !to) throw new Error('ยังไม่ได้ตั้ง LINE_TOKEN / LINE_USER_ID ใน Script properties');
  const res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method:'post', contentType:'application/json', muteHttpExceptions:true,
    headers:{Authorization:'Bearer ' + token},
    payload:JSON.stringify({to, messages:[{type:'text', text:String(text).slice(0, 4900)}]})
  });
  if (res.getResponseCode() !== 200) console.error('LINE push failed', res.getResponseCode(), res.getContentText());
}

/** รันครั้งเดียว: ตั้งให้ daily() ทำงานทุกวัน */
function setup() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'daily').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('daily').timeBased().atHour(SEND_HOUR).everyDays(1).inTimezone(P().getProperty('TZ') || 'Asia/Bangkok').create();
  if (!SpreadsheetApp.getActive().getSheetByName(SHEET)) SpreadsheetApp.getActive().insertSheet(SHEET);
  push('🔧 ตั้งค่า StudyAbroad แจ้งเตือนเรียบร้อย');
}

/** ทดสอบส่งข้อความจาก Apps Script โดยตรง */
function testLine() { push('ทดสอบจาก Apps Script ✅'); }
