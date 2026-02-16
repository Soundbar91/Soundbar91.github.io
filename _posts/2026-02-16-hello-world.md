---
title: "블로그를 시작합니다"
date: 2026-02-16
categories: [Blog]
tags: [blog, jekyll, github-pages]
toc: true
---

Jekyll과 GitHub Pages를 이용한 개인 기술 블로그를 개설했습니다.

## 블로그 소개

이 블로그는 개발하면서 배운 것들을 기록하고 공유하기 위해 만들었습니다.

## 기술 스택

블로그는 다음 기술로 구성되어 있습니다:

- **Jekyll** - 정적 사이트 생성기
- **GitHub Pages** - 호스팅
- **Markdown** - 글 작성

## 코드 하이라이팅 예시

Java 코드 예시입니다:

```java
@RestController
@RequestMapping("/api")
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello, World!";
    }
}
```

Python 코드 예시입니다:

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

for i in range(10):
    print(fibonacci(i))
```

## 앞으로의 계획

다양한 기술 주제에 대해 글을 작성할 예정입니다.

> 꾸준히 기록하는 것이 중요합니다.
