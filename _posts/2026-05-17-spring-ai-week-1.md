---
title: "초록 스터디 - Spring AI 1주차"
date: 2026-05-17
categories:
  - Spring
excerpt: "Spring AI를 활용해 고객지원 챗봇을 구현하고 테스트한 과정을 다뤄보자."
---

## 서론
![](/assets/images/posts/spring-ai-week-1/01-image.png)
초록스터디 디스코드 채널에 `Spring AI 클로즈 베타 참가자 모집` 글이 올라왔다. 주어진 요구사항을 해결하며 Spring AI에 대해 학습하고, 실무에서 발생하는 문제를 경험할 수 있음을 글을 통해 확인할 수 있었다. 내가 ㅂ타 참가자에 신청한 이유는 다음과 같다.
- Spring AI를 다뤄보고 싶었다.
- 새로운 도파민을 얻고 싶었다.
이번 글에서는 1주차 동안 진행한 내용을 다룰 것이다.
## 본론
### Spring AI
OpenAI, Claude와 같은 AI API를 스프링에서 호출하기 위해서는 RestTemplate와 같은 HTTP 통신 클래스를 사용해야했다. API 호출 후에도 응답값 파싱 등 부가적인 로직을 개발자가 직접 구현해야하는 번거러움이 존재했다. 또한, 여러 AI 벤더가 존재하기 때문에 사용하던 AI 벤더를 변경한다면 그에 맞도록 코드를 수정해야하는 번거러움이 존재했다.
Spring AI에서는 여러 AI 벤더를 추상화하고, AI를 Spring의 개발 철학에 맞게 사용할 수 있도록 API를 제공해주는 프레임워크로 이해했다.
### 요구사항
> 리파지토리는 [https://github.com/cho-log/spring-ai-bootcamp-basic](https://github.com/cho-log/spring-ai-bootcamp-basic)에서 확인할 수 있다.
내가 이해한 요구사항의 큰 틀은 다음과 같다.
1. 제공되는 데이터(FAQ, Policy, Chatlog)를 모두 활용하고, OpenAI API를 사용하여 챗봇을 구현한다.
2. 제공된 스크립트를 통해 테스트 질문 150개의 검증을 모두 통과한다.
여기서 OpenAI API는 `ChatClient` 를 통해 호출하고, 모든 응답값에는 토큰 사용량을 반환해야한다. 
### 환경 파악
요구사항을 해결하기 위해 우선적으로 프로젝트 환경을 파악했다. 제공된 데이터는 다음과 같았다.
- FAQ : 자주 물어보는 질문에 대한 답변이 작성된 마크다운 파일로 존재했다.
- Policy : 현재 진행중인 정책, 폐지된 정책 그리고 내부 정책이 마크다운 파일로 존재했다.
- Chatlog : 고객과 상담원의 대화 이력이 jsonl로 존재했다.
이 3개의 파일을 OpenAI API를 호출할 때, 질문과 같이 던져줘야겠다는 생각이 들었다. 

또한, 테스트 질문은 json으로 관리되고 있었으며 내부에서 핵심적으로 봐야하는 데이터는 다음과 같다.
- question_ko : 한국어로 된 질문이다. 
- expected_answer : 기대하는 답변이며, 영어로 작성되어 있다.
- tier : 테스트 질문의 난이도이다. easy, medium 그리고 hard의 값을 가진다.
- source_layers : 질문과 관련된 문서의 경로이다. 
`expected_answer` 를 통해 어떤 내용까지 챗봇이 답변을 해야할지를 추후 개선할 때 참고하면 될 거 같고, `source_layers` 를 통해 챗봇의 답변이 틀렸을 때 어디에 정확한 데이터가 있는지 확인할 수 있을 거 같다.
### 초기 설계
요구 사항과 프로젝트 초기 내용을 확인 후 작성한 설계 및 플로우는 다음과 같다.
- ChatController : API 핸들링
- ChatService : 구현 로직이 들어갈 거 같은데, 일단 다 때려 박고 동작한 다음에 클래스를 분리하든가 하자
	- data를 OpenAI로 넘긴다.
	- OpenAI에게 질문을 한다.
	- OpenAI로부터 토큰 사용량을 포함한 답변을 받는다.
	- 컨트롤러로 응답값으로 넘긴다.
- QuestionAskRequst : API 요청 DTO
- QuestionAskResponse : API 응답 DTO
동작을 해야 코드를 개선할 여지가 있기 때문에, 우선적으로는 하나의 Service 클래스에 구현 로직을 모두 넣는 것을 생각했다.
### 학습
Controller, Service, DTO를 만드는 건 항상 해왔던 거였기 때문에 큰 문제는 없다. 하지만, Service에서 구현하는 코드는 Spring AI를 활용해야하기 때문에 학습이 필요하다. 먼저 `ChatClient` 를 사용해야한다고 명시가 되어 있기 때문에 이 부분를 먼저 알아봤다.

**ChatClient**
AI 모델과 통신을 담당하는 인터페이스이다. `ChatModel` 이라는 인터페이스를 주입 받아 생성할 수 있다. 
```java
@Service
public class ChatService {

    private final ChatClient chatClient;

    public ChatService(ChatModel chatModel) {
        this.chatClient = ChatClient.builder(chatModel).build();
    }
    ..
}
```

`ChatClient` 는 `prompt()` 메소드를 통해 AI에게 전달할 프롬포트를 설정할 수 있다.
- prompt() : 체이닝으로 유저, 시스템 프롬포트를 설정할 수 있다.
	```java
chatclinet.prompt()
					.system(/* 시스템 프롬프트 */)
					.user(/* 유저 프롬프트 */)
	```
- prompt(Prompt prompt) : Prompt 인스턴스를 직접 전달할 수 있다.
- prompt(String content) : 유저 프롬포트만 전달할 수 있다.

이렇게 프롬포트 설정이 끝났다면 체이닝으로 `call()` 을 호출하여 AI에게 프롬프트를 전달할 수 있다. 이후 응답값은 체이닝으로 `chatResponse()` 을 호출하여 `ChatResponse` 클래스로 받을 수 있다.
```java
ChatResponse chatResponse = chatclinet.prompt()
																			.system(/* 시스템 프롬프트 */)
																			.user(/* 유저 프롬프트 */)
																			.call()
																			.chatResponse();
```
`ChatResponse` 클래스가 아닌 별도의 응답값으로 받고 싶다면 체이닝으로 `entity` 를 호출하면 된다. AI에게 프롬프트를 전달하기 전 컨버터가 프롬프트에 응답 형식을 지정하는 지시문을 추가한다. 자세한 내용은 [공식 문서](https://docs.spring.io/spring-ai/reference/api/structured-output-converter.html)를 참고해보면 될 거 같다.
```java
EntityClass entityClass = chatclinet.prompt()
																		.system(/* 시스템 프롬프트 */)
																		.user(/* 유저 프롬프트 */)
																		.call()
																		.entity(EntityClass.class);
```
추가적인 내용은 [공식 문서](https://docs.spring.io/spring-ai/reference/api/chatclient.html#_creating_a_chatclient)를 참고해보면 될 거 같다.

**ChatModel**
![](/assets/images/posts/spring-ai-week-1/02-image.png)
`ChatModel` 은 사용자가 사용하고자 하는 AI 모델을 의미하는 인터페이스이다. 각 벤더들은 `ChatModel` 를 구현하고 있다.  `ChatModel` 의 경우 Config 클래스를 통해 직접 설정할 수 있고, 스프링 부트 설정을 통해 스프링 애플리케이션이 부팅하는 과정에서 발생하는 AutoConfiguration에서 자동으로 주입이 된다. 
```yaml
spring:
  application:
    name: spring-ai-bootcamp-basic
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      chat:
        options:
          model: gpt-4.1-nano
          temperature: 0.1
```
현재는 OpenAI의 gpt-4.1-nano로 설정되어 있음을 알 수 있다. 또한, 각 벤터에 맞는 의존성을 주입해야한다.
```groovy
dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-model-openai'
}
```
### OpenAI API 연동
위에서 학습한 내용을 바탕으로 OpenAI API 연동을 진행했다.
```java
@Service
public class ChatService {

    private final ChatClient chatClient;

    public ChatService(ChatModel chatModel) {
        this.chatClient = ChatClient.builder(chatModel).build();
    }

    public QuestionAskResponse askQuestion(QuestionAskRequest request) {
        ChatResponse chatResponse = chatClient.prompt(request.question())
            .call()
            .chatResponse();
        Usage usage = chatResponse.getMetadata().getUsage();

        return QuestionAskResponse.from(
            chatResponse.getResult().getOutput().getText(),
            usage.getPromptTokens(),
            usage.getCompletionTokens(),
            usage.getTotalTokens()
        );
    }
}

```
- ChatClient를 Config 클래스를 통해 Bean으로 등록하고 주입을 받을 수 있지만, 일단 연동이 목적이기 때문에 향후에 진행할 예정이다.
- 토큰 사용량을 응답에 포함해야하기 때문에 응답값에서 추출했다. 이 부분은 공식문서에서 찾지 못하여 직접 내부 코드를 확인했다.
	- PromptTokens : 질문/프롬프트에 사용된 토큰 수
	- CompletionTokens : AI가 응답 생성에 사용한 토큰 수
	- totalTokens: 둘을 합친 전체 토큰 수
	> 나중에 찾아보니 있었다.. [Using Chat/Embedding Response Usage :: Spring AI Reference](https://docs.spring.io/spring-ai/reference/api/usage-handling.html)

Postman을 통해 테스트를 진행하여 응답이 잘 나옴을 확인할 수 있었다.
![](/assets/images/posts/spring-ai-week-1/03-image.png)
### 데이터 연동
OpenAI API 연동이 잘됨을 확인했으니 이제 사전에 제공된 데이터를 OpenAI API에 넘겨줘야 한다. 우선 FAQ 마크다운 파일을 읽어야 한다. 관련해서 구현한 코드는 아래와 같다.
```java
private String getFAQ() {
    StringBuilder sb = new StringBuilder();

    File file = new File("data/layer1_faq");
    File[] files = file.listFiles();

    for (File fs : files) {
        sb.append(fs.getName()).append('\n');
        try (BufferedReader br = new BufferedReader(new FileReader(fs))) {
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line).append('\n');
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    return sb.toString();
}
```
- 알고 있는 내용 중 파일 내용을 읽는 방법은 File 클래스를 활용하는 방법이여서 적용을 했다.
- 하나의 파일을 읽기 전에 해당 파일 제목을 추가하여 어떤 내용과 관련이 있는지 확인할 수 있도록 유도했다.

이후 `ChatClient` 를 호출하는 부분에서 FAQ를 활용할 수 있도록 코드를 수정했다.
```java
public QuestionAskResponse askQuestion(QuestionAskRequest request) {
    String faq = getFAQ();

    ChatResponse chatResponse = chatClient.prompt()
        .system("""
            당신은 초록 코퍼레이션에서 고객지원 챗봇을 담당하는 역할입니다.
            제공된 문서를 참고하여 고객에게 답변을 해주세요.
            모든 응답은 한국어로 해야하며, 초록 코퍼레이션과 무관한 내용은 다루지 마세요.
                
            %s
            """.formatted(faq))
        .user(request.question())
        .call()
        .chatResponse();
    Usage usage = chatResponse.getMetadata().getUsage();

    return QuestionAskResponse.from(
        chatResponse.getResult().getOutput().getText(),
        usage.getPromptTokens(),
        usage.getCompletionTokens(),
        usage.getTotalTokens()
    );
}
```
- `prompt(String context)` 에서 `prompt()` 으로 수정하여 유저, 시스템 프롬프트를 설정했다.
- 시스템 프롬프트로 다음 내용을 명시했다.
	- 역할
	- 답변 간 제약사항
	- 참고자료(FAQ)

데이터가 제대로 전달되고 있음을 확인하기 위해 검증 스크립트를 실행했고, 결과가 나옴에 따라 잘 전달되고 있음을 확인할 수 있었다. 
![](/assets/images/posts/spring-ai-week-1/04-image.png)
150개의 질문 중 66개의 질문에 대한 답변이 예상 답변과 일치함을 확인할 수 있다. 
### 테스트
OpenAI API와 제공된 데이터 모두 연결을 완료했다. 이제 검증 스크립트를 통과해야한다. 앞서, FAQ만 제공했기 때문에 Policy도 제공하고 테스트를 진행했다. 
![](/assets/images/posts/spring-ai-week-1/05-image.png)
`66개 질문에서 77개 질문`으로 약 11개가 늘어남을 확인할 수 있었다. 

Chatlog의 경우 굳이 지금 넣어야하는 의문이 들었다. 왜냐하면, Chatlog도 결국은 FAQ와 Policy를 기반으로 답변을 했기 때문이다. 오히려 폐지된 Policy에 대해서 의구심이 들었다. 챗봇에게 필요한 정보일까? 불필요하게 컨텍스트를 잡아먹을 수 있다라는 생각이 들었고, 바로 테스트를 진행했다.
![](/assets/images/posts/spring-ai-week-1/06-image.png)
`77개 질문에서 80개 질문` 으로 3개 정도 늘었다. 각 난이도에서 50% 정도의 검증률이 보이고 있고, 소요시간은 약 7분정도 걸린다. 
### 2주차에서 해야할 일
테스트 이후에 토큰 사용량을 확인하기 위해 로깅을 추가했고, 입력 토큰 소모량이 9600임을 확인할 수 있었다.
![](/assets/images/posts/spring-ai-week-1/07-image.png)
2주차에는 이 토큰 소모량을 개선하기 위해 고민을 할 거 같다. 또한, 검증 결과도 개선되어야 하기 때문에 적용할 수 있는 방법을 찾아 적용해야 한다. 
## 마무리
1주차는 이렇게 마무리했다. 새로운 기술을 배우니, 취준에 찌들어있던 삶에 새로운 도파민이 돌기 시작했다. 공식 문서를 읽고 이렇게 학습해 본 경험이 거의 없어서 익숙하지 않았지만, AI 디톡스 겸 해볼 만하다고 생각했다. 2주차도 잘 진행하여 마무리를 잘 지었으면 좋겠다.

