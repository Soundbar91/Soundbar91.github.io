---
title: 주문 동시성 테스트 - Lost Update
date: 2026-07-09
categories:
  - DB
excerpt: 원자적 업데이트로 Lost Update를 방지하고 데이터 정합성을 맞춘다.
---

## 서론

이전 포스팅에서 데드락이 발생하는 원인을 파악했다. 결국은 외래키로 인한 S Lock이 X Lock으로 승격하는 과정을 막는다면 데드락이 발생하지 않을까? 이번 포스팅에서는 해당 방법을 적용하여 어떤 결과가 나오는지 확인한다.

## 본론

### 쿼리 순서

주문 생성 API에서 실행되는 쿼리의 순서는 아래와 같다.

```sql
Hibernate: 
    select
        u1_0.id,
        u1_0.created_at,
        u1_0.login_id,
        u1_0.password,
        u1_0.updated_at 
    from
        users u1_0 
    where
        u1_0.id=?
Hibernate: 
    select
        p1_0.id,
        p1_0.created_at,
        p1_0.name,
        p1_0.price,
        p1_0.quantity,
        p1_0.status,
        p1_0.updated_at 
    from
        products p1_0 
    where
        p1_0.id in (?)
Hibernate: 
    insert 
    into
        orders
        (created_at, order_key, status, total_price, updated_at, user_id) 
    values
        (?, ?, ?, ?, ?, ?)
Hibernate: 
    insert 
    into
        order_items
        (created_at, order_id, price, product_id, quantity, updated_at) 
    values
        (?, ?, ?, ?, ?, ?)
Hibernate: 
    update
        products 
    set
        name=?,
        price=?,
        quantity=?,
        status=?,
        updated_at=? 
    where
        id=?
```

Order과 OrderItem를 추가한 후 Product를 업데이트한다. 이러한 쿼리 순서로 인해 데드락이 발생했다. 그렇다면, Product를 먼저 업데이트하고 Order과 OrderItem를 추가하면 데드락을 예방할 수 있을까? 어떻게 락이 걸리는 지 DB에서 확인했다.

![](/assets/images/posts/order-concurrency-test-lost-update/image-01.png)

Product의 Id가 1인 레코드를 업데이트할 때 X Lock이 걸렸다. OrderItem를 추가할 때도 Product에 X Lock이 걸렸다. 원래는 S Lock이 걸려야 하지만, X Lock이 걸려있기 때문에 S Lock를 걸지 않은 것으로 확인된다. 

Product에 S Lock이 걸리지 않고 처음부터 X Lock를 가진 상태에서 quantity를 업데이트하기 때문에 데드락이 발생하지 않을 거 같다. 왜냐하면 하나의 트랜잭션에서 Product에 대해서 X Lock를 소유하게 된다면, 다른 트랜잭션에서는 Product의 X Lock이 풀리기를 기다려야하기 때문이다. 

```java
decreaseProductQuantities(quantitiesByProductId, productsById);
productRepository.flush();

Order order = orderRepository.save(Order.create(user, orderKeyGenerator.generate(), totalPrice));
List<OrderItem> orderItems = quantitiesByProductId.entrySet()
     .stream()
     .map(entry -> createOrderItem(order, productsById.get(entry.getKey()), entry.getValue()))
     .toList();
orderItemRepository.saveAll(orderItems);
```

Product의 quantity를 먼저 업데이트하고 이후에 Order과 OrderItem를 추가하도록 코드를 수정했다. flush()를 사용한 이유는 영속성 컨텍스트에 있는 Product의 변경사항을 DB에 바로 반영하기 위함이다. 그렇지 않으면, Insert 쿼리가 Update 쿼리보다 먼저 DB에 반영되어 데드락이 발생한다.

![](/assets/images/posts/order-concurrency-test-lost-update/image-02.png)

`order_unexpected_failure_count` 가 0으로 집계되면서 데드락이 발생하지 않았으나, 모든 요청이 성공으로 카운팅됐다. 또한 DB를 확인하니 Order과 OrderItem이 각각 300개가 생성됐고, Product의 quantity 컬럼의 값은 70으로 수정되어 있다.

![](/assets/images/posts/order-concurrency-test-lost-update/image-03.png)

결과적으로 데드락이 발생하지 않았으나, 데이터의 정합성이 깨져있음을 확인할 수 있었다. 

### Lost Update 문제

300개의 요청이 모두 정상처리 됐으나, 수량은 70개가 남았다. 이는 이전에 FK 제약 조건을 삭제했을 때도 동일했다. 그렇다면, Product의 quantity를 업데이트하는 과정에서 문제가 발생한것이 아닐까? Product의 quantity를 업데이트하는 메소드는 아래와 같다.

```java
public void decreaseQuantity(Integer orderQuantity) {
    if (status != SALE) {
        throw BusinessException.of(ErrorCode.NOT_SALE_PRODUCT, "productId : " + id);
    }
    if (quantity < orderQuantity) {
        throw BusinessException.of(ErrorCode.OUT_OF_STOCK, "productId : " + id);
    }

    this.quantity -= orderQuantity;
    if (quantity == 0) {
        status = SOLD_OUT;
    }
}
```

해당 메소드에 로깅을 남기고 테스트를 돌렸다.

![](/assets/images/posts/order-concurrency-test-lost-update/image-04.png)

로깅을 통해 알 수 있는 정보는 Product의 quantity 컬럼에 대해서 동일한 값으로 읽고 동일한 값으로 업데이트 치는 요청이 많다는 것이다. 이러한 현상을 Lost Update 문제라고 한다. 

![](/assets/images/posts/order-concurrency-test-lost-update/image-05.png)

Product를 읽는 과정에서는 모든 트랜잭션이 읽을 수 있다. 하지만 하나의 트랜잭션에서 Product에 업데이트를 치려는 순간 해당 레코드에 X Lock이 걸리기 때문에 다른 트랜잭션에서 X Lock이 풀리기를 기다려야 한다. 풀린 이후에 다른 트랜잭션에서도 Product에 업데이트를 치는데, 이 때 문제가 발생한다.

현재 Product의 quantity 업데이트 로직은 최초에 읽은 값에 대해서 1를 차감한다. 하지만 두 트랜잭션에서 동일한 값으로 읽었기 때문에 트랜잭션에서 기대하는 Product의 quantity 결과값이 동일하다.

그렇게 된다면, 동시에 요청이 들어왔을 때 정상적으로 상품의 제고가 차감되지 않고 비즈니스적 문제가 발생할 것이다. 이를 해결하기 위해서는 업데이트 코드를 수정해야할 거 같다.

### 업데이트 로직 수정

최초에 읽은 값에 대해서 1를 차감하는 것이 아닌 업데이트를 하는 순간 값에 대해서 1를 차감하는 로직으로 수정이 필요하다. 이렇게 해야 X Lock를 획득했을 때 값을 정상적으로 차감할 수 있기 때문이다. 

```java
public interface ProductRepository extends JpaRepository<Product, Integer> {

    @Modifying
    @Query("""
        UPDATE Product product
        SET product.quantity = product.quantity - :quantity,
            product.status = CASE
                WHEN product.quantity - :quantity = 0
                THEN io.naga.commerce.domain.product.model.ProductStatus.SOLD_OUT
                ELSE product.status
            END,
            product.updatedAt = CURRENT_TIMESTAMP
        WHERE product.id = :productId
            AND product.status = io.naga.commerce.domain.product.model.ProductStatus.SALE
            AND product.quantity >= :quantity
        """)
    int decreaseQuantity(@Param("productId") Integer productId, @Param("quantity") Integer quantity);
}
```

그리고 서비스단에서는 아래와 같이 메소드를 호출했다.

```java
private void decreaseProductQuantities(Map<Integer, Integer> quantitiesByProductId) {
    quantitiesByProductId.forEach((productId, quantity) -> {
        int updatedCount = productRepository.decreaseQuantity(productId, quantity);
        if (updatedCount == 0) {
            throw BusinessException.of(OUT_OF_STOCK, "productId : " + productId);
        }
    });
}
```

`decreaseQuantity()` 메소드의 반환값은 실행되는 쿼리가 적용된 컬럼의 개수를 반환한다. 만약, 쿼리가 적용되지 않았다면 해당 제품의 제고가 다 떨어졌다는 것이다. 이를 적용한 플로우는 아래와 같다. 

![](/assets/images/posts/order-concurrency-test-lost-update/image-06.png)

### 업데이트 컬럼 순서

테스트를 통해 정합성이 맞는지 확인을 했다. 1개의 요청이 성공되지 않아 실패했다. 

![](/assets/images/posts/order-concurrency-test-lost-update/image-07.png)

DB를 확인하니 아래와 같이 Product 테이블의 quantity와 status 컬럼 데이터 값에 문제가 있음을 확인할 수 있었다. 

![](/assets/images/posts/order-concurrency-test-lost-update/image-08.png)

업데이트하는 과정에서 값이 잘못 들어갔음을 예측할 수 있고, 리파지토리 메소드에 문제가 있다고 생각했다. 그래서 쿼리에서 원인일 거 같은 부분에 대해서 Codex에 질문을 던졌다.

![](/assets/images/posts/order-concurrency-test-lost-update/image-09.png)

처음에는 아니라고 답변을 했지만, 관련해서 구글링을 하고 테스트 결과를 첨부해서 다시 물어봤다. 결과적으로는 Update 쿼리에서 앞에서 업데이트된 컬럼을 뒤에서 참조한다. 하지만 이는 DB마다 차이가 있다. 이 부분에 대해서 해당 포스팅에서 자세하게 다루지 않고, MySQL의 공식문서에 작성된 문장 하나만 짚고 넘어간다.

> Single-table [`UPDATE`](https://dev.mysql.com/doc/refman/9.7/en/update.html) assignments are generally evaluated from left to right.

현재 프로젝트에서는 MySQL를 사용하기 때문에 순서를 보장받으며 그렇기 때문에 작성한 쿼리를 수정해야한다. 수정 방법은 두 가지가 있다.

- status 업데이트 이후 quantity를 차감한다.
- quantity 차감 쿼리와 status 업데이트 쿼리를 분리한다.

두 방법 큰 차이가 없는 거 같다. 2번째 방법은 쿼리가 2번 발생하면서 코드를 추가적으로 작성해야하기 때문에 한 번에 처리하는 첫 번째 방법으로 적용했다. 

```java
public interface ProductRepository extends JpaRepository<Product, Integer> {

    @Modifying
    @Query("""
        UPDATE Product product
        SET product.status = CASE
                WHEN product.quantity - :quantity = 0
                THEN io.naga.commerce.domain.product.model.ProductStatus.SOLD_OUT
                ELSE product.status
            END,
            product.quantity = product.quantity - :quantity,
            product.updatedAt = CURRENT_TIMESTAMP
        WHERE product.id = :productId
            AND product.status = io.naga.commerce.domain.product.model.ProductStatus.SALE
            AND product.quantity >= :quantity
        """)
    int decreaseQuantity(@Param("productId") Integer productId, @Param("quantity") Integer quantity);
}

```

테스트 결과 정상적으로 통과됐고, DB에서도 데이터 정합성이 맞음을 확인했다.

![](/assets/images/posts/order-concurrency-test-lost-update/image-10.png)

![](/assets/images/posts/order-concurrency-test-lost-update/image-11.png)

### 참고 자료

[MySQL :: MySQL 9.7 Reference Manual :: 15.2.17 UPDATE Statement](https://dev.mysql.com/doc/refman/9.7/en/update.html)

## 마무리

쿼리의 순서를 바꾸고, 원자적으로 데이터를 업데이트할 수 있는 방법을 적용하여 데이터 정합성을 맞췄다. 다른 방법으로도 데이터의 정합성을 맞출 수 있는지 다음 포스팅에서 다뤄볼 예정이다.
