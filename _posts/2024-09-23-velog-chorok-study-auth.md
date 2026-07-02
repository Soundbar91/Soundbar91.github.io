---
title: "초록 스터디 - 인증"
date: 2024-09-23T09:06:30Z
categories:
  - Spring
excerpt: "인증 테스트"
---
## Basic Auth

- 사용자의 아이디와 비밀번호를 통해 기본 인증이 진행이 된다.
- 이때 클라이언트에서 서버로 해당 정보를 보낼 때, `Authorization: Basic` 의 형태로 HTTP 요청 메시지 헤더에 정보를 실어서 보낸다.
    - ex) Authorization: Basic QORJNFI484WJRk244
- `Basic` 뒤에 나오는 문자열은 사용자의 아이디와 비밀번호를 콜론 하나로 이어붙이고 `Base64` 라는 방식으로 인코딩한다.
    
    > [Base64란](https://ko.wikipedia.org/wiki/%EB%B2%A0%EC%9D%B4%EC%8A%A464) <br>
    바이너리 데이터를 텍스트로 바꾸는 인코딩이다. 
    문자열을 아스키 코드로 변환 → 아스키 코드를 바이너리 데이터로 변환 → 해당 바이너리 데이터가 Base64 색인표에서 몇 번째 값인지 확인 → 해당 번째의 문자로 변환
    > 

### 테스트

```java
@Test
void basicLogin() {
    MemberResponse member = RestAssured
        .given().log().all()
        .auth().preemptive().basic(EMAIL, PASSWORD)
        .accept(MediaType.APPLICATION_JSON_VALUE)
        .when().get("/members/me/basic")
        .then().log().all()
        .statusCode(HttpStatus.OK.value()).extract().as(MemberResponse.class);

    assertThat(member.getEmail()).isEqualTo(EMAIL);
}
```

- [preemptive()](https://toolsqa.com/rest-assured/basic-auth/)
    - 최초에 서버에 요청을 보내면, 서버는 클라이언트에 대한 정보를 모르기 때문에 `401` 와 `WWW-Authenticate` 헤더를 통해 인증이 필요함을 클라이언트에게 알린다.
    - `401` 에러를 받은 클라이언트는 사용자 아이디와 비밀번호를 Base64로 인코딩하고 `Authorization` 헤더에 실어 서버로 보낸다.
    - 이렇게 되면 인증을 위해 통신을 2번했다.
    - RestAssured에서는 이런 불필요한 통신을 줄이기 위해, preemptive()를 지원하고 최초 요청하는 과정에서 암호화된 클라이언트의 정보를 HTTP 요청 메시지 헤더에 포함시켜 보낸다.

```java
@GetMapping("/members/me/basic")
public ResponseEntity<MemberResponse> findMyInfo(HttpServletRequest request) {
    AuthInfo extract = authorizationExtractor.extract(request);
    String email = extract.getEmail();
    String password = extract.getPassword();

    if (authService.checkInvalidLogin(email, password)) {
        throw new AuthorizationException();
    }

    MemberResponse member = authService.findMember(email);
    return ResponseEntity.ok().body(member);
}
```

- authorizationExtractor의 extract 메소드는 HTTP 요청 메시지의 `Authorization` 헤더에서 사용자의 정보를 추출하는 메소드이다.
- 이를 위해 HttpServletRequest를 매개변수로 넘겨준다.
    - WAS가 웹 애플리케이션에 클라이언트의 요청을 넘길 때, HTTP 요청 객체와 HTTP 응답 객체를 생성해서 같이 넘긴다.
    - HTTP 요청 객체는 클라이언트의 HTTP 요청 데이터가 포함되어 있다.
    - HTTP 응답 객체는 서버가 클라이언트에게 넘길 HTTP 응답 데이터거 포함되어 있다.
    - HTTP 요청 객체는 `HttpServletRequest` , HTTP 응답 객체는 `HttpServletResponse` 이며 서블릿 API의 일부이다.
- 서블릿
    - 웹 애플리케이션 런타임 환경을 제공해주는 공간이 존재하며, 웹 컨테이너라고 한다.
    - 자바의 경우 `서블릿 컨테이너` 가 웹 컨테이너의 역할을 수행한다.
    - `서블릿` 은 자바로 구현된 웹 컴포넌트로, 서블릿 컨테이너 내에서 실행되어 HTTP 요청을 처리하고 응답을 생성한다.

## Session Login

- Base64로 인코딩된 사용자 정보의 경우 쉽게 디코딩할 수 있다.
- 그렇기 때문에 요청때마다 인코딩된 문자열을 보내는 것은 보안상 위험하다.
- 세션 기반의 로그인 경우, 최초 요청시에만 사용자의 정보를 전달하고 이후에는 서버로부터 발급받은 `세션 ID` 를 사용한다.
- 발급받은 `세션 ID` 는 `쿠키` 를 통해 클라이언트로 전달이 된다.
    - ex) Set-Cookie: JESSIONID=134KDJFKJK; Path=/; HttpOnly
- 클라이언트는 서버로 요청을 보낼 때, `쿠키 헤더` 에 세션 ID를 담아서 보낸다.
    - ex) Headers: Cookie=JESSIONID=134KDJFKJK
- `세션 ID` 를 받은 서버는 세션 저장소에서 유효한 세션인지 확인을 하고, 유효한 경우 세션에 저장된 유저 정보를 사용한다

### 테스트

```java
@Test
void sessionLogin() {
    String cookie = RestAssured
        .given().log().all()
        .param(USERNAME_FIELD, EMAIL)
        .param(PASSWORD_FIELD, PASSWORD)
        .when().post("/login/session")
        .then().log().all().extract().header("Set-Cookie").split(";")[0];

    MemberResponse member = RestAssured
        .given().log().all()
        .header("Cookie", cookie)
        .accept(MediaType.APPLICATION_JSON_VALUE)
        .when().get("/members/me/session")
        .then().log().all()
        .statusCode(HttpStatus.OK.value()).extract().as(MemberResponse.class);

    assertThat(member.getEmail()).isEqualTo(EMAIL);
}
```

- HttpSession
    - `HttpSession` 은 세션에 대한 관리 기능을 제공하며, 서블릿 API의 일부이다.
    - `setAttribute` 메소드를 통해 key-value 형태로 값을 저장할 수 있다.
    - `getAttribute` 메소드를 통해 저장된 key-value의 값을 가져올 수 있다.
    - 세션 만료, 세션 유효 기간 설정 등 다양한 기능을 제공한다.

```java
@PostMapping("/login/session")
public ResponseEntity<Void> sessionLogin(HttpServletRequest request, HttpSession session) {
    String email = request.getParameter("email");
    String password = request.getParameter("password");

    if (authService.checkInvalidLogin(email, password)) {
        throw new AuthorizationException();
    }

    session.setAttribute(SESSION_KEY, email);
    return ResponseEntity.ok().build();
}

@GetMapping("/members/me/session")
public ResponseEntity<MemberResponse> findMyInfo(HttpSession session) {
    String email = (String) session.getAttribute(SESSION_KEY);
    MemberResponse member = authService.findMember(email);
    return ResponseEntity.ok().body(member);
}
```

## Token Login

- 토큰 기반도 세션과 동일하게 최초 요청에만 사용자의 정보를 전달한다.
- 대표적으로 JWT가 있으며, 암호화된 Access Token을 클라이언트에게 발급한다.
- 발급된 토큰을 받은 클라이언트는 HTTP 요청 메시지의 `Authorization` 헤더에 담아서 서버로 요청을 보낸다.
    - ex) Headers: Authorization=Bearer fjeorn42423.fjsdkf423r.fwefwe
- 세션 방식의 경우 세션을 검증하기 위해 세션 저장소까지 찍고 와야한다.
- 토큰 방식의 경우 토큰을 디코딩하면 사용자의 정보를 확인할 수 있기 때문에 처리 시간을 단축시킬 수 있다.

### 테스트

```java
@Test
void tokenLogin() {
    String accessToken = RestAssured
        .given().log().all()
        .body(new TokenRequest(EMAIL, PASSWORD))
        .contentType(MediaType.APPLICATION_JSON_VALUE)
        .accept(MediaType.APPLICATION_JSON_VALUE)
        .when().post("/login/token")
        .then().log().all().extract().as(TokenResponse.class).getAccessToken();

    MemberResponse member = RestAssured
        .given().log().all()
        .auth().oauth2(accessToken)
        .accept(MediaType.APPLICATION_JSON_VALUE)
        .when().get("/members/me/token")
        .then().log().all()
        .statusCode(HttpStatus.OK.value()).extract().as(MemberResponse.class);

    assertThat(member.getEmail()).isEqualTo(EMAIL);
}
```

- JWT
    - JSON Web Token
    - `헤더, 내용, 서명` 의 구조로 구성이 되며, `.` 을 기준을 구분이 된다.
    - 헤더에는 암호화 알고리즘에 대한 정보 `alg` , 토큰의 타입 `typ` 가 포함되어 있다.
    - 내용에는 토큰에 포함시킬 데이터가 있으며, 각 데이터의 Key를 `claim` 이라고 부른다.
    - 서명은 인코딩된 헤더와 내용을 서버의 비밀 키로 지정된 서명 알고리즘을 사용하여 생성한 서명 값이다.
    - 서명을 통해 JWT가 조작이 됐는지 확인할 수 있다.
    - JWT의 헤더와 내용은 Base64로 인코딩되기 때문에 쉽게 디코딩할 수 있다.
    - 그렇기 때문에 비밀번호와 같은 정보는 포함시키지 않는 것이 좋다.

```java
@PostMapping("/login/token")
public ResponseEntity<TokenResponse> tokenLogin(
    @RequestBody TokenRequest tokenRequest
) {
    TokenResponse tokenResponse = authService.createToken(tokenRequest);
    return ResponseEntity.ok().body(tokenResponse);
}

@GetMapping("/members/me/token")
public ResponseEntity<MemberResponse> findMyInfo(HttpServletRequest request) {
    String token = authorizationExtractor.extract(request);
    MemberResponse member = authService.findMemberByToken(token);
    return ResponseEntity.ok().body(member);
}
```

## 테스트 결과

![](/assets/images/velog/02b3e0e1-47d1-4557-a5e6-8dc4a3700ff6-image.png)
