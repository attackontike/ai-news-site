# AI 뉴스 브리프

매일 아침 RSS로 AI·국제 뉴스를 모으고, Gemini가 요약·평가해 Astro 정적 사이트로 보여 줍니다.

```
n8n (매일 07:00 KST)
 ├─ RSS 피드 15곳 수집 → 기간 필터·중복 제거
 ├─ Gemini: 한국어 제목/요약/핵심/태그, 신뢰도(1~5), 영향도(0~100), 같은 사건 묶기
 ├─ 인기도 계산 → src/content/news/YYYY-MM-DD.md 생성
 ├─ GitHub API로 커밋  ──▶  Vercel 자동 배포 (Astro 빌드)
 └─ Discord 웹훅으로 오늘의 브리핑 + Hot 5 알림
```

## 메뉴별 선정 기준 (`src/lib/news.ts`의 `RULES`)

| 메뉴 | 대상 | 기간 | 정렬 |
|---|---|---|---|
| AI 최근1주일 News | AI, 신뢰도 3 이상 | 7일 | 최신순, 날짜별 묶음 + 태그 필터 |
| AI Hot News | AI | 3일 | 인기도 순 상위 15 |
| 국제 Hot News | 국제 | 3일 | 인기도 순 상위 15 |

- **신뢰도** = (Gemini 판단 + 매체 기본 신뢰도 `trust`) ÷ 2
- **인기도** = Gemini 영향도×0.6 + 같은 사건 보도 매체 수 + Hacker News 포인트 + 최신성
  (RSS에는 조회수가 없어서 "여러 매체가 동시에 다뤘는가"를 핵심 인기 신호로 씁니다)

## 1. 로컬 실행

```bash
npm install
npm run dev     # http://localhost:4321
```
`src/content/news/` 의 2026-10-29, 2026-10-30 파일은 **디자인 확인용 가상 데이터**입니다. 실제 운영 전에 지우세요.

## 2. GitHub + Vercel

1. 이 폴더를 GitHub 저장소로 push
2. Vercel → Add New Project → 저장소 선택 → Framework: **Astro** (설정 변경 없이 Deploy)
3. `astro.config.mjs`의 `site`를 실제 도메인으로 수정
4. (선택) Vercel 환경변수 `PUBLIC_DISCORD_INVITE` = Discord 초대 링크 → 사이드바에 "Discord에서 알림 받기" 표시

## 3. n8n

1. Workflows → Import from File → `n8n/ai-news-workflow.json`
2. **설정** 노드에서 GitHub 아이디·저장소, 사이트 주소, Discord 웹훅 URL 입력
3. 자격 증명 연결
   - **Gemini 요약·평가**: Header Auth → Name `x-goog-api-key`, Value = [Google AI Studio](https://aistudio.google.com/apikey) API 키
   - **GitHub 기존 파일 확인 / GitHub 커밋**: GitHub API 자격 증명 (Fine-grained 토큰, 해당 저장소 *Contents: Read and write*)
4. **Discord 웹훅**: 채널 설정 → 연동 → 웹후크 → 새 웹후크 → URL 복사
5. 수동 실행으로 확인 후 워크플로 활성화 (시간대는 워크플로 설정에서 Asia/Seoul)

### 확인할 점
- **RSS 주소**: 매체 사정으로 바뀔 수 있습니다. 첫 실행 때 "RSS 읽기" 노드 출력을 보고 비어 있는 피드는 `RSS 피드 목록` 노드에서 교체하세요. 실패한 피드는 건너뛰고 계속 진행합니다.
- **Gemini 모델**: 기본값 `gemini-2.5-flash`. 더 새 모델을 쓰려면 설정 노드의 `geminiModel`만 바꾸면 됩니다.
- **같은 날 재실행**: 같은 날짜 파일을 덮어씁니다 (sha 조회 후 업데이트).
- **커밋은 하루 1번**이라 Vercel 배포도 하루 1번만 일어납니다.

## 파일 구조

```
src/
  content.config.ts      # 다이제스트 스키마
  content/news/*.md      # n8n이 매일 커밋하는 파일 (frontmatter=기사, 본문=오늘의 브리핑)
  lib/news.ts            # 메뉴별 필터·정렬 기준
  layouts/BaseLayout.astro
  components/            # Sidebar, NewsItem, HotItem, Credibility …
  pages/index.astro      # AI 최근1주일 News
  pages/hot.astro        # AI Hot News
  pages/world.astro      # 국제 Hot News
  styles/global.css      # 디자인 토큰 (라이트/다크)
n8n/ai-news-workflow.json
```

## 디자인

- 글꼴: Pretendard (한글 가독성), 본문 16px / 행간 1.7, `word-break: keep-all`로 단어 단위 줄바꿈
- 데스크톱: 왼쪽 고정 메뉴 + 본문 최대 46rem. 모바일: 상단 고정 탭
- 메뉴마다 고유 색(파랑·주황·청록)으로 현재 위치 표시, 날짜 제목은 스크롤 중에도 상단에 고정
- 기사 카드: 매체·시간·신뢰도 → 한국어 제목(원문 링크) → 원제 → 요약 → 핵심 내용(펼치기) → 태그·원문 보기
- 시스템 다크 모드 자동 지원
