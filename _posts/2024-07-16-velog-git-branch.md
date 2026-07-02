---
title: "Git Branch"
date: 2024-07-16T08:12:30Z
categories:
  - Git
excerpt: "목둔, 브랜치 만들기"
---
## 서론
프로젝트를 본격적으로 시작하기 전, 브랜치를 만들고 합병하는 연습을 해봤다. 프로젝트 진행하는 과정에서는 개발 이외의 부가적인 요소에 시간을 덜 소모하고 싶기 때문에, 미리할 수 있는 건 연습해보고 들어가는게 맞다고 생각했다. 

## 본론
프로젝트에서 선택한 git workflow은 `Gitlab flow` 이다. 그렇기 때문에 `main` 브랜치에서 `develop` 브랜치와 `develop` 브랜치에서 `featrue` 브랜치를 만드는하는 연습을 진행했고, 역순으로 합병하는 연습을 진행했다. 

### 분기

브랜치를 만드는 명령어는 다음과 같다. 

```
git branch <생성할 브랜치 이름> <분기점이 되는 브랜치 이름>
git checkout -b <생성할 브랜치 이름>
```

- `git branch`은 브랜치 생성만 한다.
    - <분기점이 되는 브랜치 이름>을 생략하면 현재 위치하고 있는 브랜치에서 브랜치가 생성된다.
- `git checkout -b`은 브랜치 생성과 동시에 해당 브랜치로 이동한다.

![](/assets/images/velog/ce5e8f94-0d9e-47a6-bdbb-096d68ac12ae-image.png)

- checkout 명령어가 생성과 이동을 동시에 수행해주기 때문에 편하다 !

`develop` 브랜치의 경우 원격 저장소에서 관리되고, `feature` 브랜치의 경우 개인 로컬에서 관리가 된다. 브랜치를 만들고 원격에 올리는 명령어는 다음과 같다. 

```
git push <원격 저장소> <올릴 브랜치 이름>
```

![](/assets/images/velog/def2578d-fa66-4a24-a448-c7e2ae80aad0-image.png)


- 원격 저장소는 origin, 올릴 브랜치 이름은 feature/test로 설정했다.
- 해당 명령어를 수행하고 깃허브에 접속하면 정상적으로 브랜치가 올라갔음을 확인할 수 있다.

</br>
깃허브에서 브랜치를 만드는 방법도 있다. 

![](/assets/images/velog/c1a155b7-1c08-4945-b195-d7a79a0fe264-image.png)

- `View all branches` 으로 들어간다.

![](/assets/images/velog/277c6f46-6b04-4fa2-96b6-60262c4939b0-image.png)

- 우측 상단에 `New branch` 버튼을 누른다.

![](/assets/images/velog/e542d130-63ea-4a8c-b58c-310bbc0f45fa-image.png)


- 그럼 다음과 같은 창이 나온다.
    - New branch name : 생성할 브랜치 이름을 입력한다.
    - Sourece : 나올 브랜치를 선택한다.
- 설정이 끝나면 `Create new branch` 를 누른다.
- 그럼, 원격 저장소에 `feature/1` 이 생성됐음을 확인할 수 있다.

### 합병

`feature` 에서 `develop` 로 합병하기 전, 문제가 없는지 확인을 해야한다. 아무 브랜치나 막 합병을 하게 되면 문제가 발생하기 때문이다. 그래서 사용하는 것이 `PR` 이다. PR를 통해 합병하기 전 문제가 없는지 팀원들과 같이 체크하고 브랜치를 보호할 수 있다. 
 `feature/test` 에서 `develop` 로 PR를 만드는 방법은 다음과 같다. 
 
![](/assets/images/velog/9b9c79f8-c324-407f-9edd-79f27808d794-image.png)

- 좌측 아이콘 `Pull Request` 을 누르고,  `Create Pull Request...` 을 누른다.

![](/assets/images/velog/ad870f67-0d9e-4c8d-9672-d1ac35e394cc-image.png)

- PR 출발지와 목적지를 설정하고, 제목과 설명을 작성한다.
- 이후 하단에 있는 `Create Pull Request` 를 누른다.

![](/assets/images/velog/ab3d87ee-9ad3-48bf-9385-c7ff58423c8c-image.png)

- 그럼 다음과 같은 창이 나온다.
- 이는 feature/test 브랜치가 로컬에만 있고 원격 저장소에는 없기 때문에 나온다.
- 원격 저장소에 올리기 위한 이름을 입력하는 것인데, 그대로 `OK` 버튼을 누른다.
- 이후, 깃허브에 들어간다.

![](/assets/images/velog/7cded192-572c-40dc-b30d-ec4dc7749728-image.png)

- 다음과 같이 PR이 생겼음을 확인할 수 있다.

![](/assets/images/velog/26417db0-36f1-4a6a-97ff-feba7776211e-image.png)

- 현재는 별도로 작성한 내용이 없기 때문에 다음과 같이 간단하게 나오는 것 같다.
- 합병하기 위해서 `Merge pull request` 를 누르고, `Confirm merge` 를 누른다.

![](/assets/images/velog/11f03937-1867-4e83-a04a-98172fdcc31d-image.png)

- 합병이 완료가 되면 다음과 같이 `Merged` 상태로 변하게 되고, PR은 닫힌다.
- feature 브랜치는 원격 저장소에서 무조건 관리할 필요가 없기 때문에, 삭제할 수요가 있다면 `Delete branch` 버튼을 눌러서 원격 저장소에서 feature 브랜치를 삭제한다.
    - 로컬에 있는 feature 브랜치는 삭제가 안된다.
    - 로컬에 있는 브랜치를 삭제하기 위해서는 다음 명령어를 사용한다.

```
git branch -d <삭제할 브랜치 이름>
```
    
    - 삭제하기 위해서는 현재 위치하고 있는 브랜치가 삭제할 브랜치가 아닌 다른 브랜치이어야 한다.
    - 원격에 있는 브랜치를 삭제하는 명령어는 다음과 같다.

```
git push origin --delete <삭제할 브랜치 이름>
```
    

## 마무리

![](/assets/images/velog/01b0c901-a978-45a7-8369-94a0ce6907bf-image.png)

처음으로 브랜치를 생성, 이동, 합병 그리고 삭제까지 해보는 시간을 가졌다. 브랜치라는 영역이 어렵다고 생각하고 있었는데, 할 만하다는 생각이 들었다. 안해보고 어렵다고 생각하는 습관을 고쳐야 겠다. 

합병이라고 쓰고 PR을 다룬 것 같다.  합병 과정에서 생기는 충돌을 해결하는 과정도 아마 프로젝트 진행 과정에서 생길 것이라고 생각된다. 충돌 관련 내용도 남겨야겠다. 

기초적인 부분만 다뤘기도 했고 혼자 프로젝트를 진행하면서 사용하는 기능만 연습했기 때문에 실제로는 더 많은 것들이 있을 거 같다. 협업을 하는 기회가 생긴다면 학습한 내용을 잘 사용하고, 새롭게 배우는 내용이 있다면 그때 추가해야겠다. 