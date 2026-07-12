---
title: Load Balancer
date: 2026-07-12
categories:
  - Network
excerpt: 로드 밸런서에 대해서 알아보자
---
## 로드 밸런싱

여러 서버들로 네트워크 트래픽을 분산 처리하는 기술을 로드 밸런싱이라고 한다. 트래픽으로 인해 서버에 부하가 생길 경후 처리하는 방법이 두가지가 존재한다.

- Scale-up : 서버의 성능을 높이는 방법
- Scale-out : 여러 개의 서버를 두는 방법

로드 밸런싱은 Scale-out에 사용되며, 트래픽 처리를 위해 생성된 여러 개의 서버에 트래픽을 분산하여 트래픽을 처리한다.

## 로드 밸런서

이러한 로드 밸런싱 기술을 제공하는 서비스 또는 장치를 로드 밸런서라고 한다. 로드 밸런서는 서브들 사이에 위치하며 VIP와 함께 구성된다. 

> VIP (Virtual IP)<br>로드 밸런싱의 대상이 되는 여러 서버를 대표하는 가상의 IP이다. 클라이언트들은 서버의 IP로 직접 요청을 하는 것이 아니라 로드 밸런서를 가지고 있는 VIP에 요청한다. 그리고 로그 밸런서를 해당 요청을 분산된 서버에 설정된 방법에 따라 분산한다.

### L4

#### 정의

IP, Port 그리고 TCP/DUP와 같은 OSI 7 계층 중 4계층인 전송 계정의 정보를 기반으로 트래픽을 분산한다. L4는 패킷안의 HTTP 내용을 읽지 않는다.

#### 동작 원리

TCP 연결이 클라이언트로 부터 들어오면 로드 밸런서는 아래와 같은 정보를 확인한다.

- Source IP
- Destination IP
- Source Port
- Destination Port
- Protocol(TCP/UDP)

이후, 로드 밸런서의 설정에 따라 요청을 적절한 서버에 전달한다. 이때, 서버는 HTTP 요청안에 어떤 HTTP 메소드를 사용했는지 그리고 어떤 URL으로 요청을 했는지 모른다.

#### 장단점

- 장점
  - 패킷 레벨에서만 로드를 분산하기 때문에 매우 빠르다
  - 처리량이 크다
  - CPU 사용량이 적다
  - TCP/UDP 모두 가능하다
- 단점
  - URL 기반 분기가 불가능하다
  - Header 확인이 불가능하다
  - Cookie 확인이 불가능하다

### L7

#### 정의

OSI 7계층의 정보(HTTP, HTTPS, gRPC, REST API)등의 데이터를 기반으로 트래픽을 분산한다. L4에서 확인하지 않는 HTTP 메소드와 URL까지 확인한다.

#### 동작 원리

클라이언트가 아래와 같은 요청을 보낸다.

```bash
GET /login HTTP/1.1
Host: example.com
```

L7 로드 밸런서는 해당 요청을 받아 아래의 데이터를 분석한다.

- Method : GET
- URL : /login
- HOST : example.com
- Cookie, Header, User-Agnet 등

그리고 규칙에 따라 요청을 서버에 분산한다.

- /login → Auth Server
- /image → Image Server

#### 장단점

- 장점
  - 상위 계층에서 로드를 분산하기 때문에 섬세한 라우팅이 가능하다
  - 캐싱 기능을 제공한다
  - 비정상적인 트래픽을 사전에 필터링할 수 있어 서비스 안정성이 높다
- 단점
  - 패킷의 내용을 복호화해야하기 때문에 비용이 발생한다

## 알고리즘

- Round Robin : 요청을 순서대로 각 서버에 균등하게 분배한다
- IP Hash Method : 클라이언트의 IP를 해싱해 로드를 분배한다
- Least Connection : 서버에 연결되어 있는 커넥션 개수만 갖고 단순비교하여 가장 적은 곳에 전달한다
- Weight Least Connections : 서버에 부여된 가중치 값을 기반으로 커넥션 수의 개수와 같이 고려하여 할당한다
- Fastest Response Time : 가장 빨리 응답하는 서버에 요청을 연결하는 방법이다
- Bandwidth : 서버들과의 대역폭을 고려하여 서버에 분산한다

## 참고자료

[L4/L7 로드밸런싱 쉽게 이해하기](https://aws-hyoh.tistory.com/149)

[\[란\] L4 load balancer vs L7 load balancer 란?](https://velog.io/@makeitcloud/%EB%9E%80-L4-load-balancer-vs-L7-load-balancer-%EB%9E%80)

[\[네트워크\] 로드밸런서의 기본 (L4 로드밸런서 L7 로드밸런서) (AWS ELB, NLB, ALB)](https://etloveguitar.tistory.com/136)

[\[네트워크\] 로드밸런싱의 개념 및 기법 설명](https://co-no.tistory.com/entry/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC-%EB%A1%9C%EB%93%9C%EB%B0%B8%EB%9F%B0%EC%8B%B1)

[\[네트워크\] 로드 밸런서](https://steady-coding.tistory.com/535)
