---
title: "DB Constraints"
date: 2024-08-16T07:27:51Z
categories:
  - DB
excerpt: "데이터베이스 출입국 관리"
---
## PK

- Primary Key
- 각 레코드를 **구별할 수 있는 값**
- **수정이 불가능**하고 **중복이 허용되지 않는 값**
- 테이블 당 하나만 설정이 가능하며, NULL 값이 될 수 없음
- 기본키 혹은 식별자로 호칭

```sql
CREATE TABLE user (
	id INT NOT NULL AUTO_INCREMENT,
	name varchar(50)
	 PRIMARY KEY(id)
)
```

- RIMARY KEY(id)를 통해 id 속성을 기본키로 설정
- NOT NULL을 통해 NULL 값이 될 수 없게 설정
- AUTO_INCREMENT로 레코드가 생성될 때마다 자동으로 증가

## FK

- Foreign Key
- **다른 테이블의 레코드를 참조**하기 위한 값
- 다른 테이블의 기본키를 사용해서 표현
- 테이블의 PK가 다른 테이블의 FK로 참조되고 있다면, PK 테이블의 레코드 삭제 불가능
- FK는 PK와 동일한 자료형으로 설정

```sql
CREATE TABLE orders (
    order_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_date DATE,
    PRIMARY KEY(order_id),
    FOREIGN KEY(user_id) REFERENCES user(id)
);
```

- order_id를 PK로 설정
- FOREIGN KEY(user_id)를 통해 user_id 속성을 FK로 설정
- REFERNCES user(id)를 통해 user_id는 user 테이블의 id 값을 참조하도록 설정

## Unique

- 속성에 대해서 **중복된 값을 허용하지 않는 제약 조건**
- 기본키와 달리 테이블 당 여러개 설정이 가능
- Null 값을 허용하지만, 속성 당 한 개의 Null 값만 허용

```sql
CREATE TABLE user (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50),
    email VARCHAR(320),
    phone VARCHAR(15),
    UNIQUE (email, phone),
    PRIMARY KEY (id)
);
```

- email과 phone 속성에 Unique 제약 조건을 설정