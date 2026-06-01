# ci4-board-admin

CI4 Board 관리자 프론트엔드 (SPA)

CI4 Board API 서버(`ci4-board`)의 어드민 API(`/api/admin/v1/*`)를 소비하는 React 기반 관리자 대시보드입니다.

---

## 기술 스택

| 항목 | 버전 / 라이브러리 |
|------|------------------|
| 번들러 | Vite |
| 프레임워크 | React 18 |
| 언어 | TypeScript |
| UI 컴포넌트 | Ant Design 5 |
| 상태 관리 | Zustand |
| 서버 상태 | TanStack Query v5 |
| HTTP 클라이언트 | Axios |
| 라우터 | React Router v7 |
| 드래그앤드롭 | @dnd-kit/core, @dnd-kit/sortable |
| 리치 텍스트 에디터 | TinyMCE (self-hosted) |
| 날짜 처리 | Day.js |

---

## 시작하기

### 요구 사항

- Node.js 18+
- CI4 Board API 서버 실행 중 (`http://localhost:8080`)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# TinyMCE 번들 복사 (최초 1회)
cp -r node_modules/tinymce public/tinymce

# 개발 서버 실행 (포트 5173)
npm run dev

# 프로덕션 빌드
npm run build
```

개발 서버는 `/api/*` 요청을 `http://localhost:8080`으로 프록시합니다.

---

## 인증

`POST /api/admin/v1/auth/login`으로 발급된 **Admin JWT**를 사용합니다.
`group_idx = 1` (최고관리자) 계정만 로그인할 수 있습니다.

- 토큰은 `localStorage('admin_token')`에 저장됩니다.
- Axios 인터셉터가 모든 요청에 `Authorization: Bearer {token}`을 자동으로 주입합니다.
- 401 응답 시 자동으로 `/login`으로 리다이렉트합니다.

---

## 화면 구성

사이드바는 **운영 관리**와 **CMS** 두 그룹으로 구분됩니다.

### 운영 관리

| 경로 | 화면 | API |
|------|------|-----|
| `/boards` | 게시판 관리 | `GET/PUT /api/admin/v1/boards` |
| `/members` | 회원 관리 | `GET/PUT /api/admin/v1/members` |
| `/articles` | 게시글 관리 | `GET/PUT/DELETE /api/admin/v1/articles` |
| `/setting` | 사이트 설정 | `GET/PUT /api/admin/v1/setting` |

#### 게시판 관리 (`/boards`)
- 전체 게시판 목록 조회
- 게시판별 설정 편집: 이름, 사용 여부, 댓글 허용, 페이지당 글 수
- 그룹별 권한 Checkbox: 목록 보기 / 글 보기 / 글 쓰기 / 댓글 쓰기
- PHP serialize 형식의 권한 데이터를 `phpUnserialize` 유틸로 파싱하여 표시

#### 회원 관리 (`/members`)
- 키워드(아이디·닉네임·이메일) 검색, 상태(정상/탈퇴) 필터
- 회원 수정: 그룹, 상태, 닉네임, 이메일, 비밀번호 재설정(입력 시만 변경)

#### 게시글 관리 (`/articles`)
- 게시판 필터, 키워드 검색(제목·작성자), 페이지네이션
- 제목·내용·공지 여부 수정
- 삭제(Popconfirm)

#### 사이트 설정 (`/setting`)
- 브라우저 타이틀 접미어
- 회원가입 허용/차단 Switch
- 사이트 전체 차단 on/off 및 차단 안내 문구

---

### CMS

| 경로 | 화면 | API |
|------|------|-----|
| `/cms/pages` | 페이지 관리 | `GET/POST/PUT/DELETE /api/admin/v1/cms/pages` |
| `/cms/banners` | 배너 관리 | `GET/POST/PUT/DELETE /api/admin/v1/cms/banners` |
| `/cms/popups` | 팝업 관리 | `GET/POST/PUT/DELETE /api/admin/v1/cms/popups` |
| `/cms/menus` | 메뉴 관리 | `GET/POST/PUT/DELETE /api/admin/v1/cms/menus` + `PUT /reorder` |

#### 페이지 관리 (`/cms/pages`)
- 목록: slug, 제목, 상태(임시저장/발행) 표시
- 생성/수정 Modal: slug(정규식 검증 `/^[a-z0-9-]+$/`), 제목, TinyMCE 에디터, 발행 상태 선택

#### 배너 관리 (`/cms/banners`)
- 위치(position) 필터
- 생성/수정 Modal: 위치 코드, 이미지 경로, 링크 URL, DatePicker 기간 설정(start_at/end_at), 순서, 사용 여부
- 목록에서 이미지 미리보기 (Ant Design `Image` 컴포넌트)

#### 팝업 관리 (`/cms/popups`)
- 페이지네이션, 사용 여부 필터
- 생성/수정 Modal: 제목, TinyMCE 에디터, 위치 코드, DateRangePicker 기간 설정, 사용 여부 Switch

#### 메뉴 관리 (`/cms/menus`)
- 트리 구조 렌더링 (들여쓰기로 depth 표현)
- **@dnd-kit 드래그앤드롭**으로 순서 변경 → 변경 즉시 `PUT /reorder` 일괄 저장
- 생성/수정 Modal: 상위 메뉴 Select(최상위 메뉴만 부모 후보), 메뉴명, URL, 타겟(_self/_blank), 사용 여부
- 하위 메뉴가 있는 항목 삭제 시 API 422 오류를 toast로 표시

---

## 리치 텍스트 에디터 (TinyMCE)

`src/components/RichEditor.tsx` 컴포넌트로 추상화되어 있습니다.

- 페이지·팝업 생성/수정 폼에서 사용
- TinyMCE 번들을 `public/tinymce/`에 자체 서빙 (CDN 없이 동작)
- 한국어 locale(`ko_KR`) 적용
- 지원 플러그인: 이미지, 링크, 테이블, 코드, 전체화면 등

> **XSS 처리**: 에디터 출력 HTML의 서버사이드 sanitize는 CI4 서버(`#25`)에서 처리합니다. 클라이언트는 원본 HTML을 그대로 전송합니다.

---

## 배너 위치(position) 코드 규칙

배너 생성 시 `position` 필드에 위치 코드를 입력합니다. 이 코드는 프론트엔드(`ci4-board-web`)의 `<BannerZone position="..." />`와 일치해야 합니다.

| position 코드 | 노출 위치 |
|--------------|-----------|
| `main_top` | 메인 페이지 상단 |
| `main_bottom` | 메인 페이지 하단 |
| `board_top` | 게시판 상단 |
| `sidebar` | 사이드바 |

---

## 디렉토리 구조

```
ci4-board-admin/
├── public/
│   └── tinymce/          TinyMCE 자체 서빙 번들 (node_modules에서 복사)
├── src/
│   ├── api/
│   │   ├── client.ts     Axios 인스턴스 (토큰 인터셉터, 401 처리)
│   │   ├── admin.ts      운영 관리 API (게시판·회원·게시글·설정)
│   │   └── cms.ts        CMS API (페이지·배너·팝업·메뉴)
│   ├── components/
│   │   ├── AdminLayout.tsx  사이드바 + 헤더 레이아웃
│   │   └── RichEditor.tsx   TinyMCE 래퍼 컴포넌트
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── boards/BoardsPage.tsx
│   │   ├── members/MembersPage.tsx
│   │   ├── articles/ArticlesPage.tsx
│   │   ├── setting/SettingPage.tsx
│   │   └── cms/
│   │       ├── PagesPage.tsx
│   │       ├── BannersPage.tsx
│   │       ├── PopupsPage.tsx
│   │       └── MenusPage.tsx
│   ├── store/
│   │   └── auth.ts       Zustand 토큰 상태 (localStorage 동기화)
│   ├── types/
│   │   └── index.ts      TypeScript 타입 정의
│   ├── utils/
│   │   └── phpUnserialize.ts  PHP serialize 배열 파싱 유틸
│   ├── App.tsx           라우터 + RequireAuth 가드
│   └── main.tsx          QueryClient + Ant Design ConfigProvider
└── vite.config.ts        /api/* 프록시 설정
```
