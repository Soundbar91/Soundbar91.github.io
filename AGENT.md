# Agent Instructions

이 저장소는 Jekyll 기반 개인 블로그다.

## Blog Post Workflow
사용자가 Notion 링크와 함께 블로그 포스팅 추가를 요청하면 반드시 [docs/notion-blog-post-workflow.md](docs/notion-blog-post-workflow.md)를 먼저 읽고 따른다.

Notion 포스트 작업은 Markdown 파일 생성만으로 완료된 것으로 간주하지 않는다. 반드시 다음 조건을 모두 확인한다.

- 제목, 문단, 인용문, 목록, 이미지, 코드 블록 사이의 경계와 빈 줄이 올바른지 확인한다.
- 코드 펜스가 짝을 이루는지, 언어 식별자가 Jekyll에서 인식 가능한 단일 토큰인지 확인한다.
- 이미지 Markdown이 코드 블록이나 인용문 안에 의도치 않게 포함되지 않았는지 확인한다.
- `bundle exec jekyll build` 성공 후 생성된 페이지를 브라우저에서 직접 열어 레이아웃을 확인한다.
- 각 새 포스트의 인용문, 중첩 목록, 코드 블록, 이미지가 포함된 대표 구간을 시각적으로 확인한다. 빌드 성공만으로 검증을 대신하지 않는다.
