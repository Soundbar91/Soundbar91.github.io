---
title: "Git Merge Policy"
date: 2024-09-18T05:18:02Z
categories:
  - Git
excerpt: "깃 머지 정책이 머지"
---
## Merge Commit

-   가장 기본적인 병합 방법이다.
-   `git merge` 명령어를 통해 병합을 진행한다.
-   커밋이 발생한 시간 순서대로 병합이 된다.
-   장점
    -   병합된 브랜치가 삭제되도, 히스토리는 남아있기 때문에 어떤 브랜치에서 병합이 됐는지 확인할 수 있다.
-   단점
    -   브랜치가 여러 개로 나눠진 경우 히스토리 그래프의 가독성이 떨어진다.
    -   또한, 병합된 브랜치의 커밋이 모두 반영되기 때문에 커밋 기록 또한 가독성이 떨어진다.![](/assets/images/velog/ZwkdKSHkZW617fYXmaZlAk-img.png)

![](/assets/images/velog/6XwhIqBEULHyUMNK0zi5j0-img.png)

    -   메인 브랜치의 커밋 기록을 보면, A와 B 브랜치의 커밋 기록이 시간 순서대로 들어갔음을 확인할 수 있다.

## Squash and Merge

-   여러 개의 커밋을 하나의 커밋으로 합친 후 병합한다.
-   `git merge --squash` 명령어를 통해 병합을 진행한다.
-   장점
    -   병합한 브랜치의 커밋이 하나로 합쳐지기 때문에, 히스토리 혹은 그래프의 가독성이 좋아진다.
-   단점
    -   커밋이 하나로 합쳐지기 때문에, 변경된 사항들에 대해 자세한 정보를 알기 어렵다.
    -   커밋 메시지에 별도로 남기지 않는 이상, 어떤 브랜치에서 병합이 됐는지 알기 어렵다.

![](/assets/images/velog/6e855120-44a1-42b5-a909-b7093c33f120-image.png)

![](/assets/images/velog/df0ed776-cb55-492c-9061-0c84f31d4098-image.png)

-   브랜치 삭제 오류
    -   Squash and Merge를 진행하고 브랜치를 삭제할려고 하니 다음과 같은 메시지가 나왔다.
    -   메시지의 내용은 `A 브랜치가 완전히 병합되지 않았다`이다.
    -   git graph를 보면, A 브랜치와 B 브랜치가 main 브랜치에 연결되지 않고, 독립적인 상태임을 확인할 수 있다.
    -   Squash and Merge에서만 발생한 건지 확인하기 위해 Commit merge를 진행하고 브랜치를 삭제해봤다.![](/assets/images/velog/vqNJSKjKUfup9Temr5mKH1-img.png)

![](/assets/images/velog/3ocnVG4awErCFaloyHULm0-img.png)

    -   정상적으로 브랜치가 삭제됨을 확인할 수 있었다.
    -   Squash and Merge 이후 병합없이 브랜치를 삭제하고 싶다면, `git branch -D 브랜치명` 명령어를 사용하면 된다.

![](/assets/images/velog/MXdXYeYQa7dJeDbf2G2IEk-img.png)

![](/assets/images/velog/M0PuXlRf5zkIyPPVMlPwZK-img.png)

## Rebase and Merge

-   Rebase : 브랜치의 base(공통 조상, 기반)를 옮긴다
-   마지막으로 병합되는 브랜치의 커밋을 뒤에 붙인다.
    -   git checkout “병합할 브랜치 이름”
    -   git rebase main
        -   병합할 브랜치의 커밋들이 main 브랜치에서 시작된 것 처럼 정렬된다.![](/assets/images/velog/fCGz4yLTL1UqZVG2tlKSw0-img.png)

![](/assets/images/velog/KoOySWT1uliKleWGMi3l61-img.png)

        -   단, main 브랜치의 로그를 보면 아직 C 브랜치의 커밋이 없다.

![](/assets/images/velog/mXjIVjgUIxPlcKuqWdl6Qk-img.png)

    -   git checkout main
    -   git merge “병합할 브랜치 이름”
        -   정상적으로 C 브랜치가 main 브랜치에 병합됨을 확인할 수 있다.

![](/assets/images/velog/rKAkUunJRrsIGbRRYbENvk-img.png)

-   장점
    -   히스토리 그래프를 단순하게 한 줄로 만들어준다.
    -   히스토리 그래프를 단순하게 만들면서, 병합되는 브랜치의 커밋 기록까지 반영이 되기 때문에 변경 사항을 알 수 있다.
-   단점
    -   어떤 브랜치에서 어느 시점에 병합이 진행됐는 지 알 수 없다.
    -   rebase 과정에서 브랜치의 커밋 하나하나 충돌을 해결하기 때문에, 커밋이 많은 상태에서 충돌이 발생할 경우 충돌을 해결할 양이 많아 진다고 한다.