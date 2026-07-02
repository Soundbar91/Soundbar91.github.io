---
title: "알고리즘 - 백트래킹"
date: 2024-07-06T12:37:01Z
categories:
  - Algorithm
excerpt: "돌다리도 두드리고 건너기"
---
## 들어가기

이번 주는 [백트래킹 문제](https://github.com/tony9402/baekjoon/tree/main/algorithms/backtracking)를 풀었다. 개인적으로 내린 백트래킹의 정의는 `지성 있는 탐색` 이다. 
코드를 보면 모든 경우의 수를 다 찾는 것 처럼보이지만, 해당 경우가 적절한 경우인지를 판단하는 검증 단계에 통과를 해야 다음 단계로 넘어가기 때문에 지성 있는 탐색이라고 생각했다. 그렇기 때문에 **검증 단계의 코드를 잘 작성하는 것이 백트래킹 문제의 중점 요소**였다. 
총 24문제를 풀었으며, 절반이 N과 M 시리즈이다. 문제를 풀면서 N과 M 시리즈에서 얻을 수 있는 기본기가 중요함을 깨달았다. 기본기는 언제나 중요하다. 

## 문제

- [15663. M과 M (9)](https://www.acmicpc.net/problem/15663)
    
    `중복되는 수열을 여러 번 출력하면 안되며,` 조건이 처음에는 까다로웠다. 
    집합에 넣을 생각도 해봤지만, 그렇게 하면 백트래킹의 의미가 없다고 생각했다. 
    
```java
int preValue = 0;
```
    
    이전에 나온 숫자를 저장해서 다른 경우에면 수열 탐색을 할 수 있도록 해야 했다. 

    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Silver/15663.%E2%80%85N%EA%B3%BC%E2%80%85M%E2%80%85%EF%BC%889%EF%BC%89)
    
- [1182. 부분수열의 합](https://www.acmicpc.net/problem/1182)
    
    계속 틀린 이유를 찾지 못하다가, `S == 0` 인 경우에 아무것도 선택하지 않는 경우와 부분수열의 합으로 구한 경우가 같이 존재하기 때문에 하나 빼야했다. 
    
```java
if (S == 0) result--;
```
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Silver/1182.%E2%80%85%EB%B6%80%EB%B6%84%EC%88%98%EC%97%B4%EC%9D%98%E2%80%85%ED%95%A9)
    
- [1174. 줄어드는 수](https://www.acmicpc.net/problem/1174)
    
    처음에는 1000000까지의 숫자에서 줄어드는 수를 찾는 것으로  이해를 해서 시간을 낭비했다. 십진수로 표현한 줄어드는 수의 최대값은 `9876543210` 이다. 
    이를 이용하면, 배열에 `[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]` 을 저장하고 숫자를 선택한 경우와 선택하지 않는 경우를 재귀로 호출하면 된다. 
    여기까지는 오케이하고 코드를 작성하고 제출했지만 예외가 터진다. 그렇다. 입력한 번째의 수에 해당하는 줄어드는 수가 없을 수 있으며, try-catch로 예외를 잡고 `-1` 을 출력해야 한다. 
    
```java
try {
         System.out.print(result.get(N - 1));
     } catch (IndexOutOfBoundsException e) {
         System.out.print(-1);
     }
```
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Gold/1174.%E2%80%85%EC%A4%84%EC%96%B4%EB%93%9C%EB%8A%94%E2%80%85%EC%88%98)
    
- [14712. 넴모넴모 (Easy)](https://www.acmicpc.net/problem/14712)
    
    설치를 하고 2x2 넴모넴모가 있는 지 확인을 하는 메소드 구현을 잘못해서 시간초과 발생했다. 
    
    > 1. 좌표 범위 고려
        1. 2x2를 체크해야 하기 때문에,  N x M 모두를 탐색하는 것이 아닌 (N - 1) * (M - 1) 탐색
    2. 재귀 레벨이 3 이하인 경우에는 2x2 넴모넴모가 존재할 수 없다.  
    
    그리고 2차원 배열의 인덱스를 변수 하나로 표현할 수 있는 방법을 알게 됐다. 
    
```java
int x = i / M, y = i % M;
```
    
    재귀로 넘겨줄 때 좌표를 어떻게 넘겨줄지 고민을 많이 했는데, 명쾌한 해답이 있었다. 해당 방법은 다른 문제를 풀 때도 유용하게 사용했다. 
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Gold/1174.%E2%80%85%EC%A4%84%EC%96%B4%EB%93%9C%EB%8A%94%E2%80%85%EC%88%98)
    
- [1062. 가르침](https://www.acmicpc.net/problem/1062)
    
    ~~북극곰아 미안해~~
    
    `anta` 와 `tica` 도 포함이 되는지 안 되는지의 갈림길에서 포함이 된다고 생각하고 풀었다. 
    첫 접근 방법은 무조건 포함되는 단어를 제외하고 A 문장에 있는 단어를 학습 후, 다른 문장을 검사하면서 읽을 수 있는 문장의 최대의 개수를 구했다. 하지만 여기에는 반례가 존재했다. 
    > `a, b, c, d, a, a, c, c, c, c` 가 존재하고 두개의 단어를 학습할 수 있다고 가정을 한다. 
    `a, b` 를 학습할 수 있고, 최대로 읽을 수 있는 문장의 개수가 2개가 된다. 
    하지만 `c` 를 학습하면 최대로 읽을 수 있는 문장의 개수는 4개가 된다. 
    
    방법은 알파벳 배열을 생성하고 탐색하는 것이였다. 굉장히 허무했다. 탐색의 기준을 작성하냐 못하냐에 따라 갈린다는 것을 알게 됐다. 
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Gold/1062.%E2%80%85%EA%B0%80%EB%A5%B4%EC%B9%A8)
    
- [2580. 스도쿠](https://www.acmicpc.net/problem/2580)
    
    스도쿠는 잘 알려졌기 때문에 검증 조건에 대해 생각하는 것은 어렵지 않았다. 
    분명 어렵지 않았는데 어려웠다. 가로와 세로를 체크하는 메소드는 단순하지만, 3x3은 어떻게 검사를 해야할지 감이 잡히지 않았다. 
    
```java
int start = (x / 3) * 3;
int end = (y / 3) * 3;
```
    
    대단하다.. 이렇게 얻은 좌표는 3x3 블럭의 시작 좌표이다. 그리고 탐색을 하면 된다. 
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Gold/1062.%E2%80%85%EA%B0%80%EB%A5%B4%EC%B9%A8)
    
- [9663. N-Queen](https://www.acmicpc.net/problem/9663)
    
    유명한 문제이다다다. 스도쿠와 비슷하게 한가지 검증 코드를 작성하지 못했다. 
    대각선 판별이다. 처음에는 1차원 boolean 배열을 사용해서 같은 열에 놓여 있는지 확인 했는데, 대각선을 생각하니 해당 방법으로는 검증할 방법이 없다고 생각했다. 
    
```java
Math.abs(cols[i] - cols[row]) == row - i
```
    
    boolean 배열을 int 배열로 변경 후, 열에 몇 번재 행의 체스를 뒀는지 저장한다. 그리고 `행의 차와 열의 차가 같음` 이면 같은 대각선에 존재한다고 한다. 
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Gold/9663.%E2%80%85N%EF%BC%8DQueen)
    
- [2661. 좋은 수열](https://www.acmicpc.net/problem/2661)
    
    숫자가 다 만들어지면 검사 크기를 늘려가면서 절반으로 나눴을 때 똑같은지 검사했다. 하지만 메모리 초과가 발생..
    
```java
for (int i = 1; i <= str.length() / 2; i++) {
     String left = str.substring(str.length() - i);
     String right = str.substring(str.length() - 2 * i, str.length() - i);
      if (left.equals(right)) return false;
}
```
    
    해당 코드를 처음 봤을 때는 읽기 어렵게 생겼다고 느껴졌다. 메커니즘은 간단하지만, 내가 생각한 방식의 반대 방향이였다. 
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Gold/2661.%E2%80%85%EC%A2%8B%EC%9D%80%EC%88%98%EC%97%B4)
    

## 마무리

![](/assets/images/velog/f58de724-b0cc-486b-aa65-4b49c754a1f9-image.png)

3문제가 남아있다.. 마무리 하는 시점에 못 풀어본 문제들을 모아서 푸는 것도 나쁘지 않는 것 같다. 
처음에는 검증 코드 작성하는 방법을 습득하면서 문제를 풀어나갔지만, 이후에는 검증 코드를 작성하는 구현력이 부족해서 어려움을 느꼈다. ~~구현력이라 쓰고 생각하는 능력이라 읽는다.~~
다음 챕터는 수학이다. 수학도 쉽지 않은 여정이 될 것 같다.