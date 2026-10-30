import { getCollection, type CollectionEntry } from 'astro:content';

export type Digest = CollectionEntry<'news'>;
export type NewsItem = Digest['data']['items'][number];

const DAY = 24 * 60 * 60 * 1000;

/** 메뉴별 노출 기준 — 여기 숫자만 바꾸면 기준이 바뀝니다. */
export const RULES = {
  weeklyDays: 7,
  weeklyMinCredibility: 3,
  hotDays: 3,
  hotLimit: 15,
};

let cache: Awaited<ReturnType<typeof build>> | null = null;

async function build() {
  const digests = (await getCollection('news')).sort(
    (a, b) => b.data.generatedAt.getTime() - a.data.generatedAt.getTime(),
  );
  const latest: Digest | undefined = digests[0];
  // 기준 시각 = 마지막 수집 시각 (빌드 시점과 무관하게 일관된 결과)
  const ref = latest ? latest.data.generatedAt : new Date();

  // 같은 URL은 가장 최근 다이제스트의 값을 사용
  const byUrl = new Map<string, NewsItem>();
  for (const d of digests) for (const it of d.data.items) if (!byUrl.has(it.url)) byUrl.set(it.url, it);
  const all = [...byUrl.values()];

  const within = (it: NewsItem, days: number) => {
    const age = ref.getTime() - it.publishedAt.getTime();
    return age >= -DAY && age <= days * DAY;
  };
  const byDate = (a: NewsItem, b: NewsItem) => b.publishedAt.getTime() - a.publishedAt.getTime();
  const byHot = (a: NewsItem, b: NewsItem) => b.hotScore - a.hotScore || byDate(a, b);

  const weekly = all
    .filter((i) => i.category === 'ai' && within(i, RULES.weeklyDays) && i.credibility >= RULES.weeklyMinCredibility)
    .sort(byDate);
  const aiHot = all.filter((i) => i.category === 'ai' && within(i, RULES.hotDays)).sort(byHot).slice(0, RULES.hotLimit);
  const worldHot = all.filter((i) => i.category === 'world' && within(i, RULES.hotDays)).sort(byHot).slice(0, RULES.hotLimit);

  return { latest, ref, weekly, aiHot, worldHot };
}

export async function loadNews() {
  if (!cache) cache = await build();
  return cache;
}
