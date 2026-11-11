const TZ = 'Asia/Seoul';

const partsFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function kstParts(d: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { y: p.year, m: p.month, d: p.day, hh: p.hour, mm: p.minute };
}

/** KST 기준 날짜 키: 2026-10-30 */
export function kstDateKey(d: Date): string {
  const p = kstParts(d);
  return `${p.y}-${p.m}-${p.d}`;
}

/** 10월 30일 07:00 */
export function formatDateTime(d: Date): string {
  const p = kstParts(d);
  return `${Number(p.m)}월 ${Number(p.d)}일 ${p.hh}:${p.mm}`;
}

/** 07:00 */
export function formatTime(d: Date): string {
  const p = kstParts(d);
  return `${p.hh}:${p.mm}`;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** "2026-10-30" → "10월 30일 목요일" */
export function formatDayHeading(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}월 ${d}일 ${wd}요일`;
}

/** 기준 시각과의 차이를 "3시간 전" 형식으로 */
export function formatAgo(d: Date, ref: Date): string {
  const min = Math.max(0, Math.round((ref.getTime() - d.getTime()) / 60000));
  if (min < 60) return `${min}분 전`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.round(h / 24)}일 전`;
}
