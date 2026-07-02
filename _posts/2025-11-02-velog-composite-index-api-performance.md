---
title: "복합 인덱스를 활용한 API 성능 개선"
date: 2025-11-02T03:22:40Z
categories:
  - DB
excerpt: "목차의 중요성"
---
## 서론

![](/assets/images/velog/22719ae7-7205-48d3-851f-f5e44922021c-image.png)

모든 대학생의 연례행사, 수강 신청 기간이 있다. 대부분의 대학생은 시간표를 잘 짜기 위해서 예비 수강 신청 기간에 하루 종일 시간표를 선택하고 빼기를 반복한다. 나 또한 그랬다. 

한국기술교육대학교 학생들은 `에브리타임, 코인, 학교 포털 사이트` 에서 주로 예비 수강 신청 기간을 보내는 거 같다. 에브리타임의 경우 엄청 많은 대학을 커버하고 있기 때문에 강의 업데이트 시간이 랜덤이지만, 코인은 한국기술교육대학교 재학생들을 상대로 서비스를 제공하고 있기 때문에 바로 강의 업데이트를 진행할 수 있다. 이때 회원가입도 많이 발생하고, 강의 관련 API 요청수도 급증한다. 

2025년 2학기 수강신청이 끝나고 문뜩 궁금한 사항이 생겼다. `강의 관련 API가 급증한 요청을 잘 처리하고 있을까?` 따닥 이슈로 인해 슬랙으로 날라오는 에러 말고는 큰 문제는 없었지만, 들어나지 않는 문제가 있을 수 있기 때문에 API 모니터링을 보기로 했다.

## 본론

### 강의 관련 도메인

강의 관련 도메인는 다음과 같다.

1. 정규 과목 : Lecture
2. 학기 : Semester
3. 시간표 프레임 : TimetableFrame
4. 시간표 프레임에 등록된 강의 : TimetableLecture

### 모니터링 확인

강의 관련 도메인의 API 모니터링을 확인했다. 기간은 2025년 7월 11일부터 8월 1일까지로 설정했다. 

> 왜 기간을 이렇게 잡았을까?
> 
> - 7월 11일 : 코인 2025년 2학기 시간표 업데이트
> - 7월 14일 ~ 7월 18일 : 예비 수강신청
> - 7월 14일 ~ 7월 25일 : 학부(과) 수강지도 기간
> - 7월 30일 ~ 8월 1일 : 2학기 수강신청

확인한 지표는 `P95 LATENCY` 이다. 왜냐하면 상단 이미지에 나온 페이지는 4개의 API를 모두 호출하고 그려지기 때문에 하나의 API에서 딜레이가 걸리면 화면이 그려지는 시간이 느려지기 때문이다.

확인 결과 Semester, TimetableFrame, TimetableLecture는 30ms 안쪽으로 다 들어왔다. 심지어 TimetableLecture의 경우 졸업학점계산기 로직도 포함되어 있는데 30ms 안쪽으로 들어와서 신기했다. 하지만 Lecture에서 조금 시간이 걸렸다. 

![](/assets/images/velog/7156035d-9c87-420c-90b7-c908cee76ebd-image.png)

![](/assets/images/velog/eee57740-a9f9-45a4-98ac-95f754046364-image.png)

`GET /v3/lectures` 은 웹, `GET /lectures` 은 모바일에서 사용하고 있다. 두 API는 특정 Semester에 등록된 Lecture을 가져오는 API이며, P95가 약 50ms으로 찍히고 있다.

더 자세하게 확인하기 위해 API의 Flame Graph를 확인했고 DB에서 Lecture 데이터들을 가져올 때 30ms, 데이터를 가져오고 응답으로 나가는 대까지 20ms 정도 걸리는 것을 확인했다.

### 어떻게 개선할 수 있을까?

위에서 언급한 것 처럼 API에서 수행하는 로직은 두개가 있다. 

1. DB에서 Lecture 데이터 가져오기
2. Lecture 데이터들을 응답 DTO에 매핑해서 반환하기

1번의 경우 먼저 실행계획을 봐야겠지만 인덱스, 쿼리 튜닝 등의 방법을 사용할 수 있을 거 같다. 

2번의 경우 DTO로 매핑 하는 과정에서 병렬 스트림, 엔티티 영속성 관리를 피하기 위해 DTO 인젝션 등의 방법을 사용할 수 있을 거 같다.

이외에도 Lecture의 경우 자주 변하지 않기 때문에 수강 신청기간에만 캐싱을 활용하는 방법도 있다.

나는 1번 로직을 확인하여 개선점을 찾기로 결정했다. 절대적인 수치를 봤을 때 DB에서 시간이 많이 걸렸고, 겸사겸사 DB 공부를 하고 싶었기 때문이다. 

### 실행계획

실행 계획이란 데이터베이스가 SQL를 실행하기 전 수립하는 작업 절차이다. MySQL에서는 `EXPLAIN, EXPLAIN ANALYZE` 를 통해 확인할 수 있다. 실행계획을 통해 쿼리가 실행되는 과정에서 진행되는 단계와 필요한 비용을 확인할 수 있으며, 성능 문제를 확인하는 데 도움을 준다.

Lecture 데이터를 가져오는 쿼리의 실행계획을 한 번 확인해보자.

```sql
EXPLAIN ANALYZE SELECT * FROM lectures WHERE semester_date = '20252';

-> Filter: (lectures.semester_date = '20252')  (cost=1061 rows=1021) (actual time=20.6..21.3 rows=775 loops=1)
    -> Table scan on lectures  (cost=1061 rows=10208) (actual time=0.196..20.1 rows=10614 loops=1)
```

두 번의 실행 순서가 존재하며, 하나 씩 알아보자

```sql
Table scan on lectures  (cost=1061 rows=10208) (actual time=0.196..20.1 rows=10614 loops=1)
```

첫 번째로 `Table scan` 이 발생했다. 총 10208개의 행을 조회했고, 20.1ms가 소요됨을 알 수 있다. 

```sql
Filter: (lectures.semester_date = '20252')  (cost=1061 rows=1021) (actual time=20.6..21.3 rows=775 loops=1)
```

이후에는 필터링을 통해 `lectures.semester_date = '20252`` 인 데이터를 선택했다. Table scan 과정에서 조회한 10208개의 행에서 775개의 행을 선택했고, 시간은 0.6ms가 소요됨을 알 수 있다. 

### 문제점

775개의 행을 조회하기 위해 10208개의 불필요한 행을 읽는 과정, 즉 `Table scan` 과정에서 20.1ms가 소요되어 병목이 발생함을 확인할 수 있다. 불필요한 행을 읽는 과정을 최소화하고, 원하는 데이터를 빠르게 가져오기 위해서는 어떻게 해야할까?

### 스캔

`Table scan` 과 같은 Scan은 데이터를 읽는 작업을 말하며, 여러 방법이 존재한다.

1. TABLE SCAN : 인덱스를 활용하지 않고, 모든 테이블의 데이터를 스캔
2. ROWID SCAN : ROWID를 기준으로 데이터를 스캔
3. INDEX SCAN : 인덱스를 활용하여 데이터를 스캔

ROWID의 경우 Oracle DB에서 활용되는 방법이라고 하며, 현재 사용하는 DB인 MySQL에서는 유사한 방법으로 사용할 수는 있는 거 같지만 레퍼런스가 많지 않았다. 그래서 INDEX SCAN을 유도하는 방향으로 가보기로 했다.

### 인덱스

Lecture 테이블 DDL를 통해 어떤 인덱스가 걸려있는 지 확인해보자.

```sql
CREATE TABLE `lectures` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'lectures 고유 id',
  `semester_date` varchar(10) NOT NULL,
  `code` varchar(10) NOT NULL COMMENT '강의 코드',
  ...
  PRIMARY KEY (`id`),
  KEY `idx_lecture_code_semester` (`code`,`semester_date`)
)
```

`code, semester_date` 으로 복합 인덱스가 걸려있음을 확인할 수 있다. 

인덱스가 있는데도 쿼리에서 인덱스를 활용하지 않는 이유가 뭘까? INDEX SCAN을 타는 상황은 다음과 같다.

1. 조건절에서 비교한 컬럼에 인덱스가 없는 상황
2. 조건절에 비교한 컬럼에 대해 인덱스가 있지만, 조건을 만족하는 데이터가 테이블의 많은 양을 차지하여 TABLE SCAN이 나은 경우
3. 조건절에 비교한 컬럼에 대해 인덱스가 있지만, 테이블의 데이터 자체가 적어 TABLE SCAN이 나은 경우

1번에 대해서는 `where lectures.semester_date = '2025`` , 즉 semester_date 컬럼을 비교하고 있다. 하지만, 복합 인덱스의 순서는 `code, semester_date` 로 걸려 있어 해당 인덱스를 활용할 수 없다. 왜냐하면, 왼쪽에 있는 컬럼을 기준으로 정렬을 진행하고 인덱스를 만들기 때문이다. (leftmost prefix이라고 한다)

lectures 테이블에는 약 10000개의 데이터가 존재하며, 학기당 lectures은 700~800개 정도 존재한다. 학기당 lectures가 전체 데이터의 약 14% 정도 차지하고 있다. 2번의 경우 한 학기의 테이블이 전체 테이블의 많은 양을 차지하고 있지 않기 때문에, TABLE SCAN보다 INDEX SCAN를 유도하는 것이 좋아보인다. 또한, 테이블의 데이터도 약 10000개가 존재하며, 시간이 지날 수록 데이터가 학기에 대한 lectures 데이터가 쌓이기 때문에 3번에도 해당되지 않는다.

`code` 의 경우 졸업학점계산기에서 사용하고 있고 `semester_date, code` 순서로 사용하고 있기 때문에 졸업학점계산기에서도 인덱스를 활용하고 있지 않음을 알 수 있었다. 그렇기 때문에 다음과 같이 인덱스를 추가했다.

```sql
CREATE INDEX idx_lecture_semester_code ON `koin`.`lectures` (semester_date, code);
```

### 결과

```sql
EXPLAIN ANALYZE SELECT * FROM lectures WHERE semester_date = '20252';

-> Index lookup on lectures using idx_lecture_semester_code (semester_date='20252')  (cost=198 rows=775) (actual time=0.366..1.62 rows=775 loops=1)
```

실행계획을 통해 Index를 활용해서 데이터를 Scan하고 있음을 알 수 있고, 1.62ms가 걸렸다. 약 13배의 개선이 됐음을 확인할 수 있다. 이를 통해 API의 성능 개선또한 기대할 수 있다.

해당 작업을 하여 [PR](https://github.com/BCSDLab/KOIN_API_V2/pull/1900)을 올렸고, 프로덕션 [배포](https://github.com/BCSDLab/KOIN_API_V2/pull/1948)는 9월 8일에 진행됐다. 이후 모니터링을 확인했지만,,

### 변화가 안보인다?

![](/assets/images/velog/4ce00890-bd56-467e-a642-c45e86a652c3-image.png)

DB에서 데이터를 가져오는 시간이 10ms 내로 들어와서, API의 성능 개선은 된 것을 확인할 수 있었었다.


![](/assets/images/velog/67780ce8-17c2-4dda-af3a-2edd8e9c9f02-image.png)

하지만 `P95` 의 수치는 이전과 큰 차이가 존재하지 않았다.

### InnoDB Buffer Pool

InnoDB Buffer Pool은 데이터나 인덱스 정보를 메모리에 캐시해 두는 공간이다. 이를 언급하는 이유는 인덱스 추가 이전과 이후의 API 요청 횟수에서 차이가 발생했기 때문이다.

수강신청 기간에는 해당 API의 요청이 웹에서는 약 3000번, 모바일에서는 약 16000번 발생했다. 하지만 인덱스가 추가되고 배포된 시점은 9월이며 수강신청과는 거리가 멀어진 시즌이다. 요청수도 웹은 409번, 모바일에서는 513번으로 확연하게 차이가 난다. 


API 요청 간격이 있음을 확인할 수 있다. 요청수도 떨어지고, 요청 시간 간격도 커짐에 따라 Buffer Pool에 lecture가 올라가는 빈도가 낮아지고 Buffer Pool의 캐싱효과를 보지 못하고 있다고 추측했다. 

전후를 비교하기 위해서는 다가오는 2026년 1학기 수강신청 기간과 비교를 해야하고, 지금 당장의 수치로는 비교하기 어렵다고 판단했다.

### 참고

https://coding-factory.tistory.com/744#google_vignette
https://yelimkim98.tistory.com/55

## 결론

개선 수치를 명확하게 확인하지 못했지만, DB의 인덱스 하나로 성능을 좌지우지할 수 있음을 간접적으로 알 수 있었다. 단순히, `많이 사용하면 인덱스 걸어도 되는 거 아닌가?` 라고 생각했는데 순서부터 시작해서 이것저것 고려해야할 사항이 많음을 알 수 있었다.

또한, 리마큐 스터디를 할 때 알게된 Buffer Pool이 중요한 역할을 함을 알 수 있었다. 책을 읽을 때는 무슨말인지 이해조차 안 됐는데, 이렇게 영향을 받으니 다시 읽어 봐야겠다는 생각이 들었다.

인덱스에 대해 여기서는 깊게 다루지 않았지만, 별도로 정리해서 블로깅을 해야겠다는 생각이 들었다. 또한, 모니터링 도구의 중요성에 대해서도 알 수 있었다. 모니터링 도구를 잘 활용하는 것도 하나의 역량이라고 생각이 든다.