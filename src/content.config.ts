import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// n8n이 매일 1개의 다이제스트 파일(src/content/news/YYYY-MM-DD.md)을 커밋합니다.
// frontmatter: 기사 목록 / 본문: 오늘의 브리핑(Gemini 작성)
const item = z.object({
  category: z.enum(['ai', 'world']),
  title: z.string(),                 // 원문 제목
  titleKo: z.string(),               // 한국어 제목
  source: z.string(),
  url: z.url(),
  publishedAt: z.coerce.date(),
  summary: z.string(),
  keyPoints: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  credibility: z.number().int().min(1).max(5), // 신뢰도 1~5
  hotScore: z.number().min(0).max(100),        // 인기도 0~100
  coverage: z.number().int().min(1).default(1), // 같은 사건을 보도한 매체 수
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    date: z.string(),
    generatedAt: z.coerce.date(),
    items: z.array(item),
  }),
});

export const collections = { news };
