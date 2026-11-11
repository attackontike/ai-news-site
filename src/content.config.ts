import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const newsItem = z.object({
  category: z.enum(['ai', 'world']),
  title: z.string(),
  titleKo: z.string(),
  source: z.string(),
  url: z.url(),
  publishedAt: z.coerce.date(),
  summary: z.string().default(''),
  keyPoints: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  credibility: z.number().int().min(1).max(5),
  hotScore: z.number().min(0).max(100).default(0),
  coverage: z.number().int().min(1).default(1),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    date: z.string(),
    generatedAt: z.coerce.date(),
    items: z.array(newsItem).default([]),
  }),
});

export const collections = { news };
