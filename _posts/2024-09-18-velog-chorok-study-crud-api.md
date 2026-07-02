---
title: "초록 스터디 - CRUD API"
date: 2024-09-18T05:06:07Z
categories:
  - Spring
excerpt: "CRUD API 테스트"
---
## create

-   리소스 생성을 요청하는 API이다.
-   클라이언트는 POST 요청을 통해 서버에 리로스 생성을 요청한다.
-   이때, 생성에 필요한 데이터를 HTTP 요청 메시지 바디 부분에 담는다.
-   서버는 HTTP 요청 메시지 바디에 있는 데이터를 이용해서 리소스를 생성한다.
-   정상적으로 생성이 됐을 경우, `201` 응답코드와 리소스가 생성된 위치, 그리고 생성된 리소스를 HTTP 응답 메시지에 담아 클라이언트에게 보낸다.

### 테스트

-   진행할 테스트 코드는 다음과 같다.
    -   클라이언트에서 보낸 데이터를 바탕으로 서버가 리소스를 생성한다.
    -   이후, HTTP 상태 코드 `201` 를 받는다.
```java
@Test
void create() {
    var response = RestAssured
        .given().log().all()
        .body(new Member("brown", 20))
        .contentType(ContentType.JSON)
        .when().post("/members")
        .then().log().all().extract();

    assertThat(response.statusCode()).isEqualTo(HttpStatus.CREATED.value());
}
```
-   테스트 코드를 만족시키기 위해 다음과 같이 진행했다.
    -   기본적으로 제공되는 코드가 존재했다.
    -   HTTP 요청 메시지 바디에서 데이터를 가져와 자바 객체에 바인딩하기 위해서 RequestBody 어노테이션을 사용한다.
        -   RequestBody : byte, json 등 형태의 데이터를 자바 객체로 역직렬화해주는 어노테이션이다. ResponseBody와 반대 기능을 한다.
-   위에서 언급한 내용을 반영해서 컨트롤러 메소드를 구현할 수 있다.
    -   RequestBody 어노테이션을 통해 json 데이터를 자바 객체로 역직렬화한다.
    -   ResponseEntity
        -   ResponseBody의 경우 직렬화된 데이터만 반환할 수 있으며, 헤더와 상태 코드를 지정할 수 없다.
        -   ResponseEntity은 직렬화된 데이터와 더불어, 헤더와 상태 코드를 지정할 수 있다.
        -   이를 통해 `201` 응답 코드와 응답 메시지의 헤더를 설정할 수 있다.
```java
@PostMapping("/members")
public ResponseEntity < Void > create(@RequestBody Member member) {
    Member newMember = Member.toEntity(member, index.getAndIncrement());
    members.add(newMember);
    return ResponseEntity.created(URI.create("/members/" + newMember.getId())).build();
}
```
-   정상적으로 테스트가 통과됨을 알 수 있다.
![](/assets/images/velog/6LBYKPCQruYFI9N5O92oeK-img.png)

## read

-   리소스 조회를 요청하는 API이다.
-   클라이언트가 특정 경로에 있는 리소스를 조회하기 위해 GET 요청을 사용한다.
-   서버는 해당 요청을 받아 리소스를 조회하고, 리소스가 있는 경우 클라이언트에게 `200` 응답 코드와 함께 리소스를 전달한다.

### 테스트

-   진행할 테스트 코드는 다음과 같다.
    -   create() 메소드를 호출해서 데이터를 생성한다.
    -   `http://localhost:8080/members` 경로에 `GET` 요청을 보내고, HTTP 응답 코드 `200` 을 반환받는다.
    -   또한, 반환받은 데이터의 개수가 1개인지 확인한다.
```java
@Test
void read() {
    create();

    var response = RestAssured
        .given().log().all()
        .contentType(ContentType.JSON)
        .when().get("/members")
        .then().log().all().extract();

    assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
    assertThat(response.jsonPath().getList("", Member.class)).hasSize(1);
}
```
-   테스트 코드를 만족시키기 위해 다음과 같이 진행했다.
    -   현재는 데이터베이스를 사용하지 않고, List 자료구조에 저장하는 방식이다.
    -   해당 List를 응답 메시지 바디 부분에 넣어준다.
-   위에서 언급한 내용을 반영해서 컨트롤러 메소드를 구현할 수 있다.
```java
@GetMapping("/members")
public ResponseEntity < List < Member >> read() {
    return ResponseEntity.ok(members);
}
```
-   정상적으로 테스트가 통과됨을 알 수 있다.
![](/assets/images/velog/tbQHNVNk7F9rF3NNiTdbl1-img.png)

## Update

-   리소스 수정을 요청하는 API이다.
-   리소스 수정을 요청할 때 사용하는 HTTP 메소드에는 두 가지가 있다.
    -   PATCH : 부분 수정
    -   PUT : 전부 수정
-   해당 과정에서는 전체 리소스를 대체하기 위해 PUT를 사용한다.
-   클라이언트는 요청을 보낼 경로에 `PUT` 요청을 통해 수정할 데이터를 보낸다.
-   서버는 해당 요청을 받아 수정을 진행하고, 정상적으로 처리가 됐을 경우 응답 코드 `200` 을 보낸다.

### 테스트

-   진행할 테스트 코드는 다음과 같다.
    -   create() 메소드를 호출해서 리소스를 생성한다.
    -   `http://localhost:8080/members/1` 경로에 `PUT` 요청과 함께 수정할 데이터를 보내고, HTTP 응답 코드 `200` 을 반환받는다.
```java
@Test
void update() {
    create();

    var response = RestAssured
        .given().log().all()
        .body(new Member("brown", 30))
        .contentType(ContentType.JSON)
        .when().put("/members/1")
        .then().log().all().extract();

    assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
}
```
-   테스트 코드를 만족시키기 위해 다음과 같이 진행했다.
    -   리소스가 생성된 위치를 식별하기 위해 요청 경로에 있는 `1` 를 추출해야한다.
    -   추출하기 위해서 PathVariable 어노테이션을 사용한다.
        -   PathVariable : 요청 경로에서 변수를 추출할 때 사용하는 어노테이션이다.
    -   또한, 수정할 데이터를 자바 객체에 바인딩하기 위해 RequestBody 어노테이션을 사용한다.
-   위에서 언급한 내용을 반영해서 컨트롤러 메소드를 구현할 수 있다.
    -   스트림의 경우 기본으로 제공되는 코드를 사용했다.
```java
@PutMapping("/members/{id}")
public ResponseEntity < Void > update(
    @PathVariable Long id,
    @RequestBody Member updateMember
) {
    Member member = members.stream()
        .filter(it - > Objects.equals(it.getId(), id))
        .findFirst()
        .orElseThrow(RuntimeException::new);

    member.update(updateMember);
    return ResponseEntity.ok().build();
}
```
-   정상적으로 테스트가 통과됨을 알 수 있다.
![](/assets/images/velog/LeK6yKB7BH9Ox0ebYVFsi1-img.png)

## Delete

-   리소스 삭제를 요청하는 API이다.
-   클라이언트는 삭제할 리소스의 경로에 `DELETE` 요청을 보낸다.
-   서버는 해당 요청을 받아 리소스를 탐색하고, 리소스가 있는 경우 삭제를 한다.
-   이후, 응답코드 `204` 를 반환한다.

### 테스트

-   진행할 테스트 코드는 다음과 같다.
    -   create() 메소드를 호출해서 리소스를 생성한다.
    -   `http://localhost:8080/members/1` 경로에 `DELETE` 요청과 함께 수정할 데이터를 보내고, HTTP 응답 코드 `204` 을 반환받는다.
```java
@Test
void delete() {
    create();

    var response = RestAssured
        .given().log().all()
        .when().delete("/members/1")
        .then().log().all().extract();

    assertThat(response.statusCode()).isEqualTo(HttpStatus.NO_CONTENT.value());
}
```
-   테스트 코드를 만족시키기 위해 다음과 같이 진행했다.
    -   PathVariable 어노테이션을 통해 요청 경로에서 변수를 추출한다.
    -   추출한 변수를 통해 List 자료구조에서 데이터를 조회하고, 조회된 데이터를 삭제한다.
    -   이후, `204` 응답 코드를 반환한다.
-   위에서 언급한 내용을 반영해서 컨트롤러 메소드를 구현할 수 있다.
```java
@DeleteMapping("/members/{id}")
public ResponseEntity < Void > delete(@PathVariable Long id) {
    Member member = members.stream()
        .filter(it - > Objects.equals(it.getId(), id))
        .findFirst()
        .orElseThrow(RuntimeException::new);

    members.remove(member);
    return ResponseEntity.noContent().build();
}
```
-   정상적으로 테스트가 통과됨을 알 수 있다.
![](/assets/images/velog/24ePKKMeyMS5nKZ8eZusik-img.png)