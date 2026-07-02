---
title: "AtomicLong"
date: 2024-09-18T05:27:20Z
categories:
  - Java
excerpt: "동시에 값을 증가시키면 어떻게 될까"
---
## AtomicLong란

-   자바에서 제공하는 클래스로 멀티 스레드 환경에서 원자적으로 연산을 수행할 수 있도록 도와준다.
-   `java.util.concurrent.atomic` 패키지에서 제공을 하며, `AtomicInteger, AtomicBoolean, AtomiceReference` 등 다른 자료형에 대해서도 클래스를 제공한다.
-   `Atomic` , 원자를 의미하며, 각 연산을 외부에 영향을 미치지 않고 원자적으로 수행할 수 있다.
    -   lock을 걸지 않고 동시성 환경을 해결하는 알고리즘은 데이터 무결성을 보장하기 위한 [CAS 연산](https://wannabe-gosu.tistory.com/29)을 적용한다고 한다.
    -   AtomicLong와 같은 클래스에도 해당 연산이 적용됐다고 한다.

## 증감연산자와 차이점

-   userId++과 같은 증감 연산자는 싱글 스레드 환경에서는 정상적으로 동작하지만, 점점 스레드가 많아지면 기대한 값을 확인하기 어려워진다.
-   그 이유는 `++` 와 같은 증감연산의 로직 때문이라고 한다.
    -   userId의 값을 얻는다.
    -   userId의 값을 증가시킨다.
    -   증가된 userId의 값을 기존 메모리에 다시 쓴다.
-   만약, 두 개의 스레드에서 userId++ 연산을 수행하게 되면, 초기에 동일한 값을 얻고 각각 증가시키기 때문에 기대값보다 적게 증가할 수 있다.
    -   A와 B가 userId = 6의 값을 증감연산으로 증가시킬려고 한다.
    -   초기에 동일한 값 6을 가져오게 되고 각각 증가시킨다.
    -   그러면 A와 B는 동일하게 7이라는 값을 가지게 된다.
    -   A와 B가 값을 증가시켰기 때문에 userId는 8이라는 값을 가져야하지만, 결과적으로는 7이라는 값을 가지게 됐다.
-   이를 해결하기 위해 `synchronized` 키워드를 사용하는 방법도 존재한다.
    -   다만 이 방법을 사용하게 되면, 하나의 스레드가 lock를 걸고 연산을 수행할 때, 다른 스레드는 lock이 풀릴 때 까지 기달려야 한다.
    -   다른 일을 하지 못하고 계속 기다려야 하기 때문에 성능저하가 발생할 수 있다.

## 테스트

```java
@Test
void addTest() throws InterruptedException {
    Counter counter = new Counter();
    int threadCount = 10000;

    ExecutorService executorService = Executors.newFixedThreadPool(32);
    CountDownLatch countDownLatch = new CountDownLatch(threadCount);

    for (int i = 0; i < threadCount; i++) {
        executorService.submit(() - > {
            try {
                counter.increment();
            } finally {
                countDownLatch.countDown();
            }
        });
    }
    countDownLatch.await();
    executorService.shutdown();

    assertEquals(threadCount, counter.getCount());
}

public static class Counter {
    int count = 0;

    public void increment() {
        count++;
    }

    public int getCount() {
        return count;
    }
}
```

-   int 자료형으로 변수를 사용할려 했으나, 스레드간 공유가 되지 않아 Atomic 클래스를 사용하라고 문구가 나왔다.
-   순수 증감 연산자만 사용해서 테스트를 진행하고 싶기 때문에, Counter라는 클래스를 선언해서 테스트를 진행했다.
-   테스트 결과는 다음과 같다.  

![](/assets/images/velog/fbefde57-164d-4b47-b634-47c299f38846-image.png)

    -   스레드의 개수가 적을 때는 통과를 하지만, 스레드의 개수가 증가하면 점점 기댓값보다 적은 값이 나온다.

```java
public synchronized void increment() {
    count++;
}
```

-   `synchronized` 키워드를 사용해서 테스트를 진행해봤다.
-   테스트 결과는 다음과 같다.  

![](/assets/images/velog/f108d87e-e4b0-4061-a61a-d71ca833b66b-image.png)

    -   성능 저하가 발생한다고 했는데, 테스트 코드 실행시간에서 큰 차이가 나지 않았다.
    -   테스트 코드를 잘못 작성한건가..?