---
title: "로그 롤링 및 S3 적재"
date: 2025-11-02T12:30:18Z
categories:
  - Infra
excerpt: "모래 주머니 압축하기"
---
## 서론

![](/assets/images/velog/9e0212db-7961-43e0-9376-7ad7330bbcd4-image.png)

2025년 7월 14일 23시경 프로덕션이 터져버렸다. 사건의 전말은 다음과 같다.

1. hotfix로 [PR](https://github.com/BCSDLab/KOIN_API_V2/pull/1782)을 머지했다.
2. 배포가 도는 과정에서 빌드 산출물이 프로덕션 EC2로 이동이 안 된다.
3. 프로덕션 EC2를 재부팅을 했는데, EC2 접속이 안된다.
4. 재부팅을 했기 때문에 WAS가 죽고, 서비스가 다운됐다.

이를 해결하기 위해 많은 인력이 밤을 새웠다. 그다음 날이 출근날이었기 때문에 팀원들이 들어가라고 권유했다. 새벽 1시까지 잡다가 팀원들에게 맡겼다. 다음날 일어나보니 해결 됐다. 역시 대단한 팀원들이다.

초기 원인은 EC2 OS가 터진 것으로 추측했지만 최종으로 식별한 원인은 EC2 디스크가 꽉차서 접속이 안된 것이였다. 이를 해결하기 위해 임시 방편으로 디스크 용량을 늘렸다고 전달받았다. WAS만 떠있는 EC2에 용량문제가 왜 발생했을까? 정답은 로그파일에 있었다. 

## 본론

### 로그 파일

![](/assets/images/velog/2c3000fb-6fc6-4530-983b-a6b919380e23-image.png)

프로덕션 WAS의 로그파일이다. 용량이 약 13.27GB이다. 프로덕션 EC2에는 WAS만 떠있기 때문에 과거 사람들이 디스크 용량을 작게 가져간 것으로 추측된다. 이 로그 파일을 어떻게 하면 서비스에 영향을 주지 않을 수 있을까?

이 로그 파일에는 두 가지 문제가 있다고 생각했다.

1. 하나의 로그파일에 누적해서 기록하기 때문에 특정 로그를 찾을려고 로그파일을 연 순간 EC2가 터진다.
2. 13.27GB라는 이미 거대해버린 로그파일을 계속 냅두면 무한정 커져버리고, 에에 따라 EC2 디스크 용량을 늘린다면 금전적 문제도 발생한다.

두 문제를 개선해보자.

### 로그 롤링

로그 롤링이란 일정 단위로 로그 파일을 재갱신하는 작업이라고 한다. 현재 코인은 로그 롤링을 진행하지 않고 있고, 그 결과 저 거대한 로그파일이 생성됐다. 이를 적용하기 위해서는 어떻게 해야할까?

`logback` 라이브러리에서는 이를 지원하고 있고, 코인 또한 해당 라이브러리를 사용하고 있어 쉽게 설정이 가능하다. 사전 지식은 다음과 같다.

1. Appender : log의 출력 대상과 형식을 설정
2. RollingPolicy : 로그 보관 정책
3. TriggeringPolicy : 롤링 트리거

> 더 자세한 내용은 참조에 걸은 블로그를 확인해보자
> 

원하는 롤링 기준은 `매달 1일 로그 파일을 재갱신` 이다. 이유는 다음과 같다.

1. 주마다 끊어버리면 너무 많은 로그 파일이 발생할 거 같다.
2. 용량 기준으로도 끊을 수 있는데 방학과 같은 기간에는 사용자가 줄어들어서 로그 파일의 용량이 커지지 않고 그에 따라 롤링이 되지 않을 것이라고 생각했다. 
3. 또한 달마다 롤링을 햇을 때 로그 파일의 용량이 그렇게 크지 않을 것이라 생각했다.

```xml
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/app.log</file>
    <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>

    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <fileNamePattern>logs/app.%d{yyyy-MM}.log.gz</fileNamePattern>

        <maxHistory>12</maxHistory>
    </rollingPolicy>
</appender>
```

해당 기준을 만족하는 `TimebasedRollingPolicy` 정책을 선택했고, 최대 12개를 관리하도록 설정했다. 12개가 넘어가면 가장 오래된 파일을 삭제한다. 또한 롤링된 로그가 디스크 용량을 많이 차지하지 않도록 `.gz` 으로 압축하도록 설정했다. 

> 해당 [PR](https://github.com/BCSDLab/KOIN_API_V2/pull/2020)에서 작업 내용을 확인할 수 있다.

### 롤링한 이후에는?

로그 롤링을 통해 월별로 로그를 확인할 수 있기 때문에 1번은 해결했다. 2번도 간접적으로 해결됐다. 여기서 추가적으로 든 생각이 있다. `로그 파일이 12개가 넘어가면 가장 오래된 로그 파일은 지워지는데, 혹시 나중에 삭제된 로그파일이 필요해진다면?` → 백업이 필요할 수도 있겠다.

### 로그 S3 적재

백업할 공간을 찾던 중 S3가 눈에 들어왔다. 널리 알려진 것 처럼 S3은 높은 가용성과 높은 내구성을 자랑한다. AWS 인프라를 사용하고 있기 때문에 이를 활용할 수 있을 것이라 생각했다.

EC2 디스크에 있는 로그 파일을 S3로 올리기 위해서는 `AWS CLI` 를 사용해야 한다. `AWS CLI` 는 쉘 커멘트를 통해 AWS 서비스와 사옹 작용할 수 있는 도구이다. 코인 EC2에는 이미 연결되어 있지만, S3 접근 권한이 없는 IAM 계정과 연결된 상태였다. `AWS CLI` 는 다중 계정 설정이 가능하기 때문에 S3 접근 권한이 있는 IAM 계정과 연결하도록 시도했다.

```bash
aws configure --profile {IAM 계정 이름}
```

이후 연결하고자 하는 IAM 계정 정보를 입력하면 된다.

- AWS Access Key ID : 엑세스 키
- AWS Secret Access Key : 시크릿 키
- Default region name : 리전
- Default output format : 응답 형식 (text, json, table)

이렇게 추가된 계정을 통해 명령어를 실행할기 위해서는 `--profile {IAM 계정 이름}` 를 붙여야 한다. 그렇지 않으면 `default user` 로 설정된 IAM 계정으로 명령어를 실행하기 때문이다.

이후 쉘 스크립트를 작성하고 테스트를 진행했다.

```bash
SRC_DIR=" "
S3_URI=" "
AWS_PROFILE=" "

SLACK_SUCCESS_WEBHOOK_URL="https://hooks.slack.com/services"
SLACK_ERROR_WEBHOOK_URL="https://hooks.slack.com/services"

json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\r'/}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

slack_text() {
  local url="$1"
  local text="$2"
  local payload
  payload=$(printf '{"text":"%s"}' "$(json_escape "$text")")
  curl -sS -X POST "$url" -H 'Content-type: application/json' -d "$payload" >/dev/null
}

month="$(date +%m | sed 's/^0//')"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 업로드 시작"

resp="$(
  aws s3 sync "$SRC_DIR" "$S3_URI" --profile "$AWS_PROFILE" 2>&1
)"
status=$?

resp_trimmed="$(printf '%s\n' "$resp" | tail -n)"

if [[ $status -eq 0 ]]; then
  success_msg="${month}월 코인 로그 업로드가 성공했습니다."
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $success_msg"
  slack_text "$SLACK_SUCCESS_WEBHOOK_URL" "$success_msg"
  exit 0
else
  fail_msg="${month}월 코인 로그 업로드가 실패했습니다.
\`\`\`
${resp_trimmed}
\`\`\`"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 업로드 실패 (exit=$status)"
  slack_text "$SLACK_ERROR_WEBHOOK_URL" "$fail_msg"
  exit "$status"
fi
                                                                                                                                                                                                                           1,1        꼭대기
```

쉘 스크립트는 AI 도움을 받았고, 로직은 다음과 같다.

1. `aws s3 sync` 명령어를 통해 EC2의 특정 디렉토리와 S3를 동기화한다.
2. 성공할 경우 슬랙으로 성공 메시지를 보낸다.
3. 실패할 경우 슬랙으로 실패 메시지를 보낸다.

![](/assets/images/velog/30dde4bb-c809-45f2-b938-2a6e332a2aeb-image.png)

![](/assets/images/velog/7828e267-a027-47b7-a319-580fa8bf4f1f-image.png)

![](/assets/images/velog/1875c12c-f2d1-4cc1-b9d6-7366f82af8ee-image.png)

테스트를 진행했고, 슬랙으로 메시지도 잘 넘어가고 s3에도 정상적으로 로그가 올라감을 확인했다.

해당 스크립트를 매달 1일 오전 6시에 돌아가도록 cron에 등록하고 11월에 잘 돌아가는 지 확인했다.

### 왜 안 돌 아 감 ?

11월 1일 아침에 일어나니 슬랙에 아무런 메시지가 날라오지 않았다. 파일이 롤링이 되지 않은 건가 싶었는데, 파일 롤링은 잘 됐다.

![](/assets/images/velog/2a1b63df-bfa7-4bdb-9886-cd949fca03d8-image.png)

그래서 쉘 스크립트의 로그 파일을 확인했다.

```bash
[2025-11-01 06:00:01] 업로드 시작
tail: option requires an argument -- 'n'
Try 'tail --help' for more information.
/usr/local/koin/api/sync_logs.sh: 38: [[: not found
[2025-11-01 06:00:01] 업로드 실패 (exit=127)
/usr/local/koin/api/sync_logs.sh: 12: Bad substitution
```

1. 스크립트는 bash 문법으로 작성되어 있다.
2. cron은 기본적으로 sh으로 실행하고, shebang가 없기 때문에 sh으로 실행 → bash 문법 ≠ sh 문법으로 인해 오류 발생

> **shebang**
어떤 인터프리터로 스크립트를 실행할지 지정하는 특수한 문자열이다.
> 

테스트를 할 때는 직접실행해서 해당 문제를 캐치할 수 없었다. 이를 확인하고 스크립트 상단에 `shebang` 를 추가하고 cron의 스케줄링 주기를 조절해서 실행했다.

![](/assets/images/velog/e9dd0e7f-323f-474f-92e0-afbbf6927207-image.png)

![](/assets/images/velog/5996fb34-b4b4-4dcf-b79d-616c774ef512-image.png)

정상적으로 롤링된 파일이 S3에 올라갔고, 슬랙으로도 메시지가 잘 넘어왔다.

### 참고
[Logback - 4. Appenders (2). RollingFileAppender](https://ckddn9496.tistory.com/82)
[Logback 이란?](https://agileryuhaeul.tistory.com/entry/Logback-%EC%9D%B4%EB%9E%80)
[[Logback] 3.SpringBoot에서 Logback 사용하기 - Appender와 Policy](https://lovethefeel.tistory.com/89#google_vignette)
[[AWS] 📚 AWS CLI 설치 & 등록 방법 - 쉽고 빠르게 설명](https://inpa.tistory.com/entry/AWS-%F0%9F%93%9A-AWS-CLI-%EC%84%A4%EC%B9%98-%EC%82%AC%EC%9A%A9%EB%B2%95-%EC%89%BD%EA%B3%A0-%EB%B9%A0%EB%A5%B4%EA%B2%8C)
[[AWS] 📚 S3 - CLI 명령어 종류 💯 총정리](https://inpa.tistory.com/entry/AWS-CLI-%F0%9F%93%9A-S3-CLI-%EB%AA%85%EB%A0%B9%EC%96%B4-%EC%A2%85%EB%A5%98-%F0%9F%92%AF-%EC%B4%9D%EC%A0%95%EB%A6%AC)

## 결론

9월 30일 기준 235MB이였던 로그파일이 압축을 하여 27MB 파일로 변환됨을 확인할 수 있다. 약 208MB(88.5%)가 줄었고, 서버 용량을 확보할 수 있었다.

또한, 롤링된 로그파일을 S3에 적재함으로써 혹여나 삭제된 로그파일을 확인해야할 일이 생길 경우 백업 파일을 확인하면 된다. 이 과정에서 AWS CLI와 shebang에 대해서 알 수 있었다.

로그 모니터링의 경우 데이터 독으로 하고 있지만 동아리에서 로그로 뭔가 시도해본 케이스를 본적이 없고, 해당 작업의 연장선으로 더 할 수 있는 게 있는지 찾아보는 것도 좋을 거 같다.