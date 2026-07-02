---
title: "Flask"
date: 2024-07-31T15:21:38Z
categories:
  - Web
excerpt: "Java 개발자의 Python 여행기"
---
## 서론
채점 서버에서는 메인 서버에서 받은 코드를 채점하고, 채점 결과를 반환해야한다. 현재 채점 서버는 python를 사용해서 구현했다. python를 사용한 이유는 다른 언어를 사용해서 개발을 해보고 싶다는 생각이 들었고, 그 언어의 프레임워크는 어떤 느낌인지 알고 싶은 호기심에 초심자들이 많이 사용하는 python를 선택했다. 

## 본론

### Flask

파이썬 진영에서 사용하는 웹 프레임 워크이다. `마이크로` 라는 원칙을 따르며, 특정 도구나 라이브러리를 가용하지 않는다고 한다. 실제로 사용할때 별도의 설정없이 프레임워크만 설치하고 코드만 작성했는데, api 요청을 받고 응답을 하는 등 사용하기 편했다. 또한, 파이썬 특성상 코드를 작성하는데 제약(?)이 다른 언어에 비해 적기 때문에 언어의 특성을 잘 살린 프레임 워크라는 생각이 들었다. 

Flask를 설치하기 위해서는 `pip` 명령어를 사용해야 한다.  

> PIP
> 
> 
> 파이썬 오픈소스 패키지들이 저장된 저장소를 관리해주는 툴이라고 보면 될 것 같다. 
> 

```
pip install flask
```

vscode의 터미널에서 해당 명령어를 입력하면 flask 패키지가 설치된다. 그 전에, 가상 환경을 설정해보자. 

### 가상 환경

여러 패키지를 사용하다 보면 패키지 버전이나 의존성 충돌이 발생할 수 있다. 이를 해결하기 위해 파이썬에서는 패키지를 독립적으로 관리하는 방법 `virtualenv` 를 사용한다고 한다. 

파이썬의 경우 패키지를 설치하면 모든 프로젝트에서 사용할 수 있는 것 같다. 이렇게 되면 원하지 않는 패키지의 영향을 받아 프로그램 실행에 방해가 될 수 있다. 이를 막기 위해, 각 프로젝트에 가상 환경을 설정하고 해당 환경에서 설치된 패키지는 해당 프로젝트에만 적용이 되는 느낌으로 이해했다. 자바 스프링 부트의 `build.gradle` 와 유사한 느낌이다. 

![Untitled](/assets/images/velog/d58b60d7-c466-4fa5-9d03-9d5a5a64088f-image.png)

![](/assets/images/velog/50d11546-e3fb-430c-8e10-16da122222e5-image.png)

터미널을 열고 프로젝트의 디렉토리로 이동 후, 가상 환경을 생성해주는 명령어를 입력한다. 그럼 프로젝트에 다음과 같은 파일들이 생성됨을 확인할 수 있다. 

가상환경을 프로젝트에 적용시키기 위해서는 스크립트를 실행해야 한다고 한다. 스크립트를 실행시키기 위한 명령어이다. 

![](/assets/images/velog/76848adf-760b-4cc0-a001-ed08ff217e16-image.png)

명령어를 입력하면 경로 뒤에 `(env)` 이 붙음을 확인할 수 있고, `code .` 명령어를 사용해서 vscode를 실행한다. 명령어를 입력하면 자동으로 실행된다. 

![](/assets/images/velog/bf82c1e1-5afa-44e6-a90f-62ad45b7b9e6-image.png)


vscode에 들어오면, 탐색기에 파일을 확인할 수 있고 터미널을 열어서 가상환경에 들어왔는지 확인한다. (env)가 붙어 있으면 설정이 잘 된 것이다. 

![](/assets/images/velog/19c03bf0-dc93-4f28-bc0d-18b95d388db4-image.png)

![](/assets/images/velog/ad5e9c49-1601-477c-b071-4041a2d73dbe-image.png)

![](/assets/images/velog/ff26ca9c-533c-4c6d-b832-cd0900687ea7-image.png)

### 설치

가상환경에 들어온 프로젝트의 터미널에서 pip 명령어를 이용해서 Flask 패키지를 설치한다. 

![](/assets/images/velog/102b76fb-af10-445c-9d27-b7a4dcb77146-image.png)

![](/assets/images/velog/c90af8c2-3469-4914-a70c-31bde36a7e42-image.png)

설치가 완료되니, pip를 업데이트 하라는 문구가 나와서 진행해줬다. 

### 테스트

```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello, World!'
```

`app.py` 파일을 생성하고 다음과 같은 코드를 작성한다. 처음 접해본 문법은 다음과 같다. 

- app = Flask(name) : Flask 클래스의 인스턴스를 생성한다. name에는 현재 파일의 이름이 들어간다. 이를 통해 애플리케이션의 경로를 설정한다고 한다.
- @app.route(’/’) : 스프링부트의 @RequestMapping의 느낌이다.

작성이 완료되면 명령어를 이용해서 flaks를 실행한다. 

![](/assets/images/velog/780c32b4-e413-4e0e-b54a-c3c98198800e-image.png)

톰켓은 8080포트를 사용하는 것과 달리, flask은 5000포트를 사용한다. 해당 경로로 들어가면, 다음과 같은 화면이 나온다. 

![](/assets/images/velog/8496ddd3-5589-4901-89e5-14a3ea08c585-image.png)

스프링의 GetMapping, PostMappig와 같이 flask에서도 설정할 수 있다. 

```python
@app.route('/judge', methods=['POST'])
```

### 요청 받기

메인 서버의 요청을 받기 위해서는 flask 패키지에서 request를 import해야 한다. 

```python
from flask import Flask, request

@app.route('/judge', methods=['POST'])
def judge():
    data = request.json
    source_code = data['source_code']
    language = data['language']
    test_cases = data['test_cases']
    memory_limit = data['memory_limit']
    time_limit = data['time_limit']
```

`request` 객체에서 [요청 메시지에 대한 접근](https://passwd.tistory.com/entry/Flask-%EC%9A%94%EC%B2%ADRequest-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EC%A0%91%EA%B7%BC)을 할 수 있다. 여기서 요청 메시지에서 접근해야할 내용은 바디에 있는 json 데이터이다. `request.json` 를 통해 바로 데이터를 가져올 수 있다. 

가져온 json에서 값을 추출하기 위해서는 `["key 값"]` 으로 가져오면 된다. 

### 응답 보내기

```python
return {'status': 'COMPILER_ERROR', 'memory': 0, 'runtime': 0, 'codeLen': code_len, 'error_message': e.stderr}
```

~~신선한 충격이였다. 응답 메시지가 이렇게 간단하게 보낼 수 있는거였나..~~

`jsonify` 를 사용해서 Json 응답을 만들 수 있다고 하나, 기본적으로 Flask에서는 딕셔너리(파이썬의 맵이라 보면 될 거 같다)를 [Json으로 변환](https://velog.io/@mingming_eee/Flask-day2#1-jsonify%EB%9E%80)한다고 한다. 

## 마무리
python은 무거운 언어라는 인식이 있어, 백엔드로 사용이 가능한지 궁금했다. 이번 기회에 Flask 프레임워크를 사용해보면서 이런 궁금증이 해결됐다. python의 문법 특징을 잘 살린 프레임워크임을 알게 됐고, 기회가 된다면 더 심도있게 학습해보고 싶다. 

## 참고 문헌

[[Python Flask] 플라스크란?](https://easyitwanner.tistory.com/347)
[[웹 앱프로그래밍] 파이썬(python for windows) 설치 후 vs code 개발 환경 구축](https://wings2pc.tistory.com/entry/웹-앱프로그래밍-파이썬python-for-windows-설치-후-vs-code-개발-환경-구축)
[[웹 앱프로그래밍] 독립된 파이썬(python) 가상환경(venv)](https://wings2pc.tistory.com/entry/웹-앱프로그래밍-독립된-파이썬python-가상환경venv)
[[웹 앱프로그래밍] 파이썬 플라스크(Python Flask) 설치 및 웹 애플리케이션(Web Application) 시작](https://wings2pc.tistory.com/entry/웹-앱프로그래밍-파이썬-플라스크Python-Flask-설치-및-웹-애플리케이션Web-Application-시작)
[[Flask] 요청(Request) 데이터 접근](https://passwd.tistory.com/entry/Flask-요청Request-데이터-접근)
[[Flask] 2일차. Flask REST API](https://velog.io/@mingming_eee/Flask-day2#1-jsonify란)

