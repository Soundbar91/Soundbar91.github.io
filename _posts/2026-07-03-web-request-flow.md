---
title: 웹 요청 흐름
date: 2026-07-03
categories:
  - Network
excerpt: 웹 요청부터 렌더링까지의 흐름을 알아보자
---
## URL 입력

사용자가 브라우저 주소창에 URL를 입력한다.

```bash
<https://www.example.com/products?id=10>
```

|**구성 요소**|**예시**|**의미**|
|---|---|---|
|scheme|`https`|사용할 프로토콜|
|host|`www.example.com`|접속할 서버 이름|
|port|`443`|접속할 포트|
|path|`/products`|서버의 리소스 경로|
|query|`id=10`|서버에 전달할 추가 파라미터|

포트를 명시하지 않으면 기본값을 사용한다.

- HTTP : 80
- HTTPS : 443

## 캐시 확인

브라우저는 네트워크 요청을 보내기 전에 아래의 캐시를 확인한다.

```
브라우저 메모리 캐시
디스크 캐시
서비스 워커 캐시
HTTP 캐시 정책
```

## DNS 조회

브라우저는 DNS 조회를 통해 도메인을 IP 주소로 바꾼다. 이는 [DNS](https://app.notion.com/p/DNS-390e44426daa80ac9f1bdbbb150b8b6e?pvs=21) 에서 확인할 수 있다.

## TCP 연결

3-way handshake을 통해 TCP 연결을 맺는다. 이는 [TCP](https://app.notion.com/p/TCP-36ee44426daa80bfa08dce0e453d7fd8?pvs=21) 에서 확인할 수 있다.

## TLS handshake

HTTPS의 경우 TCP 연결 위에 TLS handshake가 추가로 일어난다.

1. 브라우저와 서버가 사용할 TLS 버전과 암호화 방식을 협상
2. 서버가 인증서 전송
3. 브라우저가 인증서 신뢰 여부를 검증
4. 세션 키를 안정하게 생성
5. 이후 HTTP 데이터는 암호화되어 전송

## HTTP 요청

연결 준비가 되면 브라우저는 서버에 HTTP 요청을 보낸다.

```bash
GET /products?id=10 HTTP/1.1
Host: www.example.com
User-Agent: Mozilla/5.0
Accept: text/html
Accept-Encoding: gzip, br
Cookie: sessionId=abc123
Connection: keep-alive
```

|**구성**|**예시**|**의미**|
|---|---|---|
|Method|`GET`|어떤 작업을 할지|
|Path|`/products?id=10`|어떤 리소스를 요청할지|
|Headers|`Host`, `Cookie` 등|부가 정보|
|Body|POST 요청 데이터 등|서버에 전달할 본문|

## HTTP 응답

서버는 브라우저에게 HTTP 응답을 보낸다.

```bash
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Encoding: gzip
Cache-Control: max-age=3600
Set-Cookie: sessionId=abc123
Content-Length: 12560

<html>
  <head>
    <link rel="stylesheet" href="/style.css">
    <script src="/app.js"></script>
  </head>
  <body>
    <h1>Product Detail</h1>
  </body>
</html>
```

|**구성**|**예시**|**의미**|
|---|---|---|
|Status Line|`HTTP/1.1 200 OK`|처리 결과|
|Headers|`Content-Type`, `Cache-Control`|응답 메타데이터|
|Body|HTML, JSON, 이미지 등|실제 데이터|

## HTML 파싱

HTML은 위에서 아래로 파싱되며, DOM Tree를 만든다.

```
DOM
html
 ├─ head
 │   ├─ title
 │   └─ link
 └─ body
     ├─ h1
     ├─ img
     └─ script
```

DOM은 Document Object Model의 약자로, HTML 문서를 브라우저가 다루기 쉬운 트리 구조로 만든 것이다.

## CSSOM

HTML 안에서 CSS 파일을 발견하면 브라우저는 추가 요청을 보낸다.

```html
<link rel="stylesheet" href="/style.css">
```

CSS를 받으면 브라우저는 CSS를 파싱해서 CSSOM Tree를 만든다.

```css
h1 {
  color: red;
  font-size: 32px;
}
```

CSSOM은 CSS Object Model의 약자로, 스타일 규칙 구조이다.

```
CSSOM
 └─ h1
     ├─ color: red
     └─ font-size: 32px
```

브라우저는 CSSOM이 완성되어야 정확한 화면 스타일을 계산할 수 있기 때문에 CSS는 렌더링을 막는 리소스이다.

## JavaScript

HTML 안에서 JavaScript 파일을 만난다면 JS 파일도 브라우저가 요청한다.

```html
<script src="/app.js"></script>
```

JavaScript가 DOM을 변경할 수 있기 때문에 HTML 파싱과정에서 발견할 경우 파싱을 멈추고 JS 다운로드 및 실행한다. HTML 파싱을 멈추는 것을 방지하기 위해 async나 defer를 사용한다.

- async
    - HTML 파싱과 JS 다운로드를 병렬로 처리
    - 다운로드 완료 즉시 JS 실행
    - JS 실행 순서가 보장되지 않음
- defer
    - HTML 파싱과 JS 다운로드를 병렬로 처리
    - 다운로드 완료 즉시 JS 실행
    - JS 실생 순서 보장

## 이미지, 폰트

HTML 파싱 과정에서 이미지와 폰트 등 추가 리소스를 발견하게 된다. 브라우저는 이런 리소스들도 요청한다.

```html
<img src="/logo.png">
```

```css
@font-face {
  src: url("/font.woff2");
}

.hero {
  background-image: url("/hero.jpg");
}
```

이때 브라우저는 리소스 우선순위를 정한다. 단, 상황에 따라 우선순위가 달라질 수 있다.

```css
HTML → CSS → 동기 JS → 폰트 → 뷰포트 안 이미지 → 뷰포트 밖 이미지
```

## Render Tree

브라우저는 DOM과 CSSOM을 결합해서 Render Tree를 만든다.

## Layout

Render Tree가 만들어지면 브라우저는 각 요소가 화면 어디에, 어떤 크기로 배치될지 계산한다.

## Paint

위치와 크기가 정해지면, 브라우저는 각 요소를 실제 픽셀로 그린다.

## Composit

모든 요소를 하나의 평면에 바로 그리는 것이 아니라, 일부 요소를 별도 레이어로 관리할 수 있다.

## 화면 표시

최종 합성 결과가 화면에 표시된다. 이 과정을 한 번만 하는 것이 아닌 페이지가 살아 있는 동안 계속 반복된다.