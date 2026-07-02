---
title: "알고리즘 - 이분 탐색"
date: 2025-10-03T03:04:52Z
categories:
  - Algorithm
excerpt: "Up And Down"
---
## 서론

오랜만에 알고리즘 게시글을 작성한다. 알고리즘을 안 푼지 거의 1년이 다 된거 같은데, 풀려고 하니까 머리가 어지러웠다. 포토폴리오도 중요하지만, 코딩테스트의 중요성도 무시할 수 없다고 최근에 느껴서 다시 문제를 풀기 시작했다. 

카카오 공채가 나오면서, 동아리 멘토님께서 알고리즘 스터디를 주도하셨다. 알고리즘 주제와 문제를 던져주고 푸는 형식이였다. 그 첫번째 주제가 이분탐색이였다. 동아리 멘토님이 뽑아주신 문제와 바킹독 알고리즘 문제집을 같이 풀었다. 

이전에는 이분탐색은 그냥 숫자 찾기로 인식하고 있었다. 하지만, [삼성 알고리즘 캠프](https://velog.io/@soundbar91/%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90-DX-%ED%95%98%EA%B3%84-%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98-%ED%8A%B9%EA%B0%95-%ED%9A%8C%EA%B3%A0)와 이번 문제들을 다뤄보면서 선형시간복잡도를 로그시간복잡도로 줄이는 데 많은 도움을 주는 알고리즘이라고 느꼈다.  

## 본론

### [1920. 수 찾기](https://www.acmicpc.net/problem/1920)

이분 탐색을 적용해볼 수 있는 기초문제이다. 선형탐색을 할 경우 O(N x M)으로, 최악의 경우 O(100,000 x 100,000)이기 때문에 시간 초과가 발생한다. 정렬 O(NlogN) + 이분탐색 O(MlogN) → O(NlogN) + O(MlogN)이기 때문에 시간 내에 통과할 수 있다.

> [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Silver/1920.%E2%80%85%EC%88%98%E2%80%85%EC%B0%BE%EA%B8%B0)
> 

### [10816. 숫자 카드 2](https://www.acmicpc.net/problem/10816)

LowerBound의 경우 찾고자하는 값이 최초로 나오는 위치, UpperBound의 경우 찾고자하는 값 초과가 되는 최초 위치이다. 문제에서 요구하는 정답은 특정 숫자의 개수이기 때문에 UpperBound - LowerBound를 하게 되면 해당 숫자의 개수가 나오게 된다. 

이 문제 또한 선형탐색을 할 경우 O(M * N) = O(500,000 x 500,000)이기 때문에 시간초과가 발생한다.

정렬 O(NlogN) + 이분 탐색 O(M * (logN + logN)) = O(NlogN + MlogN)이기 때문에 시간내에 통과할 수 있다. 

> [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Silver/10816.%E2%80%85%EC%88%AB%EC%9E%90%E2%80%85%EC%B9%B4%EB%93%9C%E2%80%852)
> 

### [18870. 좌표 압축](https://www.acmicpc.net/problem/18870)

특정 좌표보다 낮은 값을 가지고 있는 좌표의 개수를 출력하는 문제이다. 숫자를 입력받고, 중복된 숫자를 지워준다. 중복 숫자를 지우지 않는 경우, 답이 틀리게 된다. 가령 다음과 같은 케이스를 보자

```bash
input : [1, 3, 10, 10, 20]
expect : [0, 1, 2, 2, 3]
result : [0, 1, 2, 2, 4]
```

20의 경우 문제에서 요구하는 답이 3이 나와야하지만, 중복을 지우지 않아 20보다 작은 수가 4개가 존재하고 이로 인해 4가 나오게 된다. 그러므로, 중복 숫자를 지워야 한다. 

```java
// nums : 중복 숫자를 지운 리스트, tmp : 최초 input으로 들어오는 숫자 배열(정렬)
for (int i = 0; i < N; i++) {
    if (i == 0 || nums.get(nums.size() - 1) != tmp[i]) {
        nums.add(tmp[i]);
    }   
}
```

선형탐색을 할 경우 O(N x (N - 1)) = O(N^2)이기 때문에 시간 초과가 발생한다. 

각 좌표에 대해서 LowerBound를 돌려주면 된다. 정렬 O(NlogN) + 중복삭제 O(N) + 이분 탐색 O(NlogN) = O(NlogN)이기 때문에 시간내에 통과할 수 있다. 

> [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Silver/18870.%E2%80%85%EC%A2%8C%ED%91%9C%E2%80%85%EC%95%95%EC%B6%95)
> 

### [2995. 세 수의 합](https://www.acmicpc.net/problem/2295)

`nums[i] + nums[j] + nums[k] = nums[l]`를 만족하는 조합 중에서 가장큰 nums[l]를 만족하는 l를 구하는 문제이다. 4중 for문으로 돌리면 해결은 되지만, O(N x N x N x N)이기 때문에 시간초과가 발생한다. 생각한 알고리즘은 다음과 같다. 

```bash
1. 정렬된 배열에서 마지막 수 인덱스를 i로 둔다. → 첫번째로 큰 수
2. i번째 수 앞에 있는 수 인덱스를 j로 둔다. → 두번째로 큰 수
3. 맨 첫번째 수 인덱스를 k로 둔다. → 첫번째로 작은 수
4. 가장 큰 수에서 두번째로 큰수와 첫번째로 작은 수를 빼서 탐색해야 할 값을 계산한다.
5. 해당 값에 해당하는 인덱스를 이분탐색으로 찾는다.
6. i와 j는 감소, k는 증가시킨다.
-> nums[i] - (nums[j] + nums[k])를 만족하는 숫자를 찾는다. 
```

코드는 다음과 같다.

```java
public static int solve() {
    for (int i = N - 1; i >= 0; i--) {
        for (int j = i - 1; j >= 0; j--) {
            for (int k = 0; k <= j; k++) {
                int target = nums[i] - (nums[j] + nums[k]);
                if (target <= 0) {
                    continue;
                }
                if (binarySearch(k, j, target) != -1) {
                    return nums[i];
                }
            }
        }
    }

    return 0;
}
```

k를 맨 첫번째 수 인덱스로 둔 이유는, j번째 수 앞에 있는 수의 인덱스를 k로 두면 `if (target <= 0)` 에서 높은 확률로 true가 나올수 있기 때문에 불필요한 조건 검사가 들어가기 때문이다. 또한 숫자들이 정렬되어 있기 때문에 범위를 가장 작은수와 두번째로 작은수로 두면 이분탐색을 적절하게 활용할 수 있다고 생각했다. 

이 로직의 시간 복잡도는 정렬 O(NlogN) + 3중 반복분 + 이분탐색 O(N x N x N x logN) = O(NlogN + N^3logN)이기 때문에 시간 초과가 발생할 줄 알았는데, 통과가 됐다. 테스트 케이스가 약했던 건지, 조기 종료 조건에 덕을 본건지는 찾아봐야할 거 같다. 

다른 코드를 보니 nums[i] + nums[j] = nums[l] - nums[k]라는 수식으로 구현하는 방법을 알 수 있었다. 

> [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Gold/2295.%E2%80%85%EC%84%B8%E2%80%85%EC%88%98%EC%9D%98%E2%80%85%ED%95%A9)
> 

### [1654. 랜선 자르기](https://www.acmicpc.net/problem/1654)

매개변수 탐색(파라메트릭 서치)를 적용하는 문제이다. 여기서는 길이를 X로 짤랐을 때, N개의 랜선이 나오는지를 판별하면 된다. 입력으로 들어온 수 중에서 가장 큰 숫자를 right, 최소 1부터 입력이 들어오기 때문에 left를 1로 설정한다. 길이가 클 수록 랜선의 개수가 적어지고, 길이가 작을 수록 랜선의 개수가 커짐을 이용해서 구현한다. 

> [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Silver/1654.%E2%80%85%EB%9E%9C%EC%84%A0%E2%80%85%EC%9E%90%EB%A5%B4%EA%B8%B0)
> 

### [2417. 정수 제곱근](https://www.acmicpc.net/problem/2417)

값이 q일 때 `q^2 ≥ n` 인지를 확인하면 된다. 여기서 `Math.pow(mid, 2)` 와 `mid * mid` 두 가지 방법을 사용하게 되는데, 전자는 반환형이 double이기 때문에 오버플로우가 나지 않지만, 후자의 경우 `long * long` 가 long보다 큰 범위의 수가 나올 수 있기 때문에 문제가 발생한다. 

> [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Silver/2417.%E2%80%85%EC%A0%95%EC%88%98%E2%80%85%EC%A0%9C%EA%B3%B1%EA%B7%BC)
> 

### [2512. 예산](https://www.acmicpc.net/problem/2512)

모든 요청에 대해 배정할 수 있는 최대 상한액 N를 찾는 문제이다. 파라메트릭 서치를 적용하는 위 두문제 보다 쉽게 해결할 수 있었던 거 같다. 여기도 금액이 최소 1부터 들어오기 때문에 left를 1, 입력으로 들어온 국가 예산을 right으로 잡으면 된다. 

> [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Silver/2512.%E2%80%85%EC%98%88%EC%82%B0)
> 

### [16401. 과자 나눠주기](https://www.acmicpc.net/problem/16401)

모든 아이들에게 나눠줄 수 있는 최대 길이 X를 찾는 문제이다. 랜선 자르기 문제와 유사하다. 

> [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Silver/16401.%E2%80%85%EA%B3%BC%EC%9E%90%E2%80%85%EB%82%98%EB%88%A0%EC%A3%BC%EA%B8%B0)
> 

## 결론

이분 탐색 문제를 풀면서 어려웠던 점은 조건 설정이였다. `left <= right` , `left < right` , 정답은 left인가 right인가 등 헷갈렸다. 어려움을 겪던 과정에서 잘 정리해주신 [글](https://www.acmicpc.net/blog/view/109)을 찾았다. 한 3번 정도 읽은 거 같은데, 아직까지 이해가 잘 안된다. 해당 내용을 계속 읽으면서 이해한 내용을 한 번 블로깅해봐야겠다. 

다음 챕터는 그래프이지만, 이전에 [블로깅](https://velog.io/@soundbar91/%EC%95%8C%EA%B3%A0%EB%A6%AC%EC%A6%98-%EA%B7%B8%EB%9E%98%ED%94%84-%ED%83%90%EC%83%89)을 했었고 그래프는 그나마 괜찮게 다뤄서 문제를 풀고 따로 블로깅은 하지 않을 생각이다. 파라메트릭 서치나 이분 탐색을 활용하는 문제들도 더 풀어봐야겠다.