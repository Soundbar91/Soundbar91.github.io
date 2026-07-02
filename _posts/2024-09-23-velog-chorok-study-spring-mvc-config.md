---
title: "초록 스터디 - Spring MVC Config"
date: 2024-09-23T09:07:47Z
categories:
  - Spring
excerpt: "Spring MVC Config 테스트"
---
## MVC Configuration

- 스프링은 개발자가 MVC 패턴을 커스텀마이징할 수 있도록, `WebMvcConfigurer` 인터페이스를 제공한다.
- 이를 통해 뷰 컨트롤러 매핑, 인터셉트 추가 등 개발자는 MVC 패턴을 커스텀 마이징할 수 있다.

```java
@Configuration
public class WebMvcConfiguration implements WebMvcConfigurer
```

- 스프링 애플리케이션이 구동되고, 설정파일을 불러오는 과정에서 `@Configuration` 이 붙어있는 클래스를 스프링 빈으로 등록한다.
- 이때, 개발자가 생성한 MVC 커스텀 설정파일이 등록되기 위해 해당 어노테이션을 작성해야 한다.

## View Controller

- WebMevConfigurer에서 제공하는 메소드 중, `addViewControllers` 를 통해 특정 요청에 대해 뷰를 응답할 수 있도록 설정할 수 있다.
- 해당 설정을 하면, 개발자는 별도의 뷰 컨트롤러를 작성하지 않고 뷰를 응답할 수 있다.

```java
@Override
public void addViewControllers(ViewControllerRegistry registry) {
    registry.addViewController("/").setViewName("hello");
}
```

- addViewControllers 메소드 vs ViewContoller 클래스
    - addViewControllers 메소드를 사용하는 경우, 바로 뷰를 보내기 때문에 정적 페이지에는 적합하지만 동적 페이지에는 부적합하다고 생각이 들었다.
    - ViewController 클래스를 선언해서 직접 작성하는 경우 동적 페이지를 넘겨줄 수 있다.
    - 결론은 정적 페이지의 경우 addViewControllers 메소드, 동적 처리가 필요한 경우 ViewController 클래스를 사용하면 좋을 것 같다.

## Interceptor

- `Interceptor` 은 HTTP 요청이 처리 전과 처리 후에 사용되는 컴포넌트이다.
- `DispatcherServlet` 에서 요청을 컨트롤러 메소드로 위임하는 과정과 컨트롤러 메소드에서 결과를 반환하는 과정의 각각 중간에 위치한다.
- 이를 통해 특정 로직을 실행할 수 있고, 인증 및 검증 로직을 수행할 수 있다.
- 인터셉터는 여러 개 등록할 수 있으며, 하나라도 통과하지 못한 경우 다음 과정으로 넘어가지 못 한다.

```java
@Override
public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(new CheckLoginInterceptor())
        .addPathPatterns("/admin/**");
}
```

- `addPathPatterns` 메소드는 특정 경로에 인터셉터를 등록할 것인지 설정하는 메소드이다.
- `order` 메소드를 통해 인터셉터의 우선순위도 정할 수 있다.

## Argument Resolver

- `ArgumentResolver` 은 HTTP 요청 메시지에 존재하는 데이터를 컨트롤러 메소드의 파라미터로 변환하는 기능을 제공한다.
- 이를 통해 HTTP 요청 메시지에 있는 데이터를 자바 코드로 변환하는 작업을 수행할 수 있다.
- 또한, 세션 혹은 쿠키에서 사용자의 정보를 추출하는 코드를 ArgumentResolver로 대체할 수 있어 중복 코드를 줄일 수 있다.

```java
@Override
public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
    resolvers.add(new AuthenticationPrincipalArgumentResolver());
}
```

## 테스트
![](/assets/images/velog/25565687-d062-4a5d-8bfe-53f785e08c3f-image.png)
