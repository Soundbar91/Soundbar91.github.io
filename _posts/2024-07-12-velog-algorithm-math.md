---
title: "알고리즘 - 수학"
date: 2024-07-12T12:11:10Z
categories:
  - Algorithm
excerpt: "컴공.수학.중요."
---
## 서론

이번 주차에는 [수학](https://github.com/tony9402/baekjoon/tree/main/algorithms/math)를 다루는 알고리즘 문제를 접했다. 
심도있는 수학이 아닌 기초적인 내용을 다루는 문제들이 많았다. 소수, 최소 공배수 그리고 최대 공약수 등 학교에서 배울 때는 간단한 이론이지만, 이를 처음 구현해보면 쉽지는 않다. 구현 자체는 할 수 있지만, 효율적으로 구하는 방법을 모르면 시간 초과에 걸리기 일상이다. 
총 18문제를 풀었으며, 문제에 대한 소개도 있지만 주로 사용되는 방법 정리도 했다. 

## 본론

- [2960. 에라토스테네스의 체](https://www.acmicpc.net/problem/2960)

    
    에라토스테네스의 체는 소수를 `O(nlog(log n))` 에 판별할 수 있는 방법이다. 
    소수를 표시할 boolean 배열을 선언하고, 이중 반복문으로 소수가 아닌 수는 true로 표시한다. 
    소수를 다 찾으면 false 표시가 된 수가 소수이며, 순회를 통해 소수를 담는 방법도 있지만 이중 반복문을 돌 때 List 자료형에 넣는다면 추가 연산이 필요없다. 
    
    ```java
    for (int i = 2; i <= N; i++) {
        if (nums[i]) continue;
    		list.add(i);
    		
        for (int j = i * 2; j <= N; j += i) {
            nums[j] = true;
        }
    }
    ```
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Silver/2960.%E2%80%85%EC%97%90%EB%9D%BC%ED%86%A0%EC%8A%A4%ED%85%8C%EB%84%A4%EC%8A%A4%EC%9D%98%E2%80%85%EC%B2%B4)
    
- [2609. 최대공약수와 최소공배수](https://www.acmicpc.net/problem/2609)
    
    유클리드 호제법을 사용해보는 문제이다. 
    유클리드 호제법은 최대공약수를 구하는 데 사용하는 방법으로, 자세한 증명은 [여기서](https://st-lab.tistory.com/154) 참고했다. 
    
    ```java
    while (B != 0) {
        int r = A % B;
        A = B;
        B = r;
    }
    
    return A;
    
    ```
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Bronze/2609.%E2%80%85%EC%B5%9C%EB%8C%80%EA%B3%B5%EC%95%BD%EC%88%98%EC%99%80%E2%80%85%EC%B5%9C%EC%86%8C%EA%B3%B5%EB%B0%B0%EC%88%98)
    
- [21275. 폰 호석만](https://www.acmicpc.net/problem/21275)
    
    문제 요구 사항은 쉽다고 느꼈지만, 구현 단계에서 간과한 사실들이 많아 어려움을 겪었다. 
    첫 번째로, 종이에 써진 수에서 최고로 높은 알파벳보다 낮은 진수로 구성될 수 없다. 가령 11진수인데 c가 포함이 되면 안된다. 그렇기 때문에 제일 높은 알파벳을 찾고 그 이후의 진수를 탐색한다. 
    두 번째로는 찾은 진수에 +1를 해서 탐색해야 한다. 8진수는 7까지만 표현되고 그 이후로는 알파벳으로 표현이 되는 것처럼 제일 높은 알파벳을 찾으면 해당 알파벳 진수에 1를 더해서 탐색해야 한다. 
    
    ```java
    for (int i = indexLeft; i <= 36; i++) {
        long leftSum = calc(left, i);
    
        for (int j = indexRight; j <= 36; j++) {
            if (i == j) continue;
    
            long rightSum = calc(right, j);
            if (leftSum == rightSum) list.add(new long[]{leftSum, i, j});
        }
    }
    
    ```
    ![](/assets/images/velog/19630afa-8025-480b-a39f-cde24661478f-image.png)
    
    처음에는 모든 진수로 변환하고 맞으면 추가하는 로직으로 구현을 했지만, 절반만 맞았다..
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Silver/21275.%E2%80%85%ED%8F%B0%E2%80%85%ED%98%B8%EC%84%9D%EB%A7%8C)
    
- [22943. 수](https://www.acmicpc.net/problem/22943)
    
    이 문제도 요구 사항은 쉽다고 느꼈다. 다만, 조건 1과 조건 2를 분리해서 검사하니 시간초과가 발생한 것 같다. 
    찾아보니 조건 1과 조건 2에 해당하는 수를 집합에 저장하고 검사하는 형식으로 구현한 로직이 있었다. 이런 생각을 하는게 신기하다.. 
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Gold/22943.%E2%80%85%EC%88%98)
    

## 결론

이산수학 시간에 배운 내용이 많이 나왔다. 그 때는 구현으로 연계될 생각을 못했는데, 이산 수학이 중요한 강의였다는 것을 느꼈다. 이항 계수나 연립합동방정식 내용도 있다는데, 접해볼 기회가 생기면 기록으로 남겨야겠다. 

![](/assets/images/velog/4bcbe017-77f6-40fd-a486-58fa0e7a0cb3-image.png)

다음 주차는 그래프 탐색이다. 왠지 모르겠지만 그래프 이론 레이팅이 제일 높다. 하지만 지금은 다 잊어버린 것 같다. 익숙하다고 자만하지 말고 배우는 자세로 접근하자.