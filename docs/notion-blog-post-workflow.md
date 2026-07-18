# Notion Blog Post Workflow

이 문서는 사용자가 Notion 링크와 함께 블로그 포스팅 추가를 요청했을 때 따른다.

## 원칙

- 본문은 별도 지시가 없으면 수정, 요약, 윤문, 재작성하지 않는다.
- LLM이 자동으로 판단하는 범위는 `slug`, `category`, `excerpt`, 필요 시 `date` 같은 포스트 메타데이터로 제한한다.
- 본문 변환은 Notion block 구조를 Markdown으로 옮기는 작업이다.
- 이미지, 표, 코드 블록, 인용문, 리스트 같은 구조는 가능한 한 원래 구조를 유지한다.
- 불확실한 메타데이터는 추론 근거를 확인하고, 확신이 낮으면 사용자에게 묻는다.

## 1. Notion MCP 사용 가능 여부 확인

현재 실행 중인 LLM 도구에 Notion MCP 또는 Notion connector가 있는지 먼저 확인한다.

- Codex: 사용 가능한 도구 목록에서 Notion 관련 MCP/connector를 찾는다. 지연 로딩이 필요하면 `tool_search`로 `notion`을 검색한다.
- Claude: 현재 세션의 MCP tool/resource 목록에 Notion 관련 도구가 있는지 확인한다.
- 다른 LLM: 해당 도구의 MCP/connector 목록에서 Notion 읽기 기능이 있는지 확인한다.

Notion MCP 또는 connector가 있으면 해당 도구를 사용한다. Notion MCP 또는 connector가 없으면 Notion 페이지를 읽을 방법이 없으므로 자동 생성을 진행하지 말고 사용자에게 연결 설정을 요청한다.

## 2. Notion 데이터 읽기

Notion MCP를 사용할 수 있으면 다음 데이터를 읽는다.

- 페이지 제목
- 페이지 날짜 속성, 있는 경우
- 페이지 본문 block tree
- 이미지/file block의 원본 URL 또는 다운로드 가능한 URL

MCP 없이 별도 스크립트나 수동 API 호출로 우회하지 않는다.

## 3. 메타데이터 결정

기존 포스트 형식은 다음과 같다.

```yaml
---
title: DNS
date: 2026-07-03
categories:
  - Network
excerpt: DNS에 대해서 알아보자
---
```

메타데이터 결정 규칙:

- `title`: Notion 페이지 제목을 우선 사용한다.
- `date`: Notion에 날짜 속성이 있으면 사용한다. 없으면 사용자의 요청일 또는 현재 작업일을 `YYYY-MM-DD`로 사용한다.
- `category`: 기존 `_posts`의 카테고리 이름과 대소문자를 맞춘다. 현재 주로 쓰는 값은 `Algorithm`, `DB`, `Daily`, `Git`, `Infra`, `Java`, `Network`, `OS`, `Project`, `Spring`, `Web`이다.
- `slug`: 영어 소문자 kebab-case로 만든다. 제목을 그대로 음차하지 말고 글의 핵심 주제를 짧게 표현한다. 예: `http-version`, `virtual-memory`, `refresh-token-conflict`.
- `excerpt`: 본문을 바꾸지는 않되, 포스트 목록에 표시할 한 줄 설명은 LLM이 원문을 근거로 작성할 수 있다. 기존 스타일처럼 짧은 한국어 문장으로 작성한다.

Notion에는 `Slug`, `Category`, `Excerpt` 속성이 없다는 전제로 작업한다. 이 값들은 LLM이 제목과 본문을 읽고 직접 결정한다.

## 4. Markdown 생성

생성 경로:

1. Notion MCP 또는 connector로 본문 block을 읽는다.
2. `_posts/YYYY-MM-DD-slug.md` 파일을 만든다.
3. front matter를 붙인다.
4. 본문 block을 Markdown으로 변환해 붙인다.

## 5. 이미지 처리

- 가능하면 이미지를 `assets/images/posts/<slug>/` 아래에 저장한다.
- Markdown에는 `/assets/images/posts/<slug>/<filename>` 형식의 절대 경로를 쓴다.
- 이미지 캡션이 있으면 alt text로만 반영하고 본문 문장을 새로 만들지 않는다.
- 이미지 다운로드가 불가능하면 원본 URL을 유지하고 사용자에게 알려준다.

## 6. 검증

작업 후 다음을 확인한다.

- 파일명이 `_posts/YYYY-MM-DD-slug.md` 형식인지 확인한다.
- front matter에 `title`, `date`, `categories`, `excerpt`가 있는지 확인한다.
- 본문 문장이 Notion 원문과 의도적으로 달라지지 않았는지 확인한다.
- 제목, 문단, 인용문, 목록, 이미지, 코드 블록 사이에 Markdown 블록 경계를 구분하는 빈 줄이 있는지 확인한다.
- 코드 펜스의 시작과 종료 개수가 일치하는지 확인한다.
- 코드 펜스 언어 식별자는 `java`, `yaml`, `text`처럼 공백 없는 단일 토큰을 사용한다. Notion의 `plain text`는 `text`로 변환한다.
- 이미지 Markdown이 열린 코드 펜스 안에 들어가지 않았는지 확인한다.
- 제목이나 일반 문단이 앞선 인용문 또는 목록에 의도치 않게 포함되지 않았는지 확인한다.
- `bundle exec jekyll build`로 빌드를 확인한다.
- 빌드된 각 새 포스트를 브라우저에서 직접 열고 다음 대표 구간을 시각적으로 확인한다.
  - 인용문 다음의 일반 문단과 제목
  - 중첩 목록 다음의 제목
  - 코드 블록 전후의 본문과 이미지
  - 연속 이미지와 폭이 큰 이미지
- 빌드 성공만으로 렌더링 검증을 대신하지 않는다. 깨진 범위, 잘못된 들여쓰기, 원문 그대로 노출된 이미지 Markdown이 없는지 확인한 뒤 작업을 완료한다.

최종 응답에는 생성한 파일 경로, 추론한 메타데이터, 검증 결과를 간단히 적는다.
