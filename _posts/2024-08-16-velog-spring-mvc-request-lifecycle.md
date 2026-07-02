---
title: "Spring MVC Request Lifecycle"
date: 2024-08-16T12:12:41Z
categories:
  - Spring
excerpt: "요청과 응답은 어떤 과정으로 처리가 될까"
---
![](/assets/images/velog/3240da8c-e55d-4c91-a6f1-97832338d698-image.png)
- Request
    - 해당 요청을 내장 톰캣이 받는다.
    - 동적 처리가 필요한 요청인 경우, 톰캣은 서블릿으로 등록된 디스패처 서블릿에게 해당 요청을 보낸다.
    - 이때, 요청 및 응답 객체를 같이 보낸다.
- Filter
    - Dispatcher Servlet에게 요청이 들어가기 전과 후에 필터를 거친다.
    - Filter는 요청에 대한 인증, 권한 체크를 하는데 사용된다.
    - 스프링에서 제공하는 기능이 아닌, J2EE 표준 스펙 기능이다.
    
    > J2EE : 자바 기술로 기업환경의 애플리케이션을 만드는데 필요한 스펙들을 모아둔 스펙 집합
    > 
- Dispatcher Servlet
    - 톰캣으로 받은 클라이언트의 요청을 적합한 핸들러에게 요청을 위임하고, 처리 결과를 받아 반환하는 프론트 컨트롤러이다.
- HandlerMapping
    - 사용자의 요청을 처리하기 위한 적절한 핸들러를 찾는다.
    - 애플리케이션 구동 과정에서 @Controller, @RestController 어노테이션이 붙은 클래스에 @RequestMapping 혹은 유사한 어노테이션이 붙은 메소드들이 핸들러로 등록이 된다.
    - HandlerMapping은 그렇게 등록된 핸들러, 즉 컨트롤러 메소드를 찾는다.
- HandlerAdapter
    - HanderMapping에서 적절한 핸들러를 찾아 반환을 하면, Dispatcher Servlet에서는 HandlerAdapter에게 해당 핸들러를 이용해서 처리하도록 위임한다.
    - 위임하기 전, HandlerInterceptor에 등록된 인터셉터 체인의 preHandle 메소드가 실행된다.
    - 정상적으로 인터셉터를 통과했다면 argument resolver를 호출하여 컨트롤러 메소드를 처리하기 위한 데이터를 생성하고 컨트롤러 메소드를 실행한다.
        - Argument resolver은 컨트롤러 메소드 파라미터에 있는 어노테이션을 보고 처리한다.
        - 대표적으로 @RequestBody, @PathVariable, @RequestParam 등이 있다.
        - 이때, HttpMessageConverter를 사용한다.
    - 컨트롤러 메소드의 반환값을 받아 Dispatcher Servlet로 반환한다.
        - 반환값이 String인 경우 뷰의 이름으로 해석한다.
        - 반환값이 객체인 경우 적절한 HttpMessageConverter를 사용해서 JSON 혹은 XML로 변환한다.
- ViewResolver
    - Dispatcher Servlet는 HandlerAdapter로 받은 뷰 이름을 ViewResolver로 전달한다.
    - ViewResolver은 받은 뷰 이름을 통해 뷰를 랜더링한다.
    - 이때, 사용된 Model 데이터가 있다면 뷰에 전달해서 최종 HTML을 렌더링한다.
- Response
    - Dispatcher Servlet은 톰캣으로 받은 응답 객체에 뷰 혹은 특정 형태의 데이터를 담아 톰캣에 전달한다.
    - 톰캣을 이를 받아 클라이언트로 전달한다.