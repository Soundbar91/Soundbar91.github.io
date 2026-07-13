---
title: 주문 동시성 테스트 - FK 제약 조건 삭제
date: 2026-07-08
categories:
  - DB
excerpt: 외래키 제약 조건을 제거해 잠금 전파와 데드락 변화를 확인한다.
---

## 서론

FK로 인해 연관된 테이블에 대해서 S Lock이 걸리고, X Lock으로 승격하는 과정에서 데드락이 발생함을 확인했다. 이번 포스팅에서는 FK를 걸지 않았을 때, 락이 전파가 되지 않는지 확인한다. 

## 본론

### FK 제약 조건 삭제

OrderItem 테이블에는 Order과 Product의 Id를 FK로 참조하고 있다. 해당 제약조건을 삭제한 DDL은 아래와 같다.

![](/assets/images/posts/order-concurrency-test-without-foreign-keys/image-01.png)

### 락 전파 확인

이제 DB에서 락이 전파가 되는지 확인을 했다. 

![](/assets/images/posts/order-concurrency-test-without-foreign-keys/image-02.png)

OrderItem를 추가하는 과정에서 연관 테이블에 락이 걸리지 않음을 확인할 수 있다. 

### 테스트 확인

이제 테스트를 통해 데이터의 정합성이 안 깨지는지 확인해봤다.

![](/assets/images/posts/order-concurrency-test-without-foreign-keys/image-03.png)

모든 요청이 성공으로 들어가 테스트는 실패했고, DB에서도 데이터의 정합성이 깨졌다.

![](/assets/images/posts/order-concurrency-test-without-foreign-keys/image-04.png)

## 마무리

FK 제약 조건을 걸지 않는다면 락이 전파가 되지 않음을 확인했다. 하지만, 여전히 테스트는 실패했으며 DB에서 데이터의 정합성도 깨졌다. 다음 포스팅을 통해 해당 문제에 대한 해결책을 알아보자
