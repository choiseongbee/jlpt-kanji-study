# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

JLPT N2 한자 학습 웹사이트 - 일본어 능력시험(JLPT) 대비 한자 학습 웹 애플리케이션. React, TypeScript, Vite, TailwindCSS로 구축.

## 주요 명령어

```bash
# 개발
npm run dev          # 개발 서버 실행 (http://localhost:5173)

# 빌드 & 배포
npm run build        # TypeScript 컴파일 + 프로덕션 빌드
npm run preview      # 프로덕션 빌드 로컬 미리보기

# 코드 품질
npm run lint         # ESLint 실행
```

## 아키텍처 & 핵심 개념

### 재시험 로직이 포함된 학습 플로우

핵심 학습 경험은 **모두 맞출 때까지 재시험** 패턴을 구현:

1. 사용자가 한 라운드의 모든 문제를 답함
2. 시스템이 모든 답을 채점
3. 틀린 답이 있으면 해당 문제들을 새 라운드로 다시 출제
4. 모든 문제를 맞출 때까지 반복
5. 최종 결과는 각 단어의 마지막 시도만 저장 (중복 제거는 `Study.tsx:83-95`에서 처리)

**패스 버튼**: 사용자가 모르는 문제를 "패스" 버튼으로 건너뛸 수 있음 - 빈 답변을 제출하여 오답으로 채점되고, 재시험 라운드에 포함됨.

### 데이터 저장 구조

모든 사용자 데이터는 `localStorage`에 저장:

- **학습한 단어** (`jlpt_studied_words`): 학습한 단어 ID 배열
- **틀린 단어** (`jlpt_wrong_words`): 실수와 마스터 상태를 추적하는 `WrongWord` 객체 배열
- **세션** (`jlpt_sessions`): 결과를 포함한 학습 세션 전체 기록
- **진행 상황** (`jlpt_progress`): 집계 통계 (총 학습 수, 마지막 학습 날짜, 현재 레벨)
- **현재 레벨** (`jlpt_current_level`): 활성 JLPT 레벨 (N4/N3/N2/ALL)

**중요**: "학습한 단어" 목록은 *첫 라운드 문제만* 추적 (`Study.tsx:100-102` 참조). 재시험 라운드는 학습 수를 부풀리지 않기 위해 새 항목을 추가하지 않음.

### 문제 생성 전략

`questionGenerator.ts`에 구현:

- **첫 세션**: 새 단어 15개 (콜드 스타트)
- **이후 세션**: 이전에 학습한 단어 중 랜덤 10개 + 새 단어 15개
- **레벨 'ALL'**: N4, N3, N2 + 상용 한자 10세트 (총 1000단어) 결합

단어는 `src/data/`의 정적 JSON 파일에서 로드되고 localStorage 상태를 기반으로 필터링됨.

### 채점 시스템

`grader.ts`에 위치:

- 히라가나와 뜻이 **둘 다** 맞아야 단어가 정답 처리
- 문자열 정규화: 공백 제거, 뜻은 대소문자 구분 안함
- 빈 답변(패스 버튼)은 자동으로 두 검사 모두 실패
- 결과에는 세부 피드백 포함 (`hiraganaCorrect`, `meaningCorrect`, `isCorrect`)

### 서비스 레이어

세 가지 핵심 서비스가 비즈니스 로직을 처리:

1. **storageService.ts**: 모든 localStorage 작업, 데이터 가져오기/내보내기
2. **questionGenerator.ts**: 단어 선택, 셔플, 진행률 계산
3. **grader.ts**: 답변 검증 및 채점

UI 컴포넌트(pages/)는 얇게 유지 - 로직은 서비스에 위임.

## 주요 구현 세부사항

### 틀린 단어 추적

단어를 틀렸을 때:
- `wrongCount` 증가 (모든 세션에 걸친 총 실수 추적)
- `isMastered`가 `false`로 재설정
- 나중에 맞췄을 때, 단어가 `isMastered: true`로 표시됨

이를 통해 향후 기능에서 우선순위를 부여할 수 있는 "틀린 단어 풀"이 생성됨.

### 타입 시스템

타입은 도메인별로 구성:
- `types/word.ts`: 핵심 어휘 타입 (`KanjiWord`, `WrongWord`, `UserAnswer`, `AnswerResult`)
- `types/session.ts`: 학습 세션 기록
- `types/progress.ts`: 사용자 진행 상황 추적

모두 `types/index.ts` 배럴 파일을 통해 export.

### 라우팅

`App.tsx`의 간단한 React Router 설정:
- `/` - 대시보드 (통계, 레벨 선택, 학습 시작)
- `/study` - 재시험 로직이 포함된 활성 학습 세션
- `/history` - 과거 세션 결과

레벨은 `location.state`를 통해 전달되거나 `getCurrentLevel()`로 폴백.

## 데이터 파일

한자 단어 데이터는 `src/data/`에 저장:
- `kanji_n4.json`, `kanji_n3.json`, `kanji_n2.json` - JLPT 레벨 단어
- `kanji_common_1.json`부터 `kanji_common_10.json` - 상용 한자 1000단어 (각 100개)

형식: `{ id: number, kanji: string, hiragana: string, meaning: string, level: JLPTLevel }[]`

## 중요한 패턴

1. **항상 문제 셔플**: questionGenerator의 `shuffleArray()` 사용하여 순서 무작위화
2. **결과 중복 제거**: 최종 세션 결과 저장 시, 역순으로 반복하여 단어당 마지막 시도만 유지
3. **원자적 localStorage 업데이트**: 모든 스토리지 함수에서 읽기-수정-쓰기 패턴 사용
4. **입력 정규화**: 일관성을 위해 항상 grader의 정규화 사용
5. **한국어 UI 텍스트**: 모든 사용자 대면 문자열은 한국어로 작성
