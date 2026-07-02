---
title: "초록 스터디 - Spring Bean"
date: 2024-09-18T05:13:17Z
categories:
  - Spring
excerpt: "Spring Bean 테스트"
---
## Spring Bean

-   스프링은 객체를 관리하는 스프링 컨테이너를 제공한다.
    -   스프링 컨테이너는 객체의 생성, 설정 및 생명주기를 관리한다.
    -   이를 통해 애플리케이션의 복잡성을 줄이고 유지보수를 용이하게 한다.
-   스프링 컨테이너에서 관리되는 객체를 스프링 빈이라고 하며, 스프링 컨테이너를 통해 스프링 빈의 의존성 주입 및 관리가 자동화된다.

### Bean Registration

-   객체를 스프링 빈으로 등록하는 방법은 여러 가지가 존재한다.
-   그 중 `@Component` 어노테이션을 추가하는 방법이 있다.
    -   스프링 빈으로 등록되는 과정은 아래에서 다룬다.

```java
@Component
public class SpringBean {
    public String hello() {
        return "Hello";
    }
}
```

### Bean Autowiring

-   스프링 컨테이너에 등록된 스프링 빈을 가져와서 사용하기 위해서는 개발자가 별도의 명시를 해야한다.
-   `@Autowired` 어노테이션을 사용해서, 스프링 빈을 가져와서 사용하겠다고 명시를 한다.
    -   Autowired : 필요한 의존 객체의 타입에 해당하는 스프링 빈을 찾아 주입해주는 어노테이션이다.
    -   만약, 가져올 타입의 스프링 빈이 존재하지 않을 경우 애플리케이션 구동이 되지 않는다.

```java
@Autowired
private SpringBean springBean;
```

### Test

![](/assets/images/velog/875d2426-fcd4-4619-a08e-660d1f8fe887-image.png)

## Dependency Injection

-   스프링 컨테이너에 등록된 스프링 빈의 의존성을 받는 방법은 여러가지가 있다.

### Constructor Injection

-   생성자를 통해 스프링 빈의 의존성을 받는 방법이 있다.
-   스프링 컨테이너에 스프링 빈을 등록하는 과정에서 생성자의 파라미터를 확인하고, 이에 해당되는 타입을 스프링 컨테이너에서 찾아 주입해준다.

```java
@Service
public class ConstructorInjection {
    private InjectionBean injectionBean;

    public ConstructorInjection(InjectionBean injectionBean) {
        this.injectionBean = injectionBean;
    }

    public String sayHello() {
        return injectionBean.hello();
    }
}
```

-   생성자가 1개만 있을 경우 `@Autowired` 를 생략해도 된다.

### Setter Injection

-   세터를 통해 스프링 빈의 의존성을 받는 방법이 있다.
-   인스턴스를 모두 생성한 이후, 세터를 확인해서 스프링 빈의 의존성을 주입한다.

```java
@Service
public class SetterInjection {
    private InjectionBean injectionBean;

    @Autowired
    public void setInjectionBean(InjectionBean injectionBean) {
        this.injectionBean = injectionBean;
    }

    public String sayHello() {
        return injectionBean.hello();
    }
}
```

-   세터에 꼭 `@Autowired` 어노테이션을 작성해야 한다.

### Field Injection

-   필드를 통해 스프링 빈의 의존성을 받는 방법이 있다.
-   의존성 주입을 받을 필드에 `@Autowired` 어노테이션을 작성한다.

```java
@Service
public class FieldInjection {
    @Autowired
    private InjectionBean injectionBean;

    public String sayHello() {
        return injectionBean.hello();
    }
}
```

### Test

![](/assets/images/velog/69642e96-0c7c-49db-a9a9-8aa8128fb2c1-image.png)


## Component Scan

-   스프링 컨테이너에서 스프링 빈을 자동으로 찾아서 등록하는 방법이다.

### @ComponentScan

-   `@Component` 어노테이션이 작성된 클래스를 찾도록 지시하는 어노테이션이다.
-   `@Service, @Controller, @Repository` 등 여러 어노테이션에 `@Component` 어노테이션이 존재한다.

```java
@ComponentScan(
    excludeFilters = {@Filter(
    type = FilterType.CUSTOM,
    classes = {TypeExcludeFilter.class}
), @Filter(
    type = FilterType.CUSTOM,
    classes = {AutoConfigurationExcludeFilter.class}
)}
)
public @interface SpringBootApplication
```

-   `@SpringBootApplication` 어노테이션 내부에 `@ComponentScan` 어노테이션이 있다.
-   탐색을 시작할 패키지 경로, 탐색을 제외할 패키지의 경로 등을 설정할 수 있다.

### Test

![](/assets/images/velog/4eb98b8b-6910-4730-9927-f99ef658c438-image.png)