---
title: "초록 스터디 - JdbcTemplate"
date: 2024-09-18T05:11:08Z
categories:
  - Spring
excerpt: "JdbcTemplate 테스트"
---
## JdbcTemplate

- Spring JDBC의 핵심이 되는 클래스이다.
    - SQL 쿼리 실행
    - 결과 데이터가 저장된 ResultSet에서 값을 추출
    - JDBC에서 발생한 예외를 일반적이고 더 유용한 예외 계층으로 변환
- Spring JDBC의 일부 구현체들도 내부에서 JdbcTemplate를 사용한다.

## Querying for a Single Object

### Object with Count

```java
public <T> T queryForObject(String sql, Class<T> requiredType)
```

- 메소드 파라미터는 다음과 같다.
    - sql : 쿼리문
    - requiredType : 조회 결과를 매핑할 클래스 타입
- 해당 메소드를 통해 데이터베이스에서 단일 객체를 조회할 수 있다.

```java
jdbcTemplate.queryForObject("select count(*) from customers", Integer.class);
```

- `count(*)` 의 결과값으로 정수가 반환이 되고, 이를 `Integer.class` 에 매핑이 된다.

### Object with Parameter

```java
public <T> T queryForObject(String sql, Class<T> requiredType, @Nullable Object... args)
```

- 쿼리에 조건문을 사용하기 위해서는 다음과 같은 방법을 사용한다.
    - 쿼리의 조건문에 `?` 를 사용한다.
    - `?` 에 바인딩할 값을 메소드의 세 번째 파라미터부터 작성을 한다.

```java
jdbcTemplate.queryForObject("select last_name from customers where id = ?", String.class, id);
```

- 쿼리에 작성된 `id = ?` 에 `id` 값이 바인딩되어 데이터베이스에 날라간다.
- `last_name` 이 결과값으로 반환이 되고, 이를 `String.class` 에 매핑이 된다.

### Object with RowMapper

```java
public <T> T queryForObject(String sql, RowMapper<T> rowMapper, @Nullable Object... args)
```

- 지금까지는 데이터베이스로부터 하나의 데이터를 반환을 받아 클래스에 매핑을 했다.
- 여러 필드의 값을 반환을 받는 경우에는 RowMapper 클래스를 사용한다.
    - RowMapper
        - row 단위로 ResultSet의 row를 매핑하기 위해 JdbcTemplate에서 사용하는 함수형 인터페이스
        
![](/assets/images/velog/OShIt9bJdnNYnjCeKQk9b1-img.png)
        
        - rowNum : 반환된 ResultSet의 순서
        
```java
private final RowMapper<Customer> actorRowMapper = (resultSet, rowNum) - > {
    Customer customer = new Customer(
        resultSet.getLong("id"),
        resultSet.getString("first_name"),
        resultSet.getString("last_name")
    );
    return customer;
};
```
        
        - 다음과 같이 작성할 수 있다.
            - <T>의 값에는 매핑할 클래스를 작성한다.
            - ResultSet에서 가져올 필드의 이름과 자료형을 적절하게 매칭한다.
        - 이를 통해 데이터베이스에서 반환받은 데이터를 객체에 매핑시킬 수 있다.
    - 함수형 인터페이스
        - Java8에서는 함수를 객체처럼 다룰 수 있게 [함수형 인터페이스](https://zzang9ha.tistory.com/303#google_vignette)를 제공한다.
        - 함수형 인터페이스는 추상 메소드가 딱 하나만 존재하는 인터페이스이다.
        - @FunctionalInterface 어노테이션은 Java8에서 추가된 어노테이션이다.
        - 만약, 해당 어노테이션이 작성된 인터페이스에 2개 이상의 메소드가 존재하면 컴파일 오류가 발생한다.
            - 단, static 혹은 default이 붙은 메소드의 경우 영향을 미치지 않는다.
        - 함수형 인터페이스는 람다식만 이용해서 작성될 수 있다.
        - 자바에 정의되어 있는 함수형 인터페이스는 다음과 같다.
            - Function<T, R>
            - Consumer<T>
            - Predicate<T>
            - Supplier<T>

```java
jdbcTemplate.queryForObject(sql, actorRowMapper, id);
```

- 사용할 RowMapper 클래스를 선언하고, 이를 가져다 사용하면 코드가 간결해진다.

### Test

![](/assets/images/velog/7b2475c6-742f-4fd9-b3f2-aca12e469fe9-image.png)

## Querying for a List

### List with RowMapper

```java
public <T> List<T> query(String sql, RowMapper<T> rowMapper)
```

- 단일 데이터가 아닌, 여러 개의 데이터를 반환받고 싶다면 query 메소드를 사용하면 된다.

```java
List<Customer> = jdbcTemplate.query(sql, actorRowMapper);
```

- 반환받은 데이터들을 사용한 RowMapper에 매핑을 하고 이를 리스트에 저장한다.

### List with RowMapper, Parameter

```java
public <T> List<T> query(String sql, RowMapper<T> rowMapper, @Nullable Object... args)
```

- 조건문을 사용하는 과정도 동일하게 바인딩할 값을 세 번째 메소드 파라미터에 작성을 한다.

```java
String sql = "select id, first_name, last_name from customers where first_name = ?";
jdbcTemplate.query(sql, actorRowMapper, firstName);
```

### Test

![](/assets/images/velog/a6962843-88ab-4d68-a482-4e026a1e32ea-image.png)

## Updating

### INSERT, UPDATE, DELETE

```java
public int update(String sql, @Nullable Object... args)
```

- 해당 메소드를 통해 INSERT, UPDATE, DELETE를 수행할 수 있다.
- 수행할 쿼리에 맞게 sql를 작성해주면 된다.

```java
jdbcTemplate.update("insert into customers (first_name, last_name) values (?, ?)", customer.getFirstName(), customer.getLastName());
jdbcTemplate.update("update t_actor set last_name = ? where id = ?", "Banjo", 5276L);
jdbcTemplate.update("delete from customers where id = ?", id);
```

### KeyHolder

- INSERT 쿼리를 통해 데이터베이스에 데이터가 추가되고, 이 때 생성된 PK 값을 가져오기 위해 KeyHolder를 사용할 수 있다.

```java
public int update(final PreparedStatementCreator psc, final KeyHolder generatedKeyHolder)

jdbcTemplate.update(connection - > {
    PreparedStatement ps = connection.prepareStatement(sql, new String[] {
        "id"
    });
    ps.setString(1, customer.getFirstName());
    ps.setString(2, customer.getLastName());
    return ps;
}, keyHolder);
```

- update 메소드의 파라미터로 PreparedStatementCreator, KeyHolder를 넘겨줬다.
    - PreparedStatementCreator
        - 함수형 인터페이스이다.
        
![](/assets/images/velog/RuT9KBOSkVkbcipo68Vh8K-img.png)
        
        - PreparedStatement를 생성하는 메소드를 가지고 있다.
    - PreparedStatement
        - Statment 클래스를 상속받고 있다.
        - 코드의 가독성이 좋다.
        - 메소드를 이용해서 직접 쿼리에 바인딩을 해야하기 때문에 코드량이 많아진다.
        
```java
PreparedStatement prepareStatement(String sql, String columnNames[])
```
        
        - columnNames에는 자동 생성되는 PK의 목록을 지정할 떄 사용한다.
    - KeyHolder
        
```java
KeyHolder keyHolder = new GeneratedKeyHolder();
```
        
        - 생성된 PK의 값을 담고 있는 클래스이다.
        
```java
keyHolder.getKey().longValue();
```
        
        - getKey() 메소드를 통해 생성된 PK를 반환받을 수 있다.
        - getKey() 메소드의 반환값은 `Number` 클래스이며,  XXValue() 메소드를 통해 원하는 자료형으로 캐스팅할 수 있다.

### Test

![](/assets/images/velog/9735521f-834f-4422-b71e-ea9070b2a566-image.png)
