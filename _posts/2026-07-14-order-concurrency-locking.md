---
title: 주문 동시성 테스트 -  낙관적 락과 비관적 락
date: 2026-07-14
categories:
  - DB
excerpt: 낙관적 락과 비관적 락으로 주문 동시성을 제어하는 방법을 알아보자.
---

## 서론

이전 포스팅들에서는 락을 직접 걸지 않으면서 데드락을 해결하는 방법을 다뤘다. 이번 포스팅에서는 락을 다뤄보면서 데드락을 해결하는 방법에 대해 다뤄볼 예정이다.

## 본론

### 사전 지식

데이터베이스에는 동시성 제어를 위해 락을 거는 메커니즘이 크게 두 가지가 있다.

- 낙관적 락(Optimistic Lock)
	- 트랜잭션들이 충돌이 발생하지 않는다고 가정하는 락
	- 트랜잭션을 커밋하기 전까지는 트랜잭션의 충돌 여부 확인 불가
	- version 컬럼 등을 이용해 수정 시점에서 최초에 데이터를 읽은 이후 데이터가 변경되었는지를 검증
- 비관적 락(Pessimistic Lock)
	- 트랜잭션끼리 충돌이 발생한다고 가정하는 락
	- 데이터를 수정하면 즉시 트랜잭션의 충돌을 알 수 있음
	- 데이터를 읽는 시점에서 락을 획득해서 다른 트랜잭션의 접근을 제한

### 낙관적 락

낙관적 락은 비관적 락과 다르게 DB의 락을 거는 것이 아닌 version을 관리하는 컬럼을 통해 최초에 읽은 데이터와 이후 데이터가 변경되는지를 확인하는 메커니즘이다. JPA에서는 Version 어노테이션을 제공하고, 이를 적용하면 아래와 같이 코드를 짤 수 있다.

```java
@Getter
@Entity
@Table(name = "products")
@NoArgsConstructor(access = PROTECTED)
public class Product extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotNull
    @Column(name = "name", nullable = false)
    private String name;

    @NotNull
    @Column(name = "price", nullable = false)
    private Integer price;

    @NotNull
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @NotNull
    @Enumerated(value = EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ProductStatus status;

    @Version
    @Column(name = "version", nullable = false)
    private Integer version;

		..
}
```

엔티티가 수정될 때, JPA에서는 Version 어노테이션이 달린 컬럼을 확인하여 낙관적 락이 걸렸음을 인지하고 업데이트 쿼리를 실행한다. 아래 쿼리에서 version 컬럼이 낙관적 락에 사용되는 것을 확인할 수 있다.

```sql
Hibernate:
    update
        products
    set
        name=?,
        price=?,
        quantity=?,
        status=?,
        updated_at=?,
        version=?
    where
        id=?
        and version=?
```

낙관적 락이 충돌했을 경우 ObjectOptimisticLockingFailureException 예외가 발생한다. 아래는 낙관적 락을 적용하고 테스트들 돌려서 나온 예외 메시지이다. 예외 메시지 중간 중간 데드락이 발생한 것도 확인할 수 있었다.

![](/assets/images/posts/order-concurrency-locking/01-image.png)

예외 메시지 이외에도 테스트에 실패했음을 확인할 수 있었다.

![](/assets/images/posts/order-concurrency-locking/02-image.png)

낙관적 락이 충돌하는 플로우는 아래와 같다. 트랜잭션 A와 트랜잭션 B가 Version이 0인 Product를 읽는다. 이후, 트랜잭션 A가 먼저 Product를 업데이트하고 Version이 1이 된다. 여기서 트랜잭션 B가 업데이트를 치려고 할 때, 이미 Product의 Version이 1이 됐기 때문에 충돌이 발생하여 예외가 발생하고 트랜잭션 B를 롤백이 된다.

![](/assets/images/posts/order-concurrency-locking/03-image.png)

방어 로직을 구현하지 않는다면, 낙관적 락이 충돌했을 때 계속 500 에러를 응답할 것이다. 이를 해결하기 위해서는 두 가지 방법이 있을 거 같다.

- 주문 생성 API에서 낙관적 락이 충돌했을 때, 409 상태 코드를 반환한다.
- 롤백된 트랜잭션을 재시도한다.

첫 번째 방법의 경우 코인 프로젝트에서 작업한 경험이 있다. 관련해서 를 확인하면 좋을 거 같다. 그래서 이번에는 두 번째 방법을 적용해보려고 한다.

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderKeyGenerator orderKeyGenerator;

    @Retryable(
        retryFor = OptimisticLockingFailureException.class,
        maxAttempts = 3,
        backoff = @Backoff(delay = 50)
    )
    @Transactional
    public OrderCreateResponse createOrder(Integer userId, OrderCreateRequest request) {
	    ...
    }
}
```

해당 포스팅에서 재시도에 대한 자세한 내용은 다루지 않을 것이며, 간단하게 Retryable 어노테이션에 대해서만 짚고 넘어간다.

- Retryable 어노테이션은 스프링에서 제공해주는 재시도 로직을 적용하는 어노테이션이다.
	- retryFor : 어떤 예외가 발생했을 때 재시도할 것인지 설정한다.
	- maxAttempts : 최대 몇 번 재시도할 것인지 설정한다.
	- delay : 각 재시도 요청 사이에 얼만큼 딜레이를 줄 것인지 설정한다.

이를 적용하여 테스트를 진행한 결과 정상적으로 통과됐음을 확인할 수 있었고, DB에서도 정합성이 맞음을 확인할 수 있었다.

![](/assets/images/posts/order-concurrency-locking/04-image.png)

![](/assets/images/posts/order-concurrency-locking/05-image.png)

### 비관적 락

데이터를 읽는 시점에 락을 획득한다고 한다. 락을 획득하기 위해서 어떤 로직을 작성해야할까?

쿼리에서는 SELECT FOR UPDATE를 사용하면 된다. 이를 통해 조회 시점에서 락을 획득할 수 있다. 실제 쿼리를 실행하면 아래와 같은 결과를 얻을 수 있다.

![](/assets/images/posts/order-concurrency-locking/06-image.png)

Product의 Id가 1인 레코드에 대해서 X락이 걸렸음을 확인할 수 있다. 추가적으로 처음보는 `superemum pseudo-record` 라는 락 데이터를 확인할 수 있는데, 이 부분은 다른 포스팅에서 다뤄보기로 하고 지금은 넘어갈 것이다.

이를 애플리케이션 코드에서 구현하려면 어떻게 해야할까? JPA에서는 Lock 어노테이션과 함께 아래와 같은 기능을 제공한다.

- PESSIMISTIC_READ
	- 다른 트랜잭션의 수정을 막고 읽기
	- FOR SHARE 또는 LOCK IN SHARE MODE 계열, S Lock
- PESSIMISTIC_WRITE
	- 다른 트랜잭션의 읽기/수정 락 획득을 막고 수정 전제
	- FOR UPDATE 계열, X Lock

현 테스트에서는 X Lock를 획득해야하기 때문에 PESSIMISTIC_WRITE를 사용해야 한다. 이를 코드로 구현하면 아래와 같다.

```java
public interface ProductRepository extends JpaRepository<Product, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT product
        FROM Product product
        WHERE product.id IN :ids
        """)
    List<Product> findAllByIdInForUpdate(@Param("ids") Collection<Integer> ids);
}

```

이후 테스트를 돌려, 정상적으로 통과함을 확인할 수 있었다.

![](/assets/images/posts/order-concurrency-locking/07-image.png)

낙관적 락을 통해 동시성이 제어되는 플로우는 아래와 같다.

![](/assets/images/posts/order-concurrency-locking/08-image.png)

A 트랜잭션에서 X Lock을 가지고 조회를 시작하면, B 트랜잭션에서 A 트랜잭션이 잡고 있는 X 락을 풀리기를 기다린다. A 트랜잭션이 정상적으로 커밋이 된다면, X 락을 풀게 되고 이를 B 트랜잭션이 획득하여 업데이트 로직을 진행한다.

## 마무리

낙관적 락과 비관적 락 메커니즘을 활용하여 동시성을 제어하는 방법을 알아봤다. 다음 포스팅에서는 여태까지 다룬 동시성 제어 방법의 장단점과 적용해야하는 시점에 대해서 알아보고, 성능을 측정하는 시간을 가져볼 것이다.
