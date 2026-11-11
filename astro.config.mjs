// @ts-check
import { defineConfig } from 'astro/config';

// Vercel이 빌드할 때 넣어 주는 운영 도메인을 그대로 씁니다. 따로 고칠 필요가 없습니다.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export default defineConfig({
  site: vercelHost ? `https://${vercelHost}` : 'http://localhost:4321',
});
