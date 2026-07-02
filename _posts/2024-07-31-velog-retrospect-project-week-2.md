---
title: "회고 프로젝트 - 2주차"
date: 2024-07-31T15:08:27Z
categories:
  - Project
excerpt: "꺾이더라도 키보드에서 손을 떼지 말 것"
---
## 서론

![](/assets/images/velog/8bb4aed7-7cf2-406b-a61f-b97ad251f654-image.png)

2주차에는 다음과 같은 기능을 구현하는 것을 목표로 삼았다. 다만 진행 과정에서 관리자 기능의 우선 순위를 내리는 방향으로 결정을 했다. 최근 자주 접속하고 있는 [사이트](https://swexpertacademy.com/main/code/userProblem/userProblemList.do)에서도 사용자들이 문제를 만들 수 있는 기능이 있는데, 별도의 제약이 없어 보였다. 
진행하고 있는 프로젝트의 주제인 `함께 만드는 알고리즘 저지 사이트`에서 제약을 두게 되면 함께 만드는 것이 아닌 거 같다는 생각이 들었다. 또한, 관리자 기능 이외의 다른 로직(채점 서버)에 집중하고 싶다는 생각이 들어 우선 순위를 낮췄다.

## 본론
### 게시글
게시글에는 카테고리라는 필드가 존재한다. 이를 명시하기 위해 `enum` 클래스를 생성했다. 이렇게 하면 데이터베이스의 제약조건 설정에서 `between` 를 걸어서 카테고리로 지정한 값 이외의 다른 값의 삽입 및 수정을 막을 수 있다. ~~사실 JPA가 생성한 DDL를 보고 그때 알았다.~~

```java
public enum Category {
    ERROR("오류"),
    QUESTION("질문"),
    COUNTEREXAMPLE("반례");

    private final String categoryName;
}
```

<img src="https://velog.velcdn.com/images/soundbar91/post/a7b989fd-be10-41f0-8dba-bdc7f9fb42de/image.png" width="100%" height="50%">

문제가 삭제되지 않으면 게시판도 삭제되지 않기 때문에, 게시글도 게시판과 동일하게 구현했다.
### 회원 탈퇴 시 게시글과 댓글
회원 탈퇴를 하면 게시글과 댓글을 남기고 싶었다. 이를 위해서는 설정을 살작 건들어줘야 할 거 같다. 

```java
@ManyToOne(fetch = EAGER)
@JoinColumn(name = "user_id")
private User user;
```

각 entity에는 해당 필드가 있다. 기존에는 `nullable = false` 로 설정했지만 이를 `true` 로 설정해서 null값을 허용한다. 

이제 회원탈퇴 로직을 변경해준다. 

```java
@Transactional
public void withdrawalUser(HttpServletRequest httpServletRequest) {
    Long id = (Long) httpServletRequest.getSession().getAttribute("userId");

    User user = userRepository.findById(id).orElseThrow(() - > new ApplicationException(NOT_FOUND_USER));
    List < Problem > problemList = problemRepository.findProblemByUser(user);
    for (Problem problem: problemList) problem.deleteUser();

    List < Post > postList = postRepository.findPostByUser(user);
    for (Post post: postList) post.deleteUser();

    List < Comment > commentList = commentRepository.findCommentByUser(user);
    for (Comment comment: commentList) comment.deleteUser();

    userRepository.delete(user);
}
```

```java
public void deleteUser() {
        this.user = null;
}
```

유저가 남긴 문제, 게시판 그리고 게시글을 조회하고 User 필드를 null 변경해주는 `deleteUser()` 메소드를 돌린다. 

<p align="center"><img src="https://velog.velcdn.com/images/soundbar91/post/f6b9690a-c0c0-4b3d-ab5b-cb446d7c641b/image.png" width="20%" height="100%"></p>

그럼 다음과 같이, 1번 유저가 탈퇴를 해도 해당 유저가 만든 문제는 유지가 됨을 확인할 수 있다. 지금 생각해보니 해당 문제를 조회할 때, null 값 체크를 해줘야 할 것 같다.

### 메인 서버 -> 채점 서버
클라이언트가 제출한 코드를 메인 서버가 받고, 이를 채점 서버에 넘겨줘야 한다. 이를 구현하기 위해 API 통신을 사용했다. API 통신을 사용한 이유는 알고 있는 내용 중에서 구현할 수 있는 것이 API 통신이기 때문에 이를 사용했다. 이후, 다른 방법이 있거나 개선할 수 있는 사항이 있다면 반영해야겠다. 
API 통신을 하기 위해, 메인 서버에서 HTTP 요청 메시지를 구성해야 한다. 

#### HTTP Request Message

##### 헤더

```java
HttpHeaders headers = new HttpHeaders();
headers.set("Content-Type", "application/json");
```

요청 메시지 바디에 json 형태의 데이터가 포함되기 때문에 헤더 부분에 `Content-Type` 를 표현한다. 

##### 바디

```java
Map < String, Object > requestBody = new HashMap < > ();
requestBody.put("source_code", requestCreateResult.code());
requestBody.put("language", requestCreateResult.language());
requestBody.put("test_cases", problem.getTestcase());
requestBody.put("memory_limit", problem.getMemory());
requestBody.put("time_limit", problem.getRuntime().get(String.valueOf(requestCreateResult.language()).toLowerCase()));
```

json 데이터를 Map 자료형을 이용해서 구성했다. Map의 value 자료형을 Object로 설정한 이유는 코드와 같은 문자열과 제한 시간과 같은 정수 등 서로 다른 자료형이 들어가기 때문에 상위 객체인 Object로 설정했다. 

- source_code : 클라이언트가 보낸 코드
- language : 사용된 프로그래밍 언어
- test_cases : 해당 문제의 테스트 케이스
- memory_limit : 해당 문제의 메모리 제한
- time_limit : 해당 문제의 제한 시간

##### 생성

```java
new HttpEntity<>(requestBody, headers);
```

헤더와 바디를 모두 설정했다면, HttpEntity 클래스에 넘겨서 요청 메시지를 만든다. 

> [HttpEntity](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/HttpEntity.html)
헤더와 바디로 구성된 HTTP 요청과 응답의 엔티티를 나타내는 클래스이다. 

#### HTTP Request 보내기

HTTP Request를 보내기 위해 Spring에서 지원하는 `RestTemplate` 클래스를 사용했다. 해당 클래스는 API를 호출할 수 있는 Spring의 HTTP 통신 템플릿이라고 한다. API 호출을 통해 체점 서버에 코드를 넘겨주기 때문에 적절하다고 생각했다. 

```java
private ResponseEntity < Map > responseBody(HttpEntity < Map < String, Object >> entity) {
    RestTemplate restTemplate = new RestTemplate();

    return restTemplate.exchange(
        pythonServerUrl + "/judge",
        HttpMethod.POST,
        entity,
        Map.class
    );
}
```

`exchange` 메소드는 api 호출을 하는데 사용하는 메소드이다. 넘겨줘야하는 파라미터는 다음과 같다. 

- String url : 호출할 api 경로이다.
- HttpMethod method : Http 요청 메소드이다.
- HttpEntity<?> requestEntity : Http 요청 메시지이다.
- Class<T> responseType
    - Http 응답 메시지의 자료형이다.
    - 반환값이 해당 자료형으로 나오기 때문에 반환값을 저장할 변수의 자료형과 일치시켜줘야 한다.
    
```java
ResponseEntity<Map> response = responseBody(request);
```

#### HTTP Response 받기

```java
Map<String, Object> httpBody = response.getBody()
(int) httpBody.get("codeLen")
```

`getBody()` 메소드를 사용하면 채점서버에서 보낸 HTTP Response에서 바디를 얻을 수 있다.  값을 꺼낼때는 `get("키값")` 메소드를 사용하면 된다. 단, 꺼낸 값은 `Object` 타입이기 때문에 원하는 자료형으로 캐스팅을 해줘야 한다.

### 레벨 기능
#### 레벨 enum

설계 단계에서는 int 형으로 레벨을 관리하기로 했지만, 유저와 관리자를 구분하는 role 필드와 통합하면 좋을 거 같다는 생각이 들어서 enum으로 묶기로 결정했다. 

```java
public enum Role {
    BRONZE("브론즈", 0),
    SLIVER("실버", 50),
    GOLD("골드", 100),
    PLATINUM("플래티넘", 150),
    DIAMOND("다이아몬드", 200);

    private final String roleName;
    private final int exp;
    private final double END = 200.0;
    private final int GAP = 50;
}
```

내부에 변수를 선언해서, 티어 간 경험치 간극과 경험치의 한계치를 설정했다. 구현 과정에서 관리자를 빼는 방향으로 가기로 결정했지만, 후에 추가하기 된다면 해당 enum 클래스에 추가만 하면 된다. 

#### 채점 결과 enum

```java
public enum Grade {
    CORRECT("정답"),
    INCORRECT("오답"),
    COMPILER_ERROR("컴파일 에러"),
    RUNTIME_ERROR("런타임 에러");

    private final String name;
}
```

채점 결과도 enum로 관리했다. 명시적으로 구분이 갈 뿐만 아니라 데이터베이스에 저장될 때 문자열이 아닌 정수형으로 관리할 수 있기 때문에 enum으로 관리했다. 

#### 경험치 획득

```java
List < Result > results = resultRepository.findByUserAndGrade(result.getUser(), result.getGrade());
boolean answer = result.getGrade().ordinal() == 0;
boolean duplicate = results.size() > 1;

problem.updateSubmitInfo(answer, duplicate);
if (!duplicate) user.solveProblem(problem.getLevel());

public void updateSubmitInfo(boolean answer, boolean duplicate) {
    this.submit++;
    if (answer) this.answer++;
    if (!duplicate) this.correct++;
}

public void solveProblem(int problemLevel) {
    exp += (problemLevel * 0.8);
    if (exp > this.role.getEND()) exp = this.role.getEND();
    if (exp > this.role.getExp() + this.role.getGAP()) role = Role.values()[this.role.ordinal() + 1];
}
```

경험치의 경우 문제를 최초로 맞췄을 때 획득할 수 있어야 한다. 이를 위해 이전에 맞춘적이 있는지 조회를 하고, 맞춘 적이 있다면 duplicate 변수가 true가 되서 경험치를 획득하지 못 하도록 한다. 또한, 정답의 유무에 따라 answer의 값이 달라진다. 

Problem 엔티티에는 제출 횟수, 정답 횟수 그리고 맞힌 사람을 관리한다. 정답 횟수는 코드 채점 결과가 맞은 경우에는 올라가고, 맞힌 사람은 최초로 맞은 사람들을 카운트한다. 

경험치를 획득했을 때, 다음 레벨로 올라갈 수 있는 경험치를 가지고 있는지와 최대 경험치를 넘었는지를 검사한다. 이를 통해 레벨업을 할 수 있고, 경험치의 한계를 넘지 않도록 할 수 있다.

## 마무리
채점서버에서 메인 서버로 응답을 보내는 내용은 별도의 [게시물](https://velog.io/@soundbar91/Flask)로 작성해야겠다. 약간 긴 느낌이 든다..
좀 많이 깨진 느낌을 받은 한 주였다. 채점 로직이 들어가니 처음 보는 내용들이 너무 많았고, 설계에서 부실한 내용이 많이 발견됐다. 주말내내 하다가 꺽일뻔했지만, 포기하지 않고 키보드에서 손을 때지 않았다. ~~(대단해)~~
이제 곧 있으면 마무리를 지어야한다. 채점서버, 이 친구 친해져서 잘 마무리 하고 샆다. 