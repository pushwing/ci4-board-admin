# ci4-board-admin

CI4 Board 관리자 프론트엔드 (SPA)

CI4 Board API 서버(`ci4-board`)의 어드민 API(`/api/admin/v1/*`)를 소비하는 React 기반 관리자 대시보드입니다.

> 작성자: 웅파 (blumine@gmail.com), 불의회상 (hoksi3k@gmail.com)

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
| 리치 텍스트 에디터 | Tiptap v3 |
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

# 개발 서버 실행 (포트 5173)
npm run dev

# 프로덕션 빌드
npm run build
```

개발 서버는 `/api/*` 및 `/uploads/*` 요청을 `http://localhost:8080`으로 프록시합니다.

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
- 생성/수정 Modal: slug, 제목, Tiptap 에디터, 발행 상태 선택
- **slug 규칙**: 영문 소문자·숫자·하이픈만 허용(`/^[a-z0-9-]+$/`). 입력 필드 하단에 상세 안내 표시
  - slug가 `about`이면 프론트에서 `/pages/about`으로 접근
  - 발행 후에는 변경하지 않는 것을 권장 (기존 링크 깨짐)
  - 메뉴관리에서 URL을 `/pages/slug명`으로 연결 가능
- 상태가 **발행(1)**인 페이지만 프론트에 노출됨 (임시저장은 404)

#### 배너 관리 (`/cms/banners`)
- 목록에서 이미지 썸네일 미리보기
- 생성/수정 Modal:
  - **위치 코드**: 드롭다운으로 선택 (`main_top` / `main_bottom`)
  - **이미지**: 파일 직접 업로드 (`POST /api/v1/files/wysiwyg` 경유). 업로드 즉시 미리보기 표시
  - **사이즈 검증**: 위치 코드 선택 시 권장 사이즈 표시(1200×300px). 업로드 전 실제 이미지 사이즈 확인 후 불일치 시 확인 다이얼로그 표시
  - 링크 URL, DatePicker 기간 설정(start_at/end_at), 순서(sequence), 사용 여부

#### 팝업 관리 (`/cms/popups`)
- 목록: 제목, 위치, 기간, 사용 여부 표시 / 페이지네이션
- 생성 Modal: 제목, Tiptap 에디터, 위치 코드, DatePicker 기간 설정, 사용 여부 Switch
- 수정 Modal: 수정 버튼 클릭 시 `GET /cms/popups/:idx`로 상세 내용(에디터 본문 포함) 로드 후 폼 채움
- **팝업 위치(position)**: 자유 입력 텍스트 필드. 프론트 `PopupZone`은 현재 position 필터 없이 전체 활성 팝업을 화면 중앙 오버레이로 표시

#### 메뉴 관리 (`/cms/menus`)
- 트리 구조 렌더링 (들여쓰기로 depth 표현, 최대 2depth)
- **@dnd-kit 드래그앤드롭**으로 순서 변경 → 변경 즉시 `PUT /reorder` 일괄 저장
- **최상위 메뉴 드래그 시 하위 메뉴가 그룹으로 함께 이동** (단순 arrayMove 대신 `moveGroupWithChildren` 적용)
- 생성/수정 Modal: 상위 메뉴 Select(최상위 메뉴만 부모 후보), 메뉴명, URL, 타겟(_self/_blank), 사용 여부
- 하위 메뉴가 있는 항목 삭제 시 API 422 오류를 toast로 표시

---

## 리치 텍스트 에디터 (Tiptap)

`src/components/RichEditor.tsx` 컴포넌트로 추상화되어 있습니다.

- 게시글 관리·페이지·팝업 생성/수정 폼에서 사용
- Tiptap v3 기반 (ProseMirror), CDN 없이 npm 패키지로 동작
- 커스텀 툴바: 실행취소/다시실행, 굵게/기울임/밑줄/취소선, H1~H3, 정렬(좌·가운데·우), 불릿·번호 목록, 링크, 이미지 URL 삽입, 이미지 파일 업로드, 코드 블록
- 이미지 파일 업로드: `POST /api/v1/files/wysiwyg` (jpg·png·gif·webp, 최대 5MB)
- 코드 블록 구문 강조: `lowlight` (highlight.js 기반)
- HTML 출력 (`editor.getHTML()`)

```tsx
<RichEditor value={contents} onChange={setContents} height={400} />
```

> **XSS 처리**: 에디터 출력 HTML의 서버사이드 sanitize는 CI4 서버(`#25`)에서 처리합니다. 클라이언트는 원본 HTML을 그대로 전송합니다.

---

## 배너 위치(position) 코드 규칙

배너 생성 시 위치 코드를 드롭다운에서 선택합니다. 이 코드는 프론트엔드(`ci4-board-web`)의 `<BannerZone position="..." />`와 일치해야 합니다.

| position 코드 | 노출 위치 | 권장 사이즈 |
|--------------|-----------|-----------|
| `main_top` | 메인 페이지 상단 | 1200 × 300px |
| `main_bottom` | 메인 페이지 하단 | 1200 × 300px |

새 위치 영역이 필요하면 `BannersPage.tsx`의 `POSITION_SIZES` 객체에 항목을 추가하고, 프론트 해당 페이지에 `<BannerZone position="새코드" />`를 추가합니다.

---

## 디렉토리 구조

```
ci4-board-admin/
├── src/
│   ├── api/
│   │   ├── client.ts     Axios 인스턴스 (토큰 인터셉터, 401 처리)
│   │   ├── admin.ts      운영 관리 API (게시판·회원·게시글·설정)
│   │   └── cms.ts        CMS API (페이지·배너·팝업·메뉴)
│   ├── components/
│   │   ├── AdminLayout.tsx  사이드바 + 헤더 레이아웃
│   │   ├── RichEditor.tsx   Tiptap 래퍼 컴포넌트
│   │   └── RichEditor.css   에디터 스타일
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
