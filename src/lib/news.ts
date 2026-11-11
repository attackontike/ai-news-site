import { getCollection, type CollectionEntry } from 'astro:content';
import { kstDateKey } from './format';

/** 메뉴별 선정 기준. 숫자를 바꾸면 다음 빌드부터 반영됩니다. */
export const RULES = {
  weekly: { category: 'ai', days: 7, minCredibility: 3 },
  aiHot: { category: 'ai', days: 3, limit: 15 },
  worldHot: { category: 'world', days: 3, limit: 15 },
} as const;

export type Digest = CollectionEntry<'news'>;
export type NewsItem = Digest['data']['items'][number];
export type HotRule = typeof RULES.aiHot | typeof RULES.worldHot;

const DAY = 24 * 60 * 60 * 1000;

/** 열 수 있는 웹 주소(http/https)인지 확인 */
function isWebUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.');
  } catch {
    return false;
  }
}

export interface NewsData {
  /** 가장 최근 다이제스트 (오늘의 브리핑) */
  latest: Digest | undefined;
  /** 기준 시각: 마지막 수집 시각(generatedAt). 빌드 시각이 아님 */
  referenceTime: Date | undefined;
  weekly: NewsItem[];
  aiHot: NewsItem[];
  worldHot: NewsItem[];
}

let cache: Promise<NewsData> | undefined;

export function getNewsData(): Promise<NewsData> {
  cache ??= load();
  return cache;
}

async function load(): Promise<NewsData> {
  const digests = (await getCollection('news')).sort(
    (a, b) => b.data.generatedAt.getTime() - a.data.generatedAt.getTime(),
  );
  const latest = digests[0];
  const referenceTime = latest?.data.generatedAt;

  // 여러 날의 다이제스트를 합치고 URL 기준으로 중복 제거 (최신 다이제스트 우선)
  const seen = new Set<string>();
  const all: NewsItem[] = [];
  for (const d of digests) {
    for (const item of d.data.items) {
      if (seen.has(item.url) || !isWebUrl(item.url)) continue;
      seen.add(item.url);
      all.push(item);
    }
  }

  if (!referenceTime) return { latest, referenceTime, weekly: [], aiHot: [], worldHot: [] };

  const within = (item: NewsItem, days: number) =>
    referenceTime.getTime() - item.publishedAt.getTime() <= days * DAY;

  const weekly = all
    .filter(
      (i) =>
        i.category === RULES.weekly.category &&
        within(i, RULES.weekly.days) &&
        i.credibility >= RULES.weekly.minCredibility,
    )
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  const hot = (rule: HotRule) =>
    all
      .filter((i) => i.category === rule.category && within(i, rule.days))
      .sort((a, b) => b.hotScore - a.hotScore || b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, rule.limit);

  return { latest, referenceTime, weekly, aiHot: hot(RULES.aiHot), worldHot: hot(RULES.worldHot) };
}

/** KST 날짜별로 묶기 (최신 날짜 먼저) */
export function groupByDay(items: NewsItem[]): Array<{ key: string; items: NewsItem[] }> {
  const map = new Map<string, NewsItem[]>();
  for (const item of items) {
    const key = kstDateKey(item.publishedAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([key, items]) => ({ key, items }));
}

/** 자주 나온 태그 순 */
export function topTags(items: NewsItem[], limit = 12): string[] {
  const count = new Map<string, number>();
  for (const i of items) for (const t of i.tags) count.set(t, (count.get(t) ?? 0) + 1);
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
    .slice(0, limit)
    .map(([t]) => t);
}
