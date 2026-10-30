const TZ = 'Asia/Seoul';

export const dayKey = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

export const fmtTime = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);

const md = (d: Date) => {
  const [, m, day] = dayKey(d).split('-').map(Number);
  return `${m}월 ${day}일`;
};
/** 10월 30일 07:00 */
export const fmtDateTime = (d: Date) => `${md(d)} ${fmtTime(d)}`;
/** 10월 30일 */
export const fmtShort = md;

/** 날짜 그룹 제목: { rel: '오늘', full: '10월 30일 금요일' } */
export function dayLabel(key: string, ref: Date) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 3));
  const full = new Intl.DateTimeFormat('ko-KR', { timeZone: TZ, month: 'long', day: 'numeric', weekday: 'long' }).format(date);
  const diff = Math.round((Date.parse(dayKey(ref)) - Date.parse(key)) / 864e5);
  const rel = diff === 0 ? '오늘' : diff === 1 ? '어제' : null;
  return { full, rel };
}
