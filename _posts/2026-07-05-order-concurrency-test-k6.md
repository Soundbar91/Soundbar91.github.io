---
title: 주문 동시성 테스트 - k6
date: 2026-07-05
categories:
  - DB
excerpt: 주문 동시성 테스트를 위한 k6의 구조와 사용 방법을 알아보자.
---

## 서론

Naga 프로젝트의 주문 동시성 테스트를 위한 도구로 k6를 선택했다. 부하 테스트 도구를 처음 사용하기도 하고, 앞으로 계속 사용할 거 같아 사용 방법에 대해서 정리하려고 한다. 물론, AI가 더 빠르게 작성하기 때문에 직접 작성할 일은 줄어들겠지만 기본적인 사용방법을 알아야 나중에 코드를 검수할 때 도움이 될 거 같다.

## 본론

### k6란

k6는 그라파나에서 만든 go 기반 부하 테스트 도구라고 한다. 내부적으로는 go로 구현되어 있지만 동작 코드는 자바스크립트로 작성한다. 

### 코드 레이아웃 및 라이프 사이클

k6는 아래와 같은 코드 레이아웃과 라이프 사이클을 가진다고 한다.

#### Init Code

테스트를 위한 시나리오를 정의하거나 필요한 모듈을 가져옵니다. 주문 동시성 테스트를 진행하는 k6 코드를 통해 직접 확인해봤다. 

```javascript
import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
```

k6를 사용하기 위해 필요한 모듈을 가져온 코드이다. 모듈에 대한 세부적인 설명은 이후 작성되는 내용을 통해 확인할 수 있다.

```javascript
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const PRODUCT_ID = Number(__ENV.PRODUCT_ID || 1);
const USER_COUNT = Number(__ENV.USER_COUNT || 300);
const ORDER_QUANTITY = Number(__ENV.ORDER_QUANTITY || 1);
const EXPECTED_SUCCESS_COUNT = Number(__ENV.EXPECTED_SUCCESS_COUNT || 100);
```

상수를 관리하는 코드이다. k6 스크립트가 저장소에 올라가기 때문에, 상수값을 바꾸기 위해서 코드 수정, 커밋 그리고 배포까지 과정이 번거러울 것이다. 이를 해결하기 위해 환경 변수로 값을 관리하여 코드 수정 없이 배포 한 번으로 상수를 수정할 수 있다.

```javascript
const users = new SharedArray('mock users', function () {
    return JSON.parse(open('./data/users.json'));
});
```

주문 생성을 하기 위해서는 인증이 필요하다. 그러기 위해서 사전에 만들어 놓은 Mock 데이터를 가져오는 코드이다. Init Code에서는 이렇게 테스트에 필요한 데이터를 가져올 수 있다. 

여기서 SharedArray이라는 객체를 확인할 수 있다. 해당 객체를 사용하지 않는다면 이후에 생성되는 요청마다 메모리를 새롭게 할당하게 된다. 100개의 요청이 생성된다면, 100개의 users가 생성되어 메모리에 할당될 것이고 메모리 공간이 불필요하게 차지하게 되는 문제가 발생한다. 

이를 해결하기 위해 동일한 메모리 공간을 공유하는 SharedArray를 사용한다. 이렇게 생성된 SharedArryay를 어떻게 사용하는지는 이후 작성되는 내용에서 확인할 수 있다.

```javascript
http.setResponseCallback(
    http.expectedStatuses(200, 409)
);
```

각 메소드의 설명은 아래와 같다.

- expectedStatus()
	- 어떤 HTTP 상태 코드를 예상된 응답으로 처리할지 정의하는 메소드
	- 현재는 200과 409를 예상된 응답으로 처리
	- 그 외의 상태 코드는 예상하지 않은 응답으로 처리
- setResponseCallBack()
	- HTTP 응답이 예상된 응답인지를 판정하는 기준을 설정하는 메소드

```javascript
const orderSuccessCount = new Counter('order_success_count');
const orderConflictCount = new Counter('order_conflict_count');
const orderUnexpectedFailureCount = new Counter('order_unexpected_failure_count');
```

Counter은 k6에서 제공하는 객체로 전달된 값을 누적하는 커스텀 메트릭이다. Counter를 사용하는 이유는 아래와 같다.

- k6의 가상 사용자(VU)는 서로 격리된 실행 환경 사용
- 그렇기 때문에 성공/실패 카운팅을 전역 변수로 관리한다면 각 카운팅의 합산이 어려움
- Counter으로 값을 넘겨준다면 k6의 메트릭 시스템으로 전달됨

```javascript
export const options = {
    setupTimeout: '5m',

    scenarios: {
        order_consistency: {
            executor: 'per-vu-iterations',
            vus: USER_COUNT,
            iterations: 1,
            maxDuration: '1m',
        }
    },

    thresholds: {
        order_unexpected_failure_count: ['count==0'],
        order_success_count: [`count==${EXPECTED_SUCCESS_COUNT}`],
        order_conflict_count: [`count==${USER_COUNT - EXPECTED_SUCCESS_COUNT}`],
    },
};
```

테스트 설정 및 시나리오를 생성하는 코드이다. 각 설정값에 대한 설명은 아래와 같다.

- setupTimeout
	- Init Code 영역의 타임아웃 설정
	- 현 테스트는 Mock 유저의 엑세스 토큰을 발급하기 위해 Mock 유저 수만큼 로그인 API를 호출
	- 기본 값이 60초로 설정되어 있어 타임아웃이 발생
	- 이를 예방하고자 5분으로 설정
- scenarios
	- 테스트 시나리오 설정하는 옵션
	- 코드에서는 order_consistency이라는 시나리오를 추가
	- executor : 부하 실행 전략
		- constant-vus, ramping-vus : 정해진 수의 사용자가 반복 요청하는 방식
		- constant-arrival-rate, ramping-arrival-rate : 초당 몇 개의 iteration을 시작할지 정하는 방식
		- shared-iterations : 전체 iteration 수를 여러 VU가 함께 나눠서 실행
		- per-vu-iterations : 각 VU가 정해진 iteration 수만큼 실행
		>
			constant : 테스트 동안 부하 고정<br>ramping : 테스트 중 부하를 점점 올리거나 내림
- vus : 가상 사용자 수
- thresholds : 테스트 성공/실패 기준

#### Setup Code

vu가 서버에 요청할 데이터 등을 가공하는 역할을 수행한다. 해당 로직은 vu마다 실행되는 것이 아닌 딱 한 번만 실행된다. 현 테스트에서는 Mock 유저의 엑세스 토큰을 발급받기 위해, Setup Code에 관련 로직을 구현했다.

```javascript
export function setup() {
    if (users.length < USER_COUNT) {
        throw new Error(
            `users.json의 사용자 수가 부족합니다. 필요: ${USER_COUNT}, 현재: ${users.length}`
        );
    }

    const selectedUsers = users.slice(0, USER_COUNT);
    const tokens = [];

    for (const user of selectedUsers) {
        const loginResponse = http.post(
            `${BASE_URL}/v1/auth/login`,
            JSON.stringify({
                loginId: user.loginId,
                password: user.password,
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const loginOk = check(loginResponse, {
            'login status is 200': (res) => res.status === 200,
            'access token exists': (res) => Boolean(res.json('data.accessToken')),
        });

        if (!loginOk) {
            throw new Error(
                `로그인 실패: loginId=${user.loginId}, status=${loginResponse.status}, body=${loginResponse.body}`
            )
        }

        tokens.push(loginResponse.json('data.accessToken'));
    }

    return {
        tokens,
    };
}
```

해당 코드에서는 check() 메소드와 리턴값에 대해서만 짚고 넘어가면 될 거 같다. check() 메소드는 k6에서 응답이나 값이 원하는 조건을 만족하는 지 검사하고, 결과를 메트릭에 기록하는 메소드이다. 위 코드에서는 loginResponse에서 status가 200이면서 엑세스 토큰이 존재하는 지 검사하고 있다. 

setup() 메소드의 반환값은 이후에 나올 VU code 메소드의 파라미터로 넘어간다. 위 코드에서는 엑세스 토큰 리스트를 반환하여 테스트 간 사용할 수 있게 한다.

#### VU Code

생성된 vu가 실행하는 코드 영역이다. 현 테스트에서는 주문 생성 API를 호출하는 로직이 들어가야한다.

```javascript
export default function (data) {
    const userIndex = exec.vu.idInTest - 1;
    const accessToken = data.tokens[userIndex];

    const orderResponse = http.post(
        `${BASE_URL}/v1/orders`,
        JSON.stringify({
            items: [
                {
                    productId: PRODUCT_ID,
                    quantity: ORDER_QUANTITY,
                }
            ]
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (orderResponse.status === 200) {
        orderSuccessCount.add(1);
        check(orderResponse, {
            'order success status is 200': (res) => res.status === 200,
        });

        return;
    }

    if (orderResponse.status === 409) {
        orderConflictCount.add(1);
        check(orderResponse, {
            'order conflict status is 409': (res) => res.status === 409,
            'order conflict has expected error code': (res) => {
                const code = res.json('error.code');
                return code === 'OUT_OF_STOCK' || code === 'NOT_SALE_PRODUCT';
            },
        });

        return;
    }

    orderUnexpectedFailureCount.add(1);
    check(orderResponse, {
        'order response is expected status': (res) =>
            res.status === 200 || res.status === 409,
    });
}

```

Setup Code에서 넘겨준 엑세스 토큰 리스트를 data라는 파라미터 명으로 받는 것을 확인할 수 있다. API를 호출하고 상태 코드에 따라 분기처리를 하는 로직은 코드를 한 번 읽어보면 이해할 수 있다. 

처음보는 부분이라면 `exec.vu.idInTest - 1` 에서 exec이다. 이는 k6의 현재 실행 정보를 조회하는 객체이며, Init Code에서 import한 것을 확인할 수 있다. 현 테스트에서 몇 번째 유저의 엑세스 토큰을 사용해야하는지 접근하기 위해 현재 vu가 몇 번째 vu인지를 조회할 필요가 있다. 이를 조회하기 위해서 exec.vu의 idInTest에 접근하며, 1 인덱스이기 때문에 1을 차감해야 파라미터로 넘어오는 엑세스 토큰 리스트와 시작 인덱스가 동일해진다. 

exec에서는 vu 뿐만 아니라 k6의 scenario, instance 그리고 test의 정보를 조회할 수 있다. 

#### Teardown Code

vu가 모든 작업을 마쳤을 때 딱 한번 호출되는 영역이다. 현 테스트에는 별도로 작성하지 않았으나, 로깅 등 부가적인 작업을 진행할 수 있을 거 같다. 

### 실행 방법

스크립트 파일이 있는 디렉토리에서 아래의 명령어를 실행하면 된다.

```bash
k6 run {스크립트 파일 이름}.js
```

### 참고 자료

[blog.naver.com](https://blog.naver.com/pjt3591oo/223504483449)

### 마무리

이외에도 k6는 수집한 메트릭 정보를 데이터베이스 혹은 파일로 보내기 용이하다고 한다. 하지만, 지금 당장 필요한 상황은 아니기 때문에 다루지 않았다. 데이터 정합성을 만족한 후, 추가 작업을 진행할 때 다룰 것 같다.
