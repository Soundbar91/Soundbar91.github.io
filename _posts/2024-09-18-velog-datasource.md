---
title: "DataSource"
date: 2024-09-18T05:21:31Z
categories:
  - DB
excerpt: "커넥션 셔틀"
---
## DataSoure

-   JdbcTemplate를 사용하기 이전에는, 개발자가 직접 DriverManager를 사용해서 Connection를 맺어야 했다.
-   하지만, JdbcTemplate를 사용하게 되면 Connection를 맺는 코드를 개발자가 작성하지 않아도 된다.
-   JdbcTemplate은 DataSource를 사용하고 있다.
    -   [DataSource](https://docs.oracle.com/javase/8/docs/api/javax/sql/DataSource.html)
        -   DriverManager의 대안으로 사용되며, Connection를 획득하기 위해 선호되는 방식이다.
        -   해당 인터페이스를 구현한 객체는 JNDI를 통해 애플리케이션 서버의 JNDI 네임스페이스에 등록된다.
        -   DataSource는 Driver vendor에 의해 구현된다.
            -   커넥션을 맺어준다.
            -   커넥션 풀링을 지원한다.
            -   트랜잭션에서 사용될 수 있는 커넥션을 생성한다.
    -   JNDI
        -   네이밍 및 디렉토리에서 제공하는 데이터 및 객체를 발견하고 참고하기 위한 자바 API이다.
        -   이름과 디렉토리를 통해 객체를 바인딩하며, 각 객체는 고유하고 사용자에게 친숙한 이름으로 식별된다.
        -   애플리케이션은 해당 API을 통해 등록된 자원에 접근할 수 있다.
        -   DataSource도 JNDI를 통해 등록이 되며, 애플리케이션은 등록된 DataSource를 조회하여 데이터베이스 연결을 요청할 수 있다.
    -   AutoConfiguration
        -   애플리케이션 구동과정에서 Configuration 파일을 빈으로 등록되는 과정에 있다.
        -   이 과정에서 DataSource가 빈으로 등록이 된다.
        ![](/assets/images/velog/73tSOjwg53tiHP0Ezysw21-img.png)
        -   DataSourceConfiguration 추상 클래스 내부에는 Hikari 클래스가 선언되있다.
        -   해당 클래스는 Configuration 어노테이션을 가지고 있어, 컴포넌트 스캔 과정에서 빈으로 등록이 된다.
        -   내부에는 dataSource이라는 메소드가 존재하며, 반환값으로 HikariDataSource를 반환한다.
        -   파라미터를 보면 DataSourceProperties 클래스가 존재하고, 내부는 다음과 같다.
        ![](/assets/images/velog/3qXVbpHSVun0vgp3b9szu0-img.png)
        -   ConfigurationProperties 어노테이션은 .properties 혹은 .yml 파일에 있는 설정을 객체에 바인딩할 수 있게 해주는 어노테이션이다.
        -   prefix 설정을 통해 파일의 설정의 공통 접두사를 설정할 수 있다.
        -   클래스 필드를 통해 설정 파일의 값을 가져올 수 있다.
        -   이를 통해 application.yml에 작성한 설정을 자바 객체로 바인딩하고, DataSource를 구성하는데 사용한다.
    -   HikariCP
        -   커넥션 풀의 구현체 중 하나이다.
        -   고성능과 경량화된 커넥션 풀이며, Spring Boot는 기본적으로 HikariCP를 사용한다.