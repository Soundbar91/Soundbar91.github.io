---
title: "직렬화 예외 처리"
date: 2024-09-18T05:25:29Z
categories:
  - Java
excerpt: "직렬화에서 예외를 핸들링해보자"
---

```java
public record RequestCreateReservation(
    @NotBlank(message = "이름은 필수 입력사항 입니다.")
    String name,

    @NotNull(message = "날짜는 필수 입력사항 입니다.")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    LocalDate date,

    @NotNull(message = "시간은 필수 입력사항 입니다.")
    @DateTimeFormat(pattern = "HH-mm")
    LocalTime time
)
```

-   예약 정보 생성을 요청하는 과정에서 사용되는 DTO이다.
-   DateTimeFormat 어노테이션을 통해 HTTP 요청 메시지 바디에 있는 날짜 데이터를 LocalDate와 LocalTime으로 직렬화를 한다.
-   만약, DateTimeFormat 어노테이션에 설정된 패턴대로 데이터가 들어오지 않으면 어떻게 될까?

![](/assets/images/velog/2c8947aa-3fc4-4a19-a8bc-53282d73be4a-image.png)

![](/assets/images/velog/12b68b7f-e8f9-4a24-a1a9-344db3a34e0a-image.png)

-   다음과 같은 예외가 발생한다.
    -   Spring MVC Request Lifecycle을 보면, Handler Adapter가 클라이언트의 요청을 처리할 컨트롤러 메소드를 호출한다.
    -   이 과정에서 Argument resolver를 호출한다.
    -   Argument resolver은 컨트롤러 메소드의 파라미터에 작성된 어노테이션을 보고, 적절한 데이터를 생성한다. 이때, HttpMessageConverter를 사용한다.
    -   현재 발생한 예외는 HttpMessageConverter가 직렬화하는 과정에서, 날짜 데이터가 설정된 포맷과 다르기 때문에 예외가 발생한 것이다.
-   응답 메시지로 400을 받지만, 400인 이유를 명확하게 알려준다면 클라이언트 입장에서도 어떤 곳이 잘못됐는지 알 수 있다.

### 예외 핸들러

-   스프링에서는 발생한 예외를 핸들링하는 핸들러를 어노테이션을 통해 지정할 수 있다.
    -   ControllerAdvice, RestControllerAdvice : 예외를 핸들링하는 핸들러를 지정해주는 어노테이션이다.
    -   ExceptionHandler : 핸들러 메소드에서 어떤 예외를 핸들링할 것인지 지정해주는 어노테이션이다.
-   어노테이션을 통해 핸들러를 지정하고, 예외를 핸들링하는 이유는 무엇일까?
    -   try-catch를 통해 예외를 잡는 방법도 존재하지만, 예외가 발생할 수 있는 곳에 모두 try-catch를 작성한다면 코드가 더러워진다.
    -   하나의 핸들러에서 예외를 핸들링을 하면 try-catch를 작성하지 않아도 되고, 메인 로직만 신경쓸 수 있다.

### 구현

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Object> httpMessageNotReadableException(HttpMessageNotReadableException e) {
        //
    }
}
```

-   위에서 언급한 내용을 바탕으로 다음과 같은 클래스와 메소드를 생성했다.
-   현재 발생한 예외는 `HttpMessageNotReadableException` 이므로, ExceptionHandler 어노테이션을 통해 해당 예외를 핸들링 한다.

![](/assets/images/velog/65136d0c-4ccb-4779-8f8a-c8467b75d2f9-image.png)

-   메소드에 브레이크 포인트를 걸고, 디버깅 모드로 애플리케이션을 실행시킨다.
-   이후, 잘못된 데이터를 보내면 핸들러에서 예외고 잡아 브레이크 포인트에서 멈춘다.
-   사진을 통해 알 수 내용은 다음과 같다.
    -   e.cause.\_value을 통해 예외를 발생시킨 값을 확인할 수 있다.
    -   e.cause.\_path을 통해 예외를 발생시킨 값의 경로를 확인할 수 있다.
    -   `InvalidFormatException`가 `HttpMessageNotReadableException`에 감싸져서 온 것을 확인할 수 있다.

undefined

-   `InvalidFormatException`를 확인하면, `MismatchedInputException`를 상속받음을 알 수 있다.
-   `MismatchedInputException` 예외도 다른 클래스를 상속받고 있음을 알 수 있었다.
-   \_path를 가져오기 위해서는 발생한 예외에서 InvalidFormatException를 추출해야 한다.
-   `instanceof` 연산자를 통해 가져올 수 있다.
    -   instanceof : 객체 타입을 확인하는 연산자이다.
    -   `e.getCause() instanceof 클래스` 를 통해 객체의 인스턴스가 주어진 클래스와 일치하면 [반환한다고 한다.](https://www.delftstack.com/ko/howto/java/java-get-type-of-object/#java%EC%97%90%EC%84%9Cinstanceof%EB%A5%BC-%EC%82%AC%EC%9A%A9%ED%95%98%EC%97%AC-%EA%B0%9D%EC%B2%B4-%EC%9C%A0%ED%98%95-%EA%B0%80%EC%A0%B8-%EC%98%A4%EA%B8%B0)

```java
@ExceptionHandler(HttpMessageNotReadableException.class)
public ResponseEntity<Object> httpMessageNotReadableException(HttpMessageNotReadableException e) {
    if (e.getCause() instanceof MismatchedInputException mismatchedInputException) {
        final String errorMessage = mismatchedInputException.getPath().get(0).getFieldName() + " 필드의 값이 잘못되었습니다.";
        return ResponseEntity.badRequest().body(errorMessage);
    } else {
        return ResponseEntity.badRequest().body("확인할 수 없는 데이터가 들어왔습니다.");
    }
}
```

-   위에서 언급한 내용을 바탕으로 작성한 코드이다.
-   e.getCause()를 instanceof 연산자를 통해 MismatchedInputException의 클래스임을 확인하는 이유는 다음과 같다.
    -   jackson-databind 라이브러리의 예외는 대부분 MismatchedInputException 클래스를 상속받는다.
    -   하위 클래스에 해당하는 코드를 하나하나 작성하는 것보다, 부모 클래스 하나로 처리하는 것이 좋다고 판단되어 MismatchedInputException 클래스를 사용했다.