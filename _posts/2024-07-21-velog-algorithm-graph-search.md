---
title: "알고리즘 - 그래프 탐색"
date: 2024-07-21T02:45:33Z
categories:
  - Algorithm
excerpt: "상? 하? 좌? 우? 대각선까지"
---
## 서론

이번 주는 [BFS와 DFS 문제](https://github.com/tony9402/baekjoon/tree/main/algorithms/graph_traversal)를 다뤄봤다. 그래프 문제의 경우 태그 분포에서 레이팅이 제일 높기도 하고 다른 알고리즘에 비해 수월하게 풀리는 감이 있다. 하지만 이번주는 그렇게 많은 시간을 투자하지 못했다. 시작된 회고 프로젝트와 삼성 DX 알고리즘 문제를 푸는데 더 시간을 할애했다. 그래도 시간이 나는대로 문제를 풀었고, 총 20문제를 접했다. 

## 본론

- [13549. 숨바꼭질 3](https://www.acmicpc.net/problem/13549)
 
    우선순위 큐와 BFS를 사용해서 푸는 간단한 문제이지만, 초기 배열 선언에서 놓치고 간 부분이 있었다. 동생의 위치만큼 배열을 선언했는데, 수빈이의 초기 위치가 동생보다 멀리 있을 수도 있다어 계속 틀렸다. 범위를 잘 보자.
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/blob/main/%EB%B0%B1%EC%A4%80/Gold/13549.%E2%80%85%EC%88%A8%EB%B0%94%EA%BC%AD%EC%A7%88%E2%80%853/%EC%88%A8%EB%B0%94%EA%BC%AD%EC%A7%88%E2%80%853.java)
    
- [17836. 공주님을 구해라!](https://www.acmicpc.net/problem/17836)
    
    처음에는 클래스로 관리를 해서 그람을 먹고 이동하는 지 아닌지를 구분했다. 이것도 지금 보면 괜찮아 보이는 접근 방식이지만, 그람을 먹게 되면 도착지까지 얼마나 걸리는지 바로 계산이 가능하기 때문에 비효율적이다. 또한, 고려해야할 사항이 몇 가지 있었다. 
    
    1. 그람을 먹는 것이 무조건 최소는 아니다. 
    2. 그람을 먹고 가는 동안 시간이 다 지날 수 있다. 
     
  이 두 가지를 놓쳐서 시간을 많이 소모했다. 최소가 되는 조건과 각각의 케이스를 잘 고려해야겠다. 
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Gold/17836.%E2%80%85%EA%B3%B5%EC%A3%BC%EB%8B%98%EC%9D%84%E2%80%85%EA%B5%AC%ED%95%B4%EB%9D%BC%EF%BC%81)
    
- [2668. 숫자고르기](https://www.acmicpc.net/problem/2668)
    
    DFS를 많이 안 사용하다가 데여버린 문제였다. DFS로 사이클이 존재하는지만 판별하고, 존재하면 값을 추가하면 된다. 
    
    ```java
    public static void solve(int cur, int end) {
        if (!visited[nums[cur]]) {
            visited[nums[cur]] = true;
            solve(nums[cur], end);
            visited[nums[cur]] = false;
        }
        if (nums[cur] == end) list.add(end);
    }
    ```
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Gold/2668.%E2%80%85%EC%88%AB%EC%9E%90%EA%B3%A0%EB%A5%B4%EA%B8%B0)
    
- [18513. 샘터](https://www.acmicpc.net/problem/18513)
    
    샘터의 좌표를 미리 저장을 하고, 샘터 좌우로 꼬리에 꼬리를 물면서 집을 설치하면 된다. 접근은 잘 했지만, 뭔가 확신이 안 들었다. 자신감을 가지자
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Gold/18513.%E2%80%85%EC%83%98%ED%84%B0)
    
- [16973. 직사각형 탈출](https://www.acmicpc.net/problem/16973)
    
    왼쪽 상단의 꼭짓점과 오른쪽 하단의 꼭짓점을 기준으로 반복문을 돌려서 범위 내에 벽이 있는지 검사했다. 
    
    ```java
    public static boolean check(int Sx, int Sy, int Ex, int Ey) {
        for (int i = Sx; i <= Ex; i++)
            if (map[i][Sy] == 1) return false;
        for (int i = Sy; i <= Ey; i++)
            if (map[Sx][i] == 1) return false;
        for (int i = Ex; i >= Sx; i--)
            if (map[i][Ey] == 1) return false;
        for (int i = Ey; i >= Sy; i--)
            if (map[Ex][i] == 1) return false;
        return true;
    }
    ```
    
    이렇게 해도 풀리긴 했는데, 찾아보니 벽의 좌표를 리스트에 저장하고 움직인 직사각형 범위에 벽이 있는지 확인하는 방법도 있었다. 
    
    ```java
    public static boolean check(int x, int y) {
        for (int[] coordinate: coordinates) {
            if (coordinate[0] >= x && coordinate[0] <= x + H - 1 &&
                coordinate[1] >= y && coordinate[1] <= y + W - 1)
                return false;
        }
    
        return true;
    }
    ```
    
    ![](/assets/images/velog/0cfdde5c-cacc-4f03-a365-eeca501c0421-image.png)
    
    확실히 성능이 향상됨을 확인할 수 있었다. 
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Gold/16973.%E2%80%85%EC%A7%81%EC%82%AC%EA%B0%81%ED%98%95%E2%80%85%ED%83%88%EC%B6%9C)
    
- [16234. 인구 이동](https://www.acmicpc.net/problem/16234)
    
    2차원 배열을 선언해서 국가가 어느 연합에 들어가는지 저장했다. 연합에 해당하는 국가들의 인구를 다 합치고, 반복문으로 순회를 해서 인구 이동하는 방식으로 구현했다. 
    
    ```java
    public static void movePeople() {
        List < List < int[] >> unionLists = new ArrayList < > ();
        for (int i = 0; i < index; i++) unionLists.add(new ArrayList < > ());
    
        int[] total = new int[index];
        for (int i = 1; i < index; i++) {
            int sum = 0;
    
            for (int j = 0; j < N; j++) {
                for (int k = 0; k < N; k++) {
                    if (union[j][k] == i) {
                        unionLists.get(i).add(new int[] {
                            j,
                            k
                        });
                        sum += map[j][k];
                    }
                }
            }
            total[i] = sum / unionLists.get(i).size();
        }
    
        for (int i = 1; i < index; i++) {
            List < int[] > unionList = unionLists.get(i);
    
            for (int[] union: unionList) {
                int x = union[0];
                int y = union[1];
    
                map[x][y] = total[i];
            }
        }
    }
    
    ```
    
    정답이 됐긴 했지만, 더 찾아보니 별도로 연합 배열을 관리할 필요가 없었다. 한 번 탐색할 때 인구 이동도 같이 진행해주면 됐다. 
    
    ```java
    public static int solve() {
        int day = 0;
        while (true) {
            visited = new boolean[N][N];
            boolean move = false;
    
            for (int i = 0; i < N; i++) {
                for (int j = 0; j < N; j++) {
                    if (!visited[i][j]) {
                        int sum = bfs(i, j);
                        if (list.size() > 1) {
                            move = true;
                            movePeople(sum);
                        }
                    }
                }
            }
    
            if (!move) return day;
            day++;
        }
    }
    ```
    
    [문제 풀이 코드](https://github.com/Soundbar91/algorithmStudy/tree/main/%EB%B0%B1%EC%A4%80/Gold/16234.%E2%80%85%EC%9D%B8%EA%B5%AC%E2%80%85%EC%9D%B4%EB%8F%99)
    

## 마무리

BFS와 DFS는 익숙하지만, 여기에 구현이 붙은 문제를 많이 접해야겠다는 생각이 들었다. 구현이 붙어버리면 조금은 까다롭게 느낀다고 이번 기회에 알게 됐다. 또한, 최적화 연습도 많이 해야겠다는 생각이 들었다. 내가 제출한 코드가 정답이 되면 다른 사람의 코드와 비교해서 최적화할 부분이 있는지 찾아보는 형식으로 진행했다. 이제는 내가 직접 최적화 할 부분이 있는지 찾아서 진행하는 연습을 하자. 
이번주 금요일에 [삼성 DX 하계 알고리즘 특강](https://samsungalgorithm.com/) 합격 메일이 왔다. 내일부터 교육을 수강하게 된다. 프로젝트에 특강까지 진행을 하다보니, 백준을 푸는 시간이 이전보다 많이 할애하기는 힘들 것 같다. 그래도 시간이 난다면 풀 생각이고, 알고리즘 블로깅은 조금 어렵겠다는 생각이 들었다. 4주 동안 열심히 수강을 하자.