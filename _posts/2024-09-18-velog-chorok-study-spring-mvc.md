---
title: "초록 스터디 - Spring MVC"
date: 2024-09-18T05:03:31Z
categories:
  - Spring
excerpt: "Spring MVC 테스트"
---
## Welcome Page

-   스프링은 정적 페이지와 템플릿 시작 페이지를 지원한다.
-   먼저 `static` 디렉토리에서 `index.html` 를 탐색한다.
    -   있는 경우 해당 파일을 반환한다.
-   없는 경우 `templates` 디렉토리에서 `index 템플릿` 를 탐색한다.
    -   있는 경우 해당 파일을 반환한다.
    -   없는 경우, 애플리케이션에서 자동으로 설정된 페이지 반환한다.

### 테스트

-   `resources` 에는 다음과 같은 html 파일들이 제공됐다.

![](/assets/images/velog/FRkYUkTxskL74Kd90ebA6K-img.png)

-   진행할 테스트 코드는 다음과 같다.
    -   `http://localhost:8080/` 로 `GET` 요청이 들어오면 HTTP 상태 코드 `200` 을 받아야 한다.

```java
@Test
void responseIndexPage() {
    var response = RestAssured
        .given().log().all()
        .when().get("/")
        .then().log().all().extract();

    assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
}
```

-   현재 상태에서 테스트 코드를 돌리면 테스트가 통과되지 않는다.
    -   `static` 디렉토리와 `templates` 디렉토리에 `index.html` 이 존재하지 않는다.
    -   이는 welcome page가 존재하지 않음을 뜻하고, 스프링은 welcome page를 넘겨줄 수 없기 때문에 예외를 발생시킨다.

![](/assets/images/velog/YZSAuLERdbIr2VpQQ0MYfK-img.png)

-   이를 해결하기 위해서 `static` 디렉토리에 있는 `hi.html` 의 이름을 `index.html` 로 변경하였고, 테스트 코드를 실행했다.
    -   정상적으로 테스트가 통과됨을 알 수 있다.

![](/assets/images/velog/AOtgRWCtRkwpkR2xYJLnWK-img.png)

## Static page

-   스프링은 정적 페이지 요청이 들어오면 다음 경로를 순서대로 탐색한다.
    -   /public
    -   /static
-   정적 페이지는 자주 변경되지 않으므로, 캐시 설정을 통해 HTTP 요청 수를 줄일 수 있다.
    -   정적 페이지에는 아이콘, 로고 등이 포함된다.

### 테스트

-   진행할 테스트 코드는 다음과 같다.
    -   `http://localhost:8080/static.html` 로 `GET` 요청이 들어오면 HTTP 상태 코드 `200` 을 받아야 한다.

```java
@Test
void responseStaticPage() {
    var response = RestAssured
        .given().log().all()
        .when().get("/static.html")
        .then().log().all().extract();

    assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
}
```

-   현재 상태에서 테스트 코드를 돌리면 테스트가 통과되지 않는다.
    -   제공된 static.html은 templates 디렉토리 하위에 존재한다.
    -   스프링은 정적 페이지 요청이 들어오면 /public → /static 순서대로 탐색을 한다.
    -   templates 디렉토리는 탐색 범위에 포함되지 않기 때문에 스프링은 해당 파일을 찾을 수 없다.

![](/assets/images/velog/kEvfO76bPKfw5uoHiX5B70-img.png)

-   이를 해결하기 위해서는 두 가지 방법이 있다.
    -   templates 디렉토리 하위에 존재하는 static.html를 static 디렉토리로 옮긴다.
        -   정상적으로 테스트가 통과됨을 알 수 있다.

![](/assets/images/velog/urQKywKMiY7FsK6McTbjxk-img.png)

    -   WebMvcConfigurer을 구현한다.
        -   WebMvcConfigurer은 스프링에서 제공하는 인터페이스이다.
        -   이를 구현해서 개발자는 MVC 구성정보를 제어할 수 있다.
        -   인터셉터 추가, 뷰 리졸버 그리고 리소스 핸들링 등을 제어할 수 있다.
        -   여기서는 정적 페이지, 즉 리소스 핸들링을 해야한다.

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
            .addResourceLocations("classpath:/static/", "classpath:/public/", "classpath:/templates/");
    }
}
```

-   인터페이스를 구현한 WebConfig 클래스이다.
     -   addResourceHandler : 어떤 요청에서 핸들링을 할 것인지 지정한다.
       -   addResourceLocations : 핸들링할 리소스 경로를 지정한다.
            
![](/assets/images/velog/u76X3lkM1VtbBPd7oqxGqk-img.png)

       -   테스트가 정상적으로 통과됨을 알 수 있다.

## Template Engine

-   동적으로 처리한 결과를 페이지에 표현하기 위해서는 템플릿 엔진을 활용할 수 있다.
    -   [템플릿 엔진](https://codingdreamtree.tistory.com/24) : 템플릿 양식과 특정 데이터 모델에 따른 입력 자료를 합성하여 결과 문서를 출력하는 소프트웨어
    -   서버 사이드와 클라이언트 사이드로 나눠진다고 한다.
-   지금은 서버 사이드에 포함된 `Thymeleaf` 를 사용한다.

### 테스트

-   진행할 테스트 코드는 다음과 같다.
    -   `http://localhost:8080/hello?name=Brie` 로 `GET` 요청이 들어오면 HTTP 상태 코드 `200` 을 받아야 한다.
    -   또한, 응답 메시지에 `Hello, Brie!` 라는 문구가 포함되야 한다.

```java
@Test
void responseTemplatesHelloPage() {
    var response = RestAssured
        .given().log().all()
        .when().get("/hello?name=Brie")
        .then().log().all().extract();

    assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
    assertThat(response.asString()).contains("Hello, Brie!");
}
```

-   테스트 코드를 만족시키기 위해 다음과 같이 진행했다.
    -   `/hello` 경로로 들어오는 요청을 받을 컨트롤러 메소드를 생성한다.
    -   `?name=Brie` 에서 `Brie` 값을 추출하기 위해서 `RequestParam` 어노테이션을 활용한다.
        -   RequestParam : 쿼리 파라미터 혹은 폼 데이터에서 데이터를 가져와 메소드 인자로 바인딩하는 어노테이션이다.
    -   추출한 값을 페이지에 전달하기 위해 `Model` 을 활용한다.
        -   Model : 스프링에서 지원하는 객체로, 컨트롤러에서 뷰로 값을 전달할 때 사용하는 맵으로 생각하면 된다.
-   위에서 언급한 내용을 반영해서 컨트롤러 메소드를 구현할 수 있다.
    -   RequestParam 어노테이션에는 다음과 같은 설정을 할 수 있다.
        -   required : RequestParam 어노테이션이 선언된 메소드 인자에 아무 값도 들어오지 않을 경우, 예외가 발생한다. 필수 값이 아닌 경우 해당 설정을 통해 예외를 방지할 수 있다.
        -   defaultValue : 값이 들어오지 않았을 때, 기본 값을 설정할 수 있다. required가 true로 설정된 상태에서 값이 들어오지 않았을 때도, 설정된 기본값으로 메소드 인자에 바인딩 된다.
    -   Model 객체를 사용하기 위해서는 메소드 인자로 선언해야 한다.
        -   Spring에서 자동으로 Model 객체를 넣어주는 것 같다.
        -   Model의 addAttribute 메소드를 통해 뷰에 넘겨줄 값을 설정할 수 있다.
        -   이때, key-value 형태로 값을 설정해야 한다.
    -   메소드 반환형의 경우 `String` 으로 선언해야 한다
        -   반환 값으로는 넘겨줄 뷰의 이름을 작성하면 된다.
        -   스프링은 넘겨줄 뷰의 이름을 보고, 해당 뷰에 Model 객체를 넘겨준다.

```java
@GetMapping("/hello")
public String world(
    @RequestParam(required = false, defaultValue = "World") String name, Model model
) {
    model.addAttribute("name", name);
    return "hello";
}
```

-   정상적으로 테스트가 통과됨을 알 수 있다.
-   ![](/assets/images/velog/kjt8Yx7tEo4VK1PgznFStK-img.png)

## Json Response

-   자바 객체를 응답하기 위해서 스프링은 ResponseBody 어노테이션을 지원한다.

### 테스트

-   진행할 테스트 코드는 다음과 같다.
    -   `http://localhost:8080/json` 으로 `GET` 요청이 들어오면 HTTP 상태 코드 `200` 을 받아야 한다.
    -   또한 응답 메시지에 Name은 Brown, Age는 20이 포함되야 한다.

```java
@Test
void responseJson() {
    var response = RestAssured
        .given().log().all()
        .when().get("/json")
        .then().log().all().extract();

    assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
    assertThat(response.as(Person.class).getName()).isEqualTo("brown");
    assertThat(response.as(Person.class).getAge()).isEqualTo(20);
}
```

-   테스트 코드를 만족시키기 위해 다음과 같이 진행했다.
    -   Person 클래스는 제공된 코드를 사용했다.
    -   `/json` 경로로 들어오는 요청을 받을 컨트롤러 메소드를 생성한다.
    -   해당 컨트롤러 메소드에 ResponseBody 어노테이션을 작성한다.
        -   ResponseBody은 자바 객체를 직렬화해서 HTTP 응답 메시지에 넣어주는 어노테이션이다.
-   위에서 언급한 내용을 반영해서 컨트롤러 메소드를 구현할 수 있다.

```
@GetMapping("/json")
@ResponseBody
public Person json() {
    return new Person("brown", 20);
}
```

-   정상적으로 테스트가 통과됨을 알 수 있다.
-   ![](/assets/images/velog/qxGVr8Qyadx85TX8paZBCk-img.png)