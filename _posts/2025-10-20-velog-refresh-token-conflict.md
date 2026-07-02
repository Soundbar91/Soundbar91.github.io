---
title: "리프레쉬 토큰 충돌 개선"
date: 2025-10-20T13:46:40Z
categories:
  - Spring
excerpt: "로그인이 자꾸 풀려요"
---
## 서론

2024년 하반기 User팀에 속해있을 때, 모바일에서 종종 자동 로그인이 풀리면서 에러화면이 나온다고 제보를 받았다. 당시에는 졸업학점계산기를 구현하고 있어 해당 작업을 진행하지 못 했다. 2025년 졸업학점계산기를 배포하고, 아직 해결되지 않은 문제로 남아있길래 해당 작업을 진행했다.

## 본론

### 자동 로그인이 풀리는 이유

로그인을 하면, JWT 엑세스 토큰과 UUID 리프레쉬 토큰을 발급받게 된다. JWT 엑세스 토큰은 쿠키, UUID 리프레쉬 토큰은 로컬 스토리지에 저장된다(모바일은 내부 저장소에 저장된다고 한다). 서버는 UUID 리프레쉬 토큰을 Redis에 저장하고, JWT 엑세스 토큰은 저장하지 않는다.

JWT의 경우 서버에 저장을 하지 않기 때문에, 어떤 플랫폼에서든 JWT 엑세스 토큰을 가지고 요청을 보낸다면 JWT 토큰의 유효시간이 만료되지 않는 이상 인증에 성공한다. 하지만, UUID 리프레쉬 토큰은 서버에 저장되어 있고 리프레쉬 토큰 구조의 문제로 인해 자동 로그인이 풀리는 문제가 발생한다. 사진을 통해 플로우를 알아보자.

### 자동 로그인이 풀리는 플로우

![](/assets/images/velog/8bfd38b9-9fb5-4798-ad39-affbe8b22d82-image.png)

웹 환경에서 로그인을 시도하면, 응답값으로 엑세스 토큰과 리프레쉬 토큰(A)가 나간다. 서버는 user_id를 키값으로 리프레쉬 토큰(A)를 Redis에 저장한다.

![](/assets/images/velog/f8f9da1c-8259-4bc4-b82a-c99050a45054-image.png)

이후에 모바일 환경에서 로그인을 시도하면, 응답값으로 엑세스 토큰과 리프레쉬 토큰(B)가 나간다. 서버는 user_id를 키값으로 리프레쉬 토큰(B)를 Redis에 저장하는데, 이 과정에서 웹에 발급해준 리프레쉬 토큰(A)가 무효화가 된다. 왜냐하면, user_id에는 하나의 리프레쉬 토큰만 대응되는 구조이기 때문이다. 코드를 보면 다음과 같다.

```java
@Getter
@RedisHash("refreshToken")
public class UserToken {

    private static final long REFRESH_TOKEN_EXPIRE_DAY = 90L;

    @Id
    private Integer id;

    private final String refreshToken;

    @TimeToLive(unit = TimeUnit.DAYS)
    private final Long expiration;

    private UserToken(Integer id, String refreshToken, Long expiration) {
        this.id = id;
        this.refreshToken = refreshToken;
        this.expiration = expiration;
    }

    public static UserToken create(Integer userId, String refreshToken) {
        return new UserToken(userId, refreshToken, REFRESH_TOKEN_EXPIRE_DAY);
    }
}
```

![](/assets/images/velog/6bf8ea97-e2e3-463c-84d3-fa6e645bb3b2-image.png)

리프레쉬 토큰(A)가 무효화가 된 상태에서 웹이 리프레쉬 요청을 하면 어떻게 될까? 서버에서 관리하고 있는 리프레쉬 토큰(B)와 불일치하기 때문에 400 에러를 뱉고, 자동 로그인이 풀리게 된다. 

### 1차 해결

리프레쉬 토큰을 플랫폼 간 다르게 발급하지만, 서버에서는 user_id 당 한 개의 리프레쉬 토큰을 관리하는 것이 문제임을 플로우를 통해 확인할 수 있다. 그렇다면, 서버에서 user_id에 대응하는 플랫폼 별로 리프레쉬 토큰을 발급하게 된다면 문제를 해결할 수 있지 않을까?

코인 서비스에서는 [A/B 테스트](https://velog.io/@songsunkook/AB%ED%85%8C%EC%8A%A4%ED%8A%B8-%EB%8F%84%EA%B5%AC-%EA%B0%9C%EB%B0%9C-%EA%B3%BC%EC%A0%95)를 진행하고 있으며, 이 과정에서 UserAgent를 식별하기 위한 로직이 서버에 구현되어 있다. 

> **User-Agent**
클라이언트의 이름, 버전, 운영체제 정보 등을 서버에 알려주는 HTTP 헤더
> 

해당 로직을 반영한 로그인, 리프레쉬 컨트롤러 메소드 코드는 다음과 같다.

```java
@PostMapping("/v2/users/login")
public ResponseEntity<UserLoginResponse> loginV2(
    @RequestBody @Valid UserLoginRequestV2 request,
    @UserAgent UserAgentInfo userAgentInfo
) {
    UserLoginResponse response = userService.loginV2(request, userAgentInfo);
    return ResponseEntity.created(URI.create("/")).body(response);
}
    
@PostMapping("/user/refresh")
public ResponseEntity<UserRefreshTokenResponse> refreshToken(
    @RequestBody @Valid UserRefreshTokenRequest request,
    @UserAgent UserAgentInfo userAgentInfo
) {
    UserRefreshTokenResponse response = userService.refresh(request, userAgentInfo);
    return ResponseEntity.created(URI.create("/")).body(response);
}
```

UserAgent 어노테이션을 확인해서 파라미터 인자를 넣어주는 ArgumentResolver이 구현되어 있기 때문에, 클라이언트에서 보내는 UserAgent를 통해 플랫폼을 구별할 수 있다.

플랫폼을 구별할 수 있게 되었으니, 리프레쉬 토큰의 구조 또한 변경을 해야한다. 

```java
@Getter
@RedisHash(value = "refreshToken")
public class RefreshToken {

    private static final long REFRESH_TOKEN_EXPIRE_DAY = 90L;
    private static final String REFRESH_TOKEN_KEY_FORMAT = "%d:%s";
    private static final String REFRESH_TOKEN_FORMAT = "%s-%d";

    @Id
    private String id;

    private String token;

    @TimeToLive(unit = TimeUnit.DAYS)
    private Long expiration;

    private RefreshToken(String id, String token, Long expiration) {
        this.id = id;
        this.token = token;
        this.expiration = expiration;
    }

    public static RefreshToken create(Integer userId, String refreshToken, String platform) {
        return new RefreshToken(
            String.format(REFRESH_TOKEN_KEY_FORMAT, userId, platform),
            String.format(REFRESH_TOKEN_FORMAT, refreshToken, userId),
            REFRESH_TOKEN_EXPIRE_DAY
        );
    }

    public static String generateKey(Integer userId, String platform) {
        return String.format(REFRESH_TOKEN_KEY_FORMAT, userId, platform);
    }
}
```

하나의 user_id 당 여러 개의 리프레쉬 토큰을 잡기 위해, 키 값의 포멧을 `{user_id}:{platform}` 으로 변경했다. 이렇게 되면, 서버는 user_id가 1인 사용자의 웹과 모바일 환경의 리프레쉬 토큰을 모두 관리할 수 있게 된다.

이렇게 [작업](https://github.com/BCSDLab/KOIN_API_V2/pull/1373)을 하고, 스테이지 환경에 머지를 했으나..

### 1차 작업 리버트

안드로이드 인원에게 테스트 앱을 받아, 웹과 모바일 환경에서 테스트를 진행했다. 하지만, 여전히 로그인이 풀리는 문제가 발생했다. 무슨 이유인지, 데이터 독을 통해 웹과 모바일 환경에서 요청이 어떻게 들어오는지 확인을 했다. 

확인 결과, 모바일 환경 요청의 UserAgent가 Okhttp로 들어오고 서버에서 기본값인 PC로 분류하는 상황이였다. 그렇기 때문에 웹 환경의 리프레쉬 토큰이 충돌이 나고, 로그인이 풀리는 상황이였다. 급히, 해당 PR을 [리버트](https://github.com/BCSDLab/KOIN_API_V2/pull/1377)를 하고 2차 문제해결로 넘어갔다.

### 2차 작업

안드로이드 개발자에게 UserAgent를 식별가능한 형태로 보내달라고 요청하면 된다. 슬랙으로 물어보니, 딸깍이라는 답변을 받았고 빠른 시일내에 [작업](https://github.com/BCSDLab/KOIN_ANDROID/pull/721)을 진행해주셨다. 작업이 반영된 테스트 앱을 받아서, 테스트를 진행하는데 여전히 Okhttp로 들어와서 슬랙 허들로 같이 무슨 [문제](https://github.com/BCSDLab/KOIN_ANDROID/pull/763)인지 찾기도 했다. 

안드로이드를 확인하고, IOS를 확인해보니 UserAgent가 식별 가능한 형태로 들어오지만, 서버에서 분류하지 않는 문제가 있어서 이 또한 [반영](https://github.com/BCSDLab/KOIN_API_V2/pull/1603)하고 리버트한 [PR](https://github.com/BCSDLab/KOIN_API_V2/pull/1651)을 다시 올렸다.

### 해치웠나?

스테이지 환경에 머지를 하고 리프레시 토큰이 플랫폼 별로 잡히는 것을 확인하고, 일주일 간 테스트를 진행했다. 생각날 때마다, 테스트 앱과 스테이지 웹 환경을 들어가는 것이 다였다. 다행이도, 로그인이 풀리는 현상은 발생하지 않았다. 

이전 버전의 안드로이드 앱을 사용할 경우 UserAgent가 Okhttp로 들어오기 때문에 여전히 문제가 발생하는 상황이다. 이 경우에는 강제업데이트를 진행해야겠지만, 강제업데이트를 진행할 만큼의 크리티컬한 사안이 아니라고 생각했고 코인 사용자들은 업데이트를 주기적으로 잘하고 있다고 DA에게 전달받아서 진행하지 않았다. 

### 트래킹

2025년 6월 20일, 프로덕션에 [올라갔다](https://github.com/BCSDLab/KOIN_API_V2/pull/1674). 이후 데이터를 트래킹했다.

![](/assets/images/velog/71929381-1a7d-47f4-899c-28fbbc73a4fc-image.png)

6월 1일부터 7월 11일까지의 에러율은 76.1%이다. 7월 11일까지로 잡은 이유는 계절학기 종강일이기 때문이다. 

![](/assets/images/velog/0103edaf-9538-4d77-9bd8-561b7c7c2d40-image.png)

7월 11일부터 10월 20일까지의 에러율은 38.7%이다. 약 49.1% 감소했다. 

트래킹하는 과정에서 400 에러가 분당 수십번 발생하는 것을 발견했다. 

![](/assets/images/velog/dd573204-c6ce-4b8b-819c-0bd8e50dc060-image.png)

해당 에러는 IOS에서 발생하는 것이였고, 비로그인 상태/리프레시 토큰이 없는 상태에서도 리프레쉬 API를 호출하는 것을 IOS 개발자와의 대화를 통해 알게 됐고 수정 요청을 드렸다.

![](/assets/images/velog/7cfd7c30-fb57-471e-aa6b-0b7e97eb7944-image.png)

## 결론

하위 버전 앱 사용자로 인해 에러율 개선 여부의 신뢰성이 떨어지지만, 지속적으로 발생하던 로그인이 풀리는 현상을 해겼했다는 점에서 의의를 가질 수 있다. 

여러 플랫폼에 영향을 미치는 작업을 진행할 때는 각 플랫폼에서 어떻게 처리하고 있고 어떻게 받고 있는지 등 플랫폼 상황을 파악해야 함을 배울 수 있었다. 그렇지 않는다면 일을 두 번 해야 하기 때문이다. 작업 전에 체크리스트라도 작성해야겠다는 생각이 들었다.

문제를 해결하는 과정에서 클라이언트에서 발생하는 문제도 발견할 수 있었다. 어떤 API가 호출됐는지 보여주는 테스트 앱이 있으면 좋겠다라는 생각이 들었다.