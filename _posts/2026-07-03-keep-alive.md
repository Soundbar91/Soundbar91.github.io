---
title: Keep Alive
date: 2026-07-03
categories:
  - Network
excerpt: Keep-Alive에 대해서 알아보자
---
## Persistent Connection

HTTP 통신 과정에서 TCP 연결을 바로 닫지 않고, 여러 HTTP 요청/응답에 재사용하는 HTTP 연결이다. 동작 방식은 HTTP 버전에 따라 다르다.

### HTTP/1.0

기본적으로 요청 하나가 끝나면 연결을 닫는 방식이였으며, 연결을 유지하기 위해서는 헤더를 넣어야 한다.

```bash
	Connection: keep-alive
```

### HTTP/1.1

1.1부터는 기본 동작인 Persistent Connection이다. 단, 연결을 닫고 싶을 때는 아래와 같이 헤더를 보낸다.

```bash
Connection: close
```

## Keep-Alive

Persistent Connection을 유지하거나 제어하는 방식, 헤더, 설정의 이름을 말한다. 계층별로 HTTP Keep-Alive과 TCP Keep-Alive가 존재한다.

### HTTP Keep-Alive

#### 정의

위에서 서술한 것 처럼, 하나의 TCP 연결로 여러 HTTP 요청/응답을 처리하는 방식이다.

#### 장점

HTTP 요청때 마다 3-way handshake로 비용이 발생한다. 또한 HTTPS의 경우 TLS handshake 비용도 추가된다. 최초에 맺어진 Connection을 재사용하게 된다면 매 요청때마다 handshake를 하지 않아도 되기 때문에 성능적으로 이점을 가져갈 수 있다.

#### 단점

트래픽이 많아지면 그만큼 연결의 수가 증가하게 된다. 지속적으로 요청/응답을 처리하는 Connection 이외의 idle connection이 쌓일 수 있다.

### TCP Keep-Alive

#### 정의

TCP 연결이 아직 살아 있는지 확인하기 위해 OS가 작은 패킷을 보내는 기능이다.

#### 설정

운영체제 설정으로 제어가 되며 대표적으로 아래의 값들이 있다.

- tcp_keepalive_time : idle 상태에서 첫 keepalive probe를 보내기까지 기다리는 시간
- tcp_keepalive_intvl : probe 재전송 간격
- tcp_keepalive_probes : 몇 번 실패하면 죽은 연결로 볼지

### 설정

#### Keep-Alive Timeout

Keep-Alive 연결을 무한정 유지하게 된다면 서버 리소스 낭비가 발생할 것이다. 그렇기 때문에 타임아웃 시간을 설정한다.

```bash
Keep-Alive: timeout=5
```

이 경우는 요청 처리 후 5초 동안 추가 요청이 없을 때 서버가 Connection을 닫는다.

#### Max Keep-Alive Requests

하나의 연결에서 처리할 수 있는 최대 요청 수를 제한하는 설정이다.

```bash
Keep-Alive: max=100
```

이 경우는 하나의 TCP 연결에서 HTTP 요청을 최대 100개까지 처리하고 연결을 닫는다.

#### Idle Connection

요청을 처리하지 않는 Connection은 idle 상태가 된다. 해당 상태가 지속되면 서버 리소스 낭비가 발생한다. 그렇기 때문에 idle timeout를 설정한다.

```bash
Client timeout: 60
Load Balancer idle timeout: 30
Server keep-alive timeout: 75
```