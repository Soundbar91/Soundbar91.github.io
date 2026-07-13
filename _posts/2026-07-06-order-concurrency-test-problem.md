---
title: 주문 동시성 테스트 - 문제 상황
date: 2026-07-06
categories:
  - DB
excerpt: 주문 동시성 테스트에서 발생한 데드락과 외래키 잠금 전파 원인을 알아보자.
---

## 서론

이번 포스팅에서는 k6 스크립트를 실행했을 때, 어떤 결과가 나오는지 그리고 그 결과의 원인은 무엇인지 파악하는 내용을 다룬다. 도출한 원인을 해결하기 위한 방법은 다음 포스팅부터 다룰 것이다.

## 본론

### k6 실행

작성한 k6 스크립트를 실행했고 아래와 같은 결과를 확인했다.

![](/assets/images/posts/order-concurrency-test-problem/image-01.png)

89개의 요청이 정상적으로 처리됐고, 211개의 요청이 예상밖의 상태코드를 던지고 있음을 커스텀 메트릭을 통해 확인할 수 있다. 

### 애플리케이션 로그

어떤 에러를 던지고 있는지 확인하기 위해 애플리케이션 로그를 확인했다. 

![](/assets/images/posts/order-concurrency-test-problem/image-02.png)

로그를 확인하면 Product를 업데이트 하는 과정에서 데드락이 발생했고, 500 에러가 던져지고 있음을 알 수 있었다. 

### MySQL 로그

데드락이 발생하고 있음을 확인했기 때문에, DB에서 어떻게 데드락이 발생하고 있는지 확인하고자 MySQL 로그를 확인했다. 아래의 명령어를 통해 MySQL에서 데드락 로그를 확인할 수 있다.

```bash
SHOW ENGINE INNODB STATUS;
```

가장 최신의 정보만 남기 때문에 모든 데드락의 로그를 확인할 수 없다. 데드락 이외에도 INNODB에 대한 현재 상태를 확인할 수 있다. 

```bash
------------------------
LATEST DETECTED DEADLOCK
------------------------
2026-07-06 19:31:19 281472678096640
*** (1) TRANSACTION:
TRANSACTION 7622, ACTIVE 0 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 9 lock struct(s), heap size 1128, 4 row lock(s), undo log entries 2
MySQL thread id 19, OS thread handle 281472629116672, query id 4313 192.168.65.1 commerce updating
update products set name='k6 concurrency test product',price=10000,quantity=56,status='SALE',updated_at='2026-07-06 19:31:19.443339' where id=1

*** (1) HOLDS THE LOCK(S):
RECORD LOCKS space id 35 page no 4 n bits 72 index PRIMARY of table `commerce`.`products` trx id 7622 lock mode S locks rec but not gap
Record lock, heap no 2 PHYSICAL RECORD: n_fields 9; compact format; info bits 0
...

*** (1) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 35 page no 4 n bits 72 index PRIMARY of table `commerce`.`products` trx id 7622 lock_mode X locks rec but not gap waiting
Record lock, heap no 2 PHYSICAL RECORD: n_fields 9; compact format; info bits 0
...

*** (2) TRANSACTION:
TRANSACTION 7624, ACTIVE 0 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 9 lock struct(s), heap size 1128, 4 row lock(s), undo log entries 2
MySQL thread id 12, OS thread handle 281472763793152, query id 4316 192.168.65.1 commerce updating
update products set name='k6 concurrency test product',price=10000,quantity=56,status='SALE',updated_at='2026-07-06 19:31:19.443338' where id=1

*** (2) HOLDS THE LOCK(S):
RECORD LOCKS space id 35 page no 4 n bits 72 index PRIMARY of table `commerce`.`products` trx id 7624 lock mode S locks rec but not gap
Record lock, heap no 2 PHYSICAL RECORD: n_fields 9; compact format; info bits 0
...

*** (2) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 35 page no 4 n bits 72 index PRIMARY of table `commerce`.`products` trx id 7624 lock_mode X locks rec but not gap waiting
Record lock, heap no 2 PHYSICAL RECORD: n_fields 9; compact format; info bits 0
...

*** WE ROLL BACK TRANSACTION (2)
```

로그상으로 확인할 수 있는 내용은 아래와 같다.

- 두 개의 트랜잭션이 존재한다.
	- TRANSACTION A: id 7622
	- TRANSACTION B: id 7624
- 두 트랜잭션은 Product 테이블에서 id가 1인 레코드의 S Lock을 보유한 상태였다.
- 두 트랜잭션 모두 아래 UPDATE 쿼리를 실행하기 위해 동일 레코드에 대한 X lock을 획득하려고 했다.

	```sql
update products
set name='k6 concurrency test product',
    price=10000,
    quantity=56,
    status='SALE',
    updated_at='2026-07-06 19:31:19.443338'
where id=1;
	```

- 하지만 X Lock을 획득하려면 다른 트랜잭션이 보유 중인 S Lock이 해제되어야 한다.
- TRANSACTION A는 TRANSACTION B의 S Lock이 해제되기를 기다리고, TRANSACTION B는 TRANSACTION A의 S Lock이 해제되기를 기다리는 상황이 되었다.
- 이로 인해 서로가 서로의 락 해제를 기다리는 순환 대기 상태가 발생했고, InnoDB는 이를 데드락으로 판단했다.
- MySQL/InnoDB는 데드락을 해소하기 위해 TRANSACTION B을 롤백했다.

즉 S락을 X락으로 승격하는 과정에서 데드락이 발생했다.

### 외래키 잠금 전파

Product의 id가 1인 레코드에 대해서 S Lock를 획득했음을 확인할 수 있다. 하지만, 애플리케이션 코드에서는 락을 전혀 사용하지 않는다. 어떻게 락을 획득했을까?

Claude와 대화를 나누는 과정에서 외래키 잠금 전파라는 키워드를 알게 됐고, 관련해서 구글링을 했다. 유사한 내용을 다룬 [블로그](https://seizetheday95.tistory.com/18)가 있었고 그곳에서 MySQL의 [공식문서](https://dev.mysql.com/doc/mysql-reslimits-excerpt/5.7/en/ansi-diff-foreign-keys.html)에 작성된 내용을 확인할 수 있었다.

> In an SQL statement that inserts, deletes, or updates many rows, foreign key constraints (like unique constraints) are checked row-by-row. When performing foreign key checks, [`InnoDB`](https://dev.mysql.com/doc/refman/5.7/en/innodb-storage-engine.html) sets shared row-level locks on child or parent records that it must examine. MySQL checks foreign key constraints immediately; the check is not deferred to transaction commit. According to the SQL standard, the default behavior should be deferred checking. That is, constraints are only checked after the *entire SQL statement* has been processed. This means that it is not possible to delete a row that refers to itself using a foreign key.

한글로 번역하면 아래와 같다.

> 여러 행을 삽입, 삭제 또는 갱신하는 SQL 문에서 외래 키 제약 조건은 고유 제약 조건과 마찬가지로 행 단위로 검사됩니다. 외래 키 검사를 수행할 때 InnoDB는 검사해야 하는 자식 레코드 또는 부모 레코드에 공유 행 수준 잠금을 설정합니다. MySQL은 외래 키 제약 조건을 즉시 검사하며, 이 검사는 트랜잭션 커밋 시점까지 지연되지 않습니다. SQL 표준에 따르면 기본 동작은 지연 검사여야 합니다. 즉, 제약 조건은 전체 SQL 문이 처리된 후에만 검사됩니다. 이는 외래 키를 통해 자기 자신을 참조하는 행은 삭제할 수 없다는 뜻입니다.

즉, 데이터가 추가될 때 자식 레코드 또는 부모 레코드에 대해서 S Lock이 걸린다고 이해했다. 직면한 상황을 적용한다면, OrderItem은 Product의 Id를 FK로 참조하기 때문에 OrderItem를 추가하는 과정에서 참조하고 있는 Product 레코드에 S Lock이 걸린다. DB에서 실제로 락이 걸리는 지 확인했다.

![](/assets/images/posts/order-concurrency-test-problem/image-03.png)

> **performance_schema.data_locks**<br>MySQL에서 보유 중이거나 획득을 기다리는 데이터 락을 조회하는 테이블

IS, IX와 관련된 내용은 다른 포스팅에서 자세하게 다룰 예정이다. 여기서 확인할 수 있는 내용은 아래와 같다.

- Product의 Id가 1인 레코드에 S Lock이 걸렸다.
- Order 테이블에 Id가 1인 레코드에 S Lock이 걸렸다.

이를 통해 FK로 참조하고 있는 테이블의 레코드에 S Lock이 걸리는 것을 확인할 수 있다. 

### 참고 자료

[\[transaction 동시성 문제⑤\] 데드락 - 2](https://seizetheday95.tistory.com/18)

[MySQL :: MySQL Restrictions and Limitations :: 13.3 FOREIGN KEY Constraint Differences](https://dev.mysql.com/doc/mysql-reslimits-excerpt/5.7/en/ansi-diff-foreign-keys.html)

[MySQL :: MySQL 8.0 Reference Manual :: 17.7.1 InnoDB Locking](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html)

[MySQL :: MySQL 8.0 Reference Manual :: 29.12.13.1 The data_locks Table](https://dev.mysql.com/doc/refman/8.0/en/performance-schema-data-locks-table.html)

[TIL/DB/MySQL/DeadLock 확인/MySQL InnoDB DeadLock 확인.md at master · binghe819/TIL](https://github.com/binghe819/TIL/blob/master/DB/MySQL/DeadLock%20%ED%99%95%EC%9D%B8/MySQL%20InnoDB%20DeadLock%20%ED%99%95%EC%9D%B8.md)

[TIL/DB/MySQL/InnoDB Lock/InnoDB Lock.md at master · binghe819/TIL](https://github.com/binghe819/TIL/blob/master/DB/MySQL/InnoDB%20Lock/InnoDB%20Lock.md)

## 마무리

외래키 잠금 전파로 인해 Product의 레코드에 S Lock이 걸렸다. 이후 Product의 quantity를 업데이트하기 위해 X Lock를 획득하려고 했고, 다른 트랜잭션의 S Lock을 풀리기 기다리는 과정에서 순환 대기가 발생해 데드락이 발생했다. 이를 해결하기 위한 방법은 다음 포스팅부터 쭉 다룰 예정이다.
