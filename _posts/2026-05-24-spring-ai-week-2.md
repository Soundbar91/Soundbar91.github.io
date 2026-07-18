---
title: "초록 스터디 - Spring AI 2주차"
date: 2026-05-24
categories:
  - Spring
excerpt: "Spring AI의 RAG와 벡터 스토어를 활용해 챗봇 정확도를 개선한 과정을 다뤄보자."
---

## 서론
1주차에 이어 2주차에도 초록 스터디 Spring AI 챗봇 만들기를 진행했다. 이번 주차에는 토큰 사용량 개선, 정확도 개선에 중점을 두고 작업을 진행했다.
## 본론
### 사전 지식
1주차에서는 제공되는 데이터를 모두 AI에게 컨텍스트로 제공했기 때문에, 토큰 소모량이 9000이었다. 매번 질문을 할 때마다, 모든 문서의 내용을 제공하고 답변을 한다면 토큰 소모량이 어마어마하게 나올 것이다. 
이를 해결하기 위해서는 답변하는데 필요한 데이터만 AI에게 컨텍스트로 제공하는 방법이 하나 있다. 필요한 데이터들만 제공하기 위해서는 어떻게 해야할까? 

**Embedding**
답변하기 위해 참고할 문서를 찾아서 AI에게 제공하면 된다. 참고할 문서를 컴퓨터가 어떻게 찾을 수 있을까? 이때 `임베딩`이라는 기술이 사용된다. 임베딩은 데이터를 의미적 관계가 보존되는 벡터 공간으로 변환하는 방법이다. 즉, 자연어를 수치화된 벡터 형태로 변환하는 과정이다. 
예시를 하나 들어보자. “나는 사람입니다”라는 문장이 있다. 이를 임베딩하면 \[0.4, 0.51, 0.43, 0.42\]와 같은 벡터로 표현할 수 있다. 유사한 문서를 찾는 것과 데이터를 벡터로 바꾸는 것이 무슨 연관관계가 있을까?

**Cosine Similarity**
위에서 임베딩은 `의미적 관계가 보존되는 벡터 공간으로 변환` 하는 방법이라고 언급했다. 그렇다면, 유사한 의미를 가진 문장들을 임베딩한다면 벡터의 형태가 비슷할 것이다. 벡터의 형태가 비슷한지, 즉 두 벡터의 유사도를 확인할 수 있는 방법이 `코사인 유사도` 이다. 코사인 유사도는 두 벡터가 이루는 각도의 코사인 값으로 둘이 얼마나 비슷한지를 나타낸다. 
![](/assets/images/posts/spring-ai-week-2/01-image.png)
사진과 같이 방향이 동일할 경우 1, 직교를 이루면 0 그리고 방향이 반대일 경우 -1의 값을 가지게 된다. 여기서 알 수 있는 사실은 임베딩 된 문장의 의미가 유사하다면 비슷한 방향을 가질 것이고, 즉 코사인 유사도가 1에 가까울수록 두 문장의 의미가 비슷함을 알 수 있다.
여기까지 봤을 때 우리가 해야할 작업은 데이터를 임베딩하고 질문과 코사인 유사도가 유사한 데이터를 찾아서 AI에게 제공하면 됨을 알 수 있다. 이를 코드로 구현을 해야하는데, 어떻게 구현해야 할까?

**VectorStore**
Spring AI에서는 `VectorStore`라는 인터페이스를 제공한다. 보통 임베딩된 데이터는 벡터 저장, 유사도 검색을 제공하는 데이터베이스 혹은 벡터 데이터베이스에 저장한다. 전자의 경우 PostgreSQL에서 확장 기능으로 제공되는 pgvector, 후자의 경우 Pinecone, Milvus 등이 있다. 
현 프로젝트에서는 별도의 벡터 데이터베이스를 다루기에는 규모가 크지 않다고 판단되어, Spring AI에서 인메모리로 제공하는 벡터 저장소를 활용할 것이다. 
```java
@Configuration
public class VectorStoreConfig {

    @Bean
    public VectorStore vectorStore(EmbeddingModel embeddingModel) {
        return SimpleVectorStore.builder(embeddingModel).build();
    }
    ..
}
```
- EmbeddingModel
	- 임베딩을 하는 과정에서 필요한 모델이다.
	- 환경변수 혹은 설정파일 클래스를 통해 선언할 수 있다.
		```yaml
spring:
  ai:
    openai:
      embedding:
        options:
          model: text-embedding-3-small
		```
- SimpleVectorStore
	- Spring AI에서 제공하는 인메모리 벡터 저장소이다.
### ETL Pipeline
![](/assets/images/posts/spring-ai-week-2/02-image.png)
위에서 배운 내용을 가지고 종합한다면 `데이터 임베딩 -> 벡터를 저장소에 저장 -> 코사인 유사도를 통해 벡터 저장소에서 유사 문서 검색 -> 질문과 유사 문서를 AI 컨텍스트로 제공` 플로우로 진행하면 된다. 이러한 플로우를 `ETL Pipeline` 이라고 한다. ETL은 `Extract, Transform, and Load` 의 약어이다.

**Extract**
한글로 번역하자면 `발췌, 추출물`이다. 데이터를 추출하는 과정임을 예측할 수 있다. Spring AI에서는 `Document` 클래스의 형태로 데이터를 추출하고, `DocumentReader` 인터페이스의 구현체를 통해 데이터를 추출한다. 구현체는 파일 확장자에 맞게 모두 구현되어 있으며 [공식 문서](https://docs.spring.io/spring-ai/reference/api/etl-pipeline.html#_documentreaders)에서 확인할 수 있다.
**Transform**
Extract 단계에서 데이터를 Document 클래스로 변환해서 가져왔다면, Transform 단계에서는 AI 컨텍스트에 맞게 Document를 분할하거나, 키워드나 요약 등의 메타데이터를 추가할 수 있다. `DocumentTransformer` 인터페이스의 구현체를 활용할 수 있으며 [공식 문서](https://docs.spring.io/spring-ai/reference/api/etl-pipeline.html#_transformers)에서 확인할 수 있다.
**Load**
최종적으로 나온 Document를 파일 혹은 데이터베이스에 저장하는 단계이다. `DocumentWriter` 인터페이스의 구현체를 통해 파일 시스템에 저장하거나 데이터베이스에 저장할 수 있다. 이 또한 [공식 문서](https://docs.spring.io/spring-ai/reference/api/etl-pipeline.html#_writers)를 통해 구현체의 정보를 확인할 수 있다. 위에서 언급한 VectorStore가 여기에 해당된다.

우리 프로젝트에서는 어떻게 적용을 했을까? 먼저, DocumentReader와 DocumentTransformer 인터페이스의 구현체를 사용하지 않고 직접 변환하는 로직을 구현했다. 그 이유는 다음과 같다.
- 제공된 데이터 레이어마다 데이터 양식이 정형화되어 있다.
	- FAQ는 `###` 하위에서 정보를 다룸
	- Policy는 메타 데이터 포멧과 `##` 하위에서 정보를 다룸
	- Chatlog는 동일한 포멧의 `JSON` 으로 정보를 다룸
	→ 토큰 분할이 불필요하다고 판단
- 메타 데이터를 추출하기 위해서 추가적인 후처리가 필요하다.
	- DocumentTransformer에서 키워드, 요약의 메타데이터를 추출할 수 있지만 임베딩할 때마다 AI 모델을 사용하기 때문에 비용이 발생한다.

각 데이터를 읽는 Reader 클래스를 구현하고, 애플리케이션이 시작되면 VectorStore에 임베딩되도록 다음과 같이 설정했다.
```java
@Configuration
public class VectorStoreConfig {

		...
		
    @Bean
    public ApplicationRunner vectorStoreInitializer(
        FaqReader faqReader,
        CurrentPolicyReader currentPolicyReader,
        InternalPolicyReader internalPolicyReader,
        ChatLogReader chatLogReader,
        VectorStore vectorStore
    ) {
        return args -> {
            List<Document> documents = new ArrayList<>();
            documents.addAll(faqReader.read());
            documents.addAll(currentPolicyReader.read());
            documents.addAll(internalPolicyReader.read());
            documents.addAll(chatLogReader.read());

            vectorStore.add(documents);
            log.info("Loaded {} documents into VectorStore", documents.size());
        };
    }
}
```

이후 AI에게 질의를 던지기 전 VectorStore에서 데이터를 찾을 수 있도록 다음과 같이 코드를 수정했다.
```java
public class ChatService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;

    public QuestionAskResponse askQuestion(QuestionAskRequest request) {
        SearchRequest searchRequest = SearchRequest.builder()
            .query(request.question())
            .build();

        List<Document> documents = vectorStore.similaritySearch(searchRequest);
        String context = documents.stream()
            .map(Document::getText)
            .collect(Collectors.joining("\n\n"));

        ChatResponse chatResponse = chatClient.prompt()
            .system("""
                당신은 초록 코퍼레이션에서 고객지원 챗봇을 담당하는 역할입니다.
                제공된 문서를 참고하여 고객에게 답변을 해주세요.
                모든 응답은 한국어로 해야하며, 초록 코퍼레이션과 무관한 내용은 다루지 마세요.
                
                %s
                """.formatted(context))
            .user(request.question())
            .call()
            .chatResponse();
		...
}
            
```
- SeachRequest : VectoStore에서 유사도 검색을 요청하기 위해 필요한 클래스이다.
	- query : 유사도 검색에 사용할 질의이다.
	- topK : 유사도가 높은 Document 중 상위 몇개를 가져올지 설정하는 옵션이다.
	- similarityThreshold : 0 \~ 1의 값을 같은 유사도 중, 설정된 값 이상의 유사도 값을 갖는 Document를 가져온다
### 1차 테스트
![](/assets/images/posts/spring-ai-week-2/03-image.png)
1차 테스트에서 확인할 수 있는 내용은 다음과 같다.
- 정확도의 경우 1개 증가했다.
- 소요 시간이 454초에서 392초로 약 60초가 감소했다.
- 토큰의 경우 9746에서 592로 감소했다.
	![](/assets/images/posts/spring-ai-week-2/04-image.png)
정확도 개선은 미미했지만, 토큰 사용량 개선은 잘 됐음을 확인할 수 있다.
### 정확도 개선
정확도 개선을 위해서는 어떻게 작업을 진행해야할까? 우선, 어떤 질문에서 어떠한 이유로 틀렸는지를 확인해야한다. 다행이도 검증 스크립트에서 틀린 이유를 확인할 수 있다. 모두 돌리면 시간이 매우 걸리니 우선적으로 10개의 질문에 대해서 진행해보자.
![](/assets/images/posts/spring-ai-week-2/05-image.png)
틀린 정보를 전달한 답변이 3개, 핵심 사실을 전달했지만 부가적인 정보가 빠진 답변이 2개임을 확인할 수 있다. 틀린 정보야 잘못된 컨텍스트가 제공되었는지, AI가 할루시네이션을 이르킨건지 디버깅을 통해 확인하면 될 거 같다. 하지만, 핵심 사실을 전달했지만 부가적인 정보가 빠진 답변을 했다고 해서 오답처리를 받은 것에 대해 의구심을 가졌다.

**검증 기준 수정**
`적립 포인트 1점은 얼마의 가치인가요?` 질문에서 기대하는 답변과 챗봇이 대답한 답변을 확인했다.
![](/assets/images/posts/spring-ai-week-2/06-image.png)
기대 답변을 번역하면, `1포인트는 1원과 같습니다. 포인트는 최소 1,000 포인트 이상 사용 시 주문에 사용할 수 있습니다.` 챗봇은 어떤 답변을 했을까?
![](/assets/images/posts/spring-ai-week-2/07-image.png)
질문에 적절한 답변을 했다고 생각했지만, 포인트가 얼마 이상 되어 주문에 사용할 수 있는지 정보를 전달하지 않아 오답처리가 됐다. 이 답변이 오답이라고 판단하는 기준은 개개인마다 다를 거 같다.
개인적인 생각은 질문에 대응되는 답변만 하더라도 적절한 정답이라고 생각한다. 경험상으로 AI에게 A를 물어봤을 때 B, C, D까지 답변한 경우가 많았다. 너무 많은 정보가 전달되어 다 읽다가 내가 무엇을 물어봤더라?라는 질문이 다시 생긴다. 즉, 너무 많은 정보를 전달하는 것이 아닌 질문에 대응되는 답변만 하는 것이 좋은 답변이라고 생각한다.
기업 입장에서는 다를 수도 있다. 계속 질문/답변이 오고간다면 그만큼 리소스를 사용한다는 것이고, 기업 입장에서는 리소스 절감이 필요할 것이다. 그렇기 때문에 한 번에 많은 정보를 전달하여 추가 질문이 들어오는 것을 예방할 수도 있다고 생각한다.
다시 돌아와서, 내가 생각하는 정답의 기준을 적용하기 위해서는 검증 스크립트에서 검증을 요구하는 프롬프트를 수정하면 된다. AI에게 나의 검증 기준을 말하고 프롬프트를 수정하도록 요청했다. 
```plain text
Before)

실제 답변이 기대 답변과 사실적으로 일치하는지 평가하세요.
- 표현이 달라도 핵심 사실이 같으면 정답입니다
- 핵심 사실이 빠져있거나 틀렸으면 오답입니다
- 부분적으로만 맞으면 오답으로 처리하세요

After)
실제 답변이 기대 답변과 사실적으로 일치하는지 평가하세요.
- 기대 답변에 여러 정보가 포함되어 있더라도, 질문에 직접 답하는 핵심 사실을 정확히 전달했다면 정답입니다
- 실제 답변이 기대 답변보다 짧거나 부가 정보를 생략했더라도, 질문의 의도에 필요한 핵심 답변이 맞으면 정답입니다
- 질문과 직접 관련된 핵심 사실이 빠졌거나 틀렸으면 오답입니다
- 실제 답변에 기대 답변과 충돌하는 잘못된 정보가 포함되어 있으면 오답입니다
- 기대 답변의 모든 문장을 그대로 포함했는지가 아니라, 질문에 대한 답변으로 충분한지를 기준으로 판단하세요
```

이후 테스트를 돌려본 결과는 아래와 같다.
![](/assets/images/posts/spring-ai-week-2/08-image.png)
포인트 질문의 경우 해결이 됐지만, 배송 요일 질문에서는 동일한 오답이 발생하고 있다. 이 부분도 해결하고 다음 단계로 넘어가고 싶지만, 다음 단계를 해결하고 돌아와서 고쳐도 큰 문제는 없다고 판단했다. 150개 전체를 돌린 결과는 아래와 같다.
![](/assets/images/posts/spring-ai-week-2/09-image.png)
- 정확도는 81개에서 113개로 32개가 증가했다.
- 하지만 평균 응답이 2.6초에서 3.3초로 늘어나면서 전체 소요시간이 대폭 증가했다.
검증 스크립트의 프롬프트의 이전보다 길어져서 검증 시간도 오래 걸리는 거 같다. 검증 프롬프트를 줄여보고 다시 테스트를 돌렸다.
```plain text
Before)
실제 답변이 기대 답변과 사실적으로 일치하는지 평가하세요.
- 기대 답변에 여러 정보가 포함되어 있더라도, 질문에 직접 답하는 핵심 사실을 정확히 전달했다면 정답입니다
- 실제 답변이 기대 답변보다 짧거나 부가 정보를 생략했더라도, 질문의 의도에 필요한 핵심 답변이 맞으면 정답입니다
- 질문과 직접 관련된 핵심 사실이 빠졌거나 틀렸으면 오답입니다
- 실제 답변에 기대 답변과 충돌하는 잘못된 정보가 포함되어 있으면 오답입니다
- 기대 답변의 모든 문장을 그대로 포함했는지가 아니라, 질문에 대한 답변으로 충분한지를 기준으로 판단하세요

After)
실제 답변이 기대 답변과 사실적으로 일치하는지 평가하세요.
- 질문에 필요한 핵심 사실을 정확히 답했다면, 기대 답변보다 짧거나 부가 정보가 없어도 정답입니다.
- 핵심 사실이 빠졌거나 틀렸거나, 기대 답변과 충돌하는 정보가 있으면 오답입니다.
- 문장 일치가 아니라 질문에 대한 충분성을 기준으로 판단하세요.
```
![](/assets/images/posts/spring-ai-week-2/10-image.png)
- 정확도는 113개에서 108개로 5개가 줄어들었다.
- 하지만, 평균 응답 시간이 3.3초에서 2.7초로 줄어듦에 따라 소요 시간도 감소하였다.

**할루시네이션 개선**
할루시네이션을 개선하기 위해 우선 어떤 컨텍스트가 AI에게 제공됐는지 확인이 필요했고, 계속 눈에 보이던 질문에 대한 컨텍스트를 확인했다.
![](/assets/images/posts/spring-ai-week-2/11-image.png)
```plain text
customer: VIP에서 등급이 내려갈 수도 있나요?
agent: 연간 구매 금액이 800만원 미만으로 내려가면 다음 갱신 시 등급이 조정됩니다. 다만 이전 12개월 평균을 기준으로 하고, 한 달 단위로 재산정되니 갑작스러운 등급 하락은 잘 없습니다.
customer: 등급 하락 전에 알려줘요?
agent: 등급 하락 예정 30일 전에 앱 알림으로 안내됩니다. 이를 통해 추가 구매로 등급 유지하실 수 있어요.

customer: VIP 등급 조건이 어떻게 되나요?
agent: 연간 누적 구매 금액 800만원 이상이면 VIP 등급입니다. VIP 혜택은 포인트 5% 적립, 우선 배송 무료, 전담 상담사 배정, 반품 우선 처리예요.
customer: 800만원이 기준인데 이게 맞죠?
agent: 네 맞습니다. 2024년 이전에는 기준이 달랐지만 현재는 800만원이에요.

customer: 플러스 등급이 되려면 얼마나 사야 해요?
agent: 연간 누적 구매 금액 200만원 이상이면 플러스 등급으로 전환됩니다. 등급 산정은 매월 1일 기준으로 갱신됩니다.
customer: 200만원이 꽤 많네요
agent: 맞습니다. 다만 플러스 등급이 되면 포인트 3% 적립, 일반 배송 무료 혜택이 있어 자주 구매하시면 혜택이 커요.

| Tier | Qualification | Free Shipping | Points | Extras |
|------|--------------|---------------|--------|--------|
| Standard | Default | Economy on orders ≥ 20,000 won | 1% | — |
| Plus | Spend ≥ 200,000 won/year | Economy on all orders | 3% | Birthday double-points |
| VIP | Spend ≥ 800,000 won/year | Priority on all orders | 5% | Early launch access, dedicated support line (1588-0002) |

Tier status is evaluated on January 1st each year based on the prior year's spending.
Returned items are deducted from annual spending totals and may trigger a tier downgrade.
```
현재 topK 기본값 4로 설정되어 있기 때문에 Chatlog 3개와 FAQ 1개가, 총 4개의 컨텍스트가 제공됐다. 보면 Chatlog에서는 800만원으로 안내하고 있고, FAQ에서는 80만원으로 안내하고 있다. Policy 데이터에서도 80만원임을 확인할 수 있다.
![](/assets/images/posts/spring-ai-week-2/12-image.png)
즉, 현재 기준으로 Chatlog에 잘못된 정보가 들어가 있음을 알 수 있다. 심지어 해당 Chatlog는 2025년 6월 기록이지만, 정책은 2024년 1월부터 적용되고 있었다. 상담원의 실수로 나온 데이터이다. 
이처럼 상담원의 실수와 같은 케이스로 인해 Chatlog에는 잘못된 정보가 있을 가능성이 높다. 이를 어떻게 개선할 수 있을까?
- Chatlog을 임베딩할 때, FAQ와 Policy 내용과 일치한 내용이 있는지 확인한다.
	- 일치한지 불일치한지 확인할려면 사람 혹은 AI에게 맞긴다. → 수 많은 문서를 확인해야한다.
- Chatlog의 유사도가 높아도, FAQ와 Policy를 우선적으로 확인하도록 한다.
	- 프롬프트 몇 줄 수정하거나, 코드단에서 정렬을 하면 된다.
두 번째 방법이 최선의 선택이라고 판단하여 적용했다.
```java
String context = documents.stream()
            .sorted(Comparator.comparingInt(this::orderByLayer))
            .map(Document::getText)
            .collect(Collectors.joining("\n\n"));
    
private int orderByLayer(Document document) {
    Object layer = document.getMetadata().get("layer");

    if ("layer1_faq".equals(layer)) {
        return 1;
    }
    if ("layer2_policies".equals(layer)) {
        return 2;
    }
    if ("layer3_chatlogs".equals(layer)) {
        return 3;
    }
    return 99;
}            
```

Document를 정렬해서 테스트한 결과는 다음과 같다.
![](/assets/images/posts/spring-ai-week-2/13-image.png)
```plain text
| Tier | Qualification | Free Shipping | Points | Extras |
|------|--------------|---------------|--------|--------|
| Standard | Default | Economy on orders ≥ 20,000 won | 1% | — |
| Plus | Spend ≥ 200,000 won/year | Economy on all orders | 3% | Birthday double-points |
| VIP | Spend ≥ 800,000 won/year | Priority on all orders | 5% | Early launch access, dedicated support line (1588-0002) |

Tier status is evaluated on January 1st each year based on the prior year's spending.
Returned items are deducted from annual spending totals and may trigger a tier downgrade.

customer: VIP에서 등급이 내려갈 수도 있나요?
agent: 연간 구매 금액이 800만원 미만으로 내려가면 다음 갱신 시 등급이 조정됩니다. 다만 이전 12개월 평균을 기준으로 하고, 한 달 단위로 재산정되니 갑작스러운 등급 하락은 잘 없습니다.
customer: 등급 하락 전에 알려줘요?
agent: 등급 하락 예정 30일 전에 앱 알림으로 안내됩니다. 이를 통해 추가 구매로 등급 유지하실 수 있어요.

customer: VIP 등급 조건이 어떻게 되나요?
agent: 연간 누적 구매 금액 800만원 이상이면 VIP 등급입니다. VIP 혜택은 포인트 5% 적립, 우선 배송 무료, 전담 상담사 배정, 반품 우선 처리예요.
customer: 800만원이 기준인데 이게 맞죠?
agent: 네 맞습니다. 2024년 이전에는 기준이 달랐지만 현재는 800만원이에요.

customer: 플러스 등급이 되려면 얼마나 사야 해요?
agent: 연간 누적 구매 금액 200만원 이상이면 플러스 등급으로 전환됩니다. 등급 산정은 매월 1일 기준으로 갱신됩니다.
customer: 200만원이 꽤 많네요
agent: 맞습니다. 다만 플러스 등급이 되면 포인트 3% 적립, 일반 배송 무료 혜택이 있어 자주 구매하시면 혜택이 커요.
```
정렬이 되서 컨텍스트로 제공됐지만, 답변은 여전히 800만원이다. 

그렇다면, Chatlog를 빼는 방향은 어떨까? 이렇게 생각한 이유는 다음과 같다.
- Chatlog에는 부정확한 데이터가 있기 때문에 AI에게 혼돈을 줄 수 있다.
- Chatlog보다 정확한 정보가 있는 FAQ와 Policy만을 넣어준다면 좋은 답변을 할 확률이 올라가지 않을까?
이러한 이유로 Chatlog를 VectorStore에 적재하는 코드를 주석처리하고 테스트를 진행했다.

Chatlog를 빼고 돌린 결과는 아래와 같다.
![](/assets/images/posts/spring-ai-week-2/14-image.png)
![](/assets/images/posts/spring-ai-week-2/15-image.png)
정확한 답변을 했지만, 앞서 수정한 평가 기준에 부합한 답변을 했다. 일단 800만원이 80만원이 되는 것은 성공했는데, 전체적인 정확도가 떨어지고 소요 시간도 늘었다. 가능한 경우의 수는 다음과 같다.
- Chatlog에 필요한 데이터가 있었다.
	- Chatlog에 필요한 데이터가 있다면, FAQ와 Policy에도 있어야하는 게 아닌가?
- Chatlog를 빼면서 답변에 불필요한 문서들이 검색되면서 AI 답변 정확도가 떨어졌다.
	- 유사도 기준을 설정해야할 거 같다.
이러한 이유로 유사도 기준을 설정하기로 했다.

SearchRequest에서 `similarityThreshold` 값을 통해 유사도 기준을 설정할 수 있다. 기본값은 0.0으로 잡혀있다. 전체 테스트를 돌려보면서 값을 조정했다. 
![](/assets/images/posts/spring-ai-week-2/16-image.png)

먼저 0.4로 설정한 결과이다.
![](/assets/images/posts/spring-ai-week-2/17-image.png)
- 정확도가 88개에서 57개로 감소했다.
- 소요 시간은 547초에서 476초로 감소했다.

계층별 정렬이 문제일 수도 있다고 생각되어, 정렬을 하지 않고 전체 검증을 진행했다.
![](/assets/images/posts/spring-ai-week-2/18-image.png)
- 정확도가 57개에서 53개로 감소했다.
- 소요 시간은 547초에서 457초로 감소했다.

그렇다면, 정렬도 빼고 `similarityThreshold` 값도 삭제한다면 어떤 결과가 나올까?
![](/assets/images/posts/spring-ai-week-2/19-image.png)
- 정확도가 57개에서 86개로 증가했다.
- 소요 시간은 457초에서 490초로 증가했다.
이를 통해 Chatlog에도 필요한 정보가 있음을 알 수 있었다. 결국은 Chatlog에서 노이즈를 지워야할 거 같다. Chatlog에서 노이즈를 지우는 방법은 위에서 언급한 방법 이외의 하나의 방법이 생각났다. 프롬프트를 통해 Chatlog가 컨텍스트로 제공이 되면, Policy와 FAQ에서 검증을 진행하고 틀린 정보라면 무시하라고 하면 될 거 같다. 그렇다면 AI에게 컨텍스트로 Policy, FAQ 그리고 Chatlog 세 개의 데이터를 모두 제공해야한다.

이를 구현하기 위해서는 SearchRequest에서 filterExpression() 메소드를 통해 메타데이터에서 필터링을 걸 수 있다. 이후 Policy, FAQ 그리고 Chatlog에서 각각 조회할 수 있도록 로직을 수정하면 된다.
```java
SearchRequest searchRequest = SearchRequest.builder()
            .query(question)
            .filterExpression(new FilterExpressionBuilder().eq("layer", "layer1_faq").build())
            .build();
```
이후 프롬프트를 다음과 같이 수정했다.
```plain text
당신은 초록 코퍼레이션에서 고객지원 챗봇을 담당하는 역할입니다.
제공된 문서를 참고하여 고객에게 답변을 해주세요.
모든 응답은 한국어로 해야하며, 초록 코퍼레이션과 무관한 내용은 다루지 마세요.
참고 자료에서 Chatlog의 경우 FAQ와 Policy 내용과 불일치한 정보가 있다면 참고하지 마세요.
```

이후 테스트 결과는 다음과 같다.
![](/assets/images/posts/spring-ai-week-2/20-image.png)
- 정확도가 86개에서 116개로 증가했다.
- 소요 시간은 490초에서 541초로 증가했다.
10개만 검증했을 때, 800만원의 응답을 뱉는지도 확인했다.
![](/assets/images/posts/spring-ai-week-2/21-image.png)
드디어 통과했다.
## 마무리
Spring AI와 2주간의 놀이가 끝이 났다. 처음에는 Spring AI를 학습하고 도파민을 얻기 위해 시작했지만, 정확도 개선에 시간을 많이 투자한 것 같다. 
이 과정에서 가설을 세우고 다양한 시도를 하면서 오랜만에 생각이라는 것을 해봤다. 최근에 AI 코딩을 하면서 직접 코드를 작성하는 일이 줄어드니 생각을 많이 안하는 거 같고 뇌가 굳어지고 있다는 느낌을 받았다. 하지만, 할루시네이션을 어떻게 개선하고 정확도를 향상시킬지에 대해서 고민을 하다보니 굳어진 뇌가 활성화되는 느낌을 받았다. 
또한, AI 관련 지식이 거의 없었는데 이번 과정을 통해 RAG, 임베딩, 유사도 등 학습할 수 있는 기회가 되어 좋았다. 이번 부트캠프는 여기서 끝나지만 해당 경험을 살려 AI를 프로젝트에 접목해보고 싶다는 생각이 들었다.

