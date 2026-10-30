import { defineConfig } from 'astro/config';

// Vercel 정적 배포: 어댑터 없이 dist/ 를 그대로 배포합니다.
export default defineConfig({
  site: 'https://your-site.vercel.app',
  trailingSlash: 'never',
});
