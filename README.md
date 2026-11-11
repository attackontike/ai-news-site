# AI 뉴스 브리프

매일 오전 7시(KST)에 AI·국제 뉴스 RSS를 모아 Gemini가 한국어로 요약·평가하고, Astro 정적 사이트로 보여 줍니다.

| 메뉴 | 주소 | 내용 |
| --- | --- | --- |
| AI 최근1주일 News | `/` | 신뢰도 3 이상, 최근 7일 AI 기사 (날짜별, 태그 필터, 오늘의 브리핑) |
| AI Hot News | `/hot` | 최근 3일 AI 기사 인기도 상위 15건 |
| 국제 Hot News | `/world` | 최근 3일 세계 뉴스 인기도 상위 15건 |

흐름: n8n(매일 07:00) → RSS 15곳 → 링크 확인 → Gemini → `src/content/news/YYYY-MM-DD.md` 커밋 → Vercel 자동 배포 → Discord 알림

## 설치

1. GitHub에 빈 저장소 `ai-news-site`를 만들고 이 폴더를 push합니다.
2. Vercel에서 저장소를 Import합니다. 설정은 기본값 그대로 두면 됩니다 (Node 버전은 `package.json`의 `engines`, 사이트 주소는 Vercel 운영 도메인을 자동으로 씁니다).
3. n8n에서 `n8n/ai-news-workflow.json`을 Import하고 "설정" 노드의 `githubOwner`, `siteUrl`, `discordWebhookUrl`을 채웁니다.
4. 자격 증명을 연결합니다.
   - "Gemini 요약·평가": Header Auth, Name `x-goog-api-key`, Value는 Google AI Studio API 키
   - "GitHub 기존 파일 확인", "GitHub 커밋": GitHub API 자격 증명 (Fine-grained 토큰, 해당 저장소 Contents Read and write)
5. 수동 실행 후 GitHub 커밋, Vercel 배포, Discord 알림을 확인하고 워크플로를 활성화합니다.

첫 실행 전에는 사이트에 "아직 표시할 기사가 없습니다"가 보이는 것이 정상입니다.

로컬에서 보려면 Node.js 22.23.4 이상에서 `npm install`, `npm run dev` 후 `http://localhost:4321`을 엽니다.

## 링크가 항상 열리도록 하는 장치

- 기사 링크는 RSS 원문 주소를 그대로 씁니다. 상대 주소만 절대 주소로 바꾸고, http(s)가 아닌 주소는 버립니다. 중복 비교용 키는 따로 만들어 링크 자체는 건드리지 않습니다.
- "링크 확인" 노드가 모든 기사 주소를 실제로 열어 보고, 404·410·서버 오류·연결 실패인 기사는 Gemini에 보내기 전에 뺍니다. 봇을 막는 사이트(401·403·429 등)는 브라우저에서는 열리므로 살립니다. 뺀 기사는 "프롬프트 생성" 출력의 `deadLinks`에서 볼 수 있습니다.
- Gemini는 URL을 만들지 않습니다. 기사 번호로만 결과를 돌려받고 링크는 원래 값을 붙입니다. 브리핑에 링크가 섞여 오면 지웁니다.
- 사이트도 빌드할 때 웹 주소가 아닌 링크를 한 번 더 걸러 냅니다.

## 바꿀 곳

| 바꾸고 싶은 것 | 위치 |
| --- | --- |
| 기간·신뢰도·순위 개수 | `src/lib/news.ts`의 `RULES` |
| 매체, Gemini 모델, 수집 한도 | n8n "설정" 노드 |
| 수집 시각 | n8n "매일 07:00" 노드의 cron |
| 색·글꼴 | `src/styles/global.css` |

## 점수

- 신뢰도(1~5) = round((Gemini 신뢰도 + 매체 trust) / 2)
- 인기도(0~100) = 0.6 × impact + 6 × min(coverage − 1, 4) + min(HN points / 30, 10) + recency(24시간 이내 +8, 48시간 이내 +4)
- 기준 시각은 빌드 시각이 아니라 마지막 수집 시각(`generatedAt`)입니다.
