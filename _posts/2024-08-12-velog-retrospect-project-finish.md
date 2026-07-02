---
title: "회고 프로젝트 - 마무리"
date: 2024-08-12T11:27:02Z
categories:
  - Project
excerpt: "해치웠나?"
---
## 서론
길다면 길고, 짧다면 짧은 회고 프로젝트가 어제부로 끝이 났다. 마지막 스퍼트로 이것저것 수정하고 추가하는 등 정신없이 진행했다. 이전 주차에서 추가 된 사항은 배포, Swagger 그리고 테스트 코드이다. 테스트 코드의 경우 추가 학습이 많이 필요해 보이고, 나머지는 얼추 잘 진행했다고 생각된다. 

## 본론
### Swagger
#### 정의

- 개발한 REST API 자동으로 문서화를 해주며, 테스트 환경도 제공해주는 프로젝트이다.
- 이를 통해 협업 과정에서 누구나 개발된 API를 확인할 수 있으며, 테스트 환경을 통해 제대로 동작하는지 확인할 수 있다.

#### 의존성 주입

```
implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.2.0'
```

- 해당 의존성을 주입하면 `localhost:8080/swagger-ui/index.html` 에서 API를 확인할 수 있다.

#### 설정 클래스

- Swagger를 사용하기 위해서는 설정 파일을 작성해야 한다.

```java
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
            .components(new Components())
            .info(apiInfo());
    }

    private Info apiInfo() {
        return new Info()
            .title("회고 프로젝트 API")
            .description("회고 프로젝트에서 구현된 API를 사용할 수 있습니다.")
            .version("1.0.0");
    }

}
```

- JWT를 사용하면 관련 설정을 추가해줘야 한다.
- 현재 프로젝트에서는 세션 쿠키를 사용하기 때문에 별도의 설정이 필요하지 않다.
- 사용되는 클래스는 다음과 같다.
    - Info : Swagger 설명을 담당하는 클래스이다.
    - OpenAPI : Swagger 전체적인 설정을 담당하는 클래스이다.

#### 컨트롤러

```java
@Tag(name = "유저 API")
public interface UserApi {

    @Operation(summary = "회원 가입")
    @ApiResponse(responseCode = "200", description = "회원 가입 성공", content = @Content(mediaType = "application/json"))
    @PostMapping("/user")
    ResponseEntity < ResponseUser > createUser(
        @Valid @RequestBody RequestCreateUser requestCreateUser
    );
    
public class UserController implements UserApi
```

- 기본적으로 컨트롤러를 기반으로 API를 자동화한다.
- 사용된 어노테이션은 다음과 같다.
    - Tag : 그룹화할 API 설정
    - Operation : 해당 API 설명
    - ApiResponse : 응답 코드 설명
    - 이 외에도 많은 [어노테이션](https://velog.io/@mj3242/Swagger-3.x-%EC%96%B4%EB%85%B8%ED%85%8C%EC%9D%B4%EC%85%98-%EC%A0%95%EB%A6%AC)이 존재한다.
- 컨트롤러 클래스에 Swagger 관련 어노테이션을 작성하면 코드가 매우매우 더러워진다.
    - 이를 해결하기 위해서, 컨트롤러 인터페이스를 선언하고 인터페이스 내부에 Swagger 관련 어노테이션을 작성한다.
    - 이후, 해당 인터페이스를 구현하면 된다.

#### DTO

```java
public record RequestCreateUser(
    @NotBlank(message = "아이디는 필수 입력 값입니다.") 
    @Schema(description = "유저 아이디", defaultValue = "testUser", requiredMode = REQUIRED) 
    String username,

    @NotBlank(message = "이메일은 필수 입력 값입니다.") 
    @Schema(description = "유저 이메일", defaultValue = "testUser@naver.com", requiredMode = REQUIRED) 
    String email,

    @NotBlank(message = "비밀번호는 필수 입력 값입니다.") 
    @Schema(description = "유저 비밀번호", defaultValue = "1q2w3e4r1!", requiredMode = REQUIRED) 
    String password
)
```

- Swagger에서는 API에서 사용되는 DTO에 대한 설정도 할 수 있다.
    - DTO를 스키마로 부르는 것 같다.
- @Schema 어노테이션을 통해 DTO 필드에 대한 설정을 할 수 있다.
    - description : 필드 설명
    - defaultValue : 테스트 기본값
    - requiredMode : 필수 여부
### 배포
[AWS로 서비스 배포하기](https://www.youtube.com/watch?v=JKmoBSEWHIs)를 참고하여 배포를 진행했다. 
- 배포 주소 : https://retrospect-project.n-e.kr/

## 마무리
사실 이것 이외에도 CORS, 화이트 리스트 그리고 데드락 등 다뤄본 내용이 많았지만 시간이 촉박해서 깊게 다루지 못했다. 관련 학습을 진행하고 정리해보는 글을 작성해봐도 좋을 것 같다. 
마무리를 지으면서 뭔가 하나둘씩 아쉽다는 생각이 들었다. 조금 더 깊이 있게 진행할 수 있었지 않았을까라는 생각부터 시간 관리가 잘 안됐다는 등 이런저런 생각이 들었다. 기회가 또 생긴다면 지금 느끼는 생각들을 개선하기 위해 노력해야겠다. 
이제 미뤘던 알고리즘 문제도 풀면서 면접 준비를 해야겠다. 