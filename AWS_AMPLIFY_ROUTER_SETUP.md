# AWS Amplify Rewrites 설정 가이드

React Router를 사용하는 SPA(Single Page Application)를 AWS Amplify에 배포할 때는 
모든 경로를 `index.html`로 리다이렉트하는 설정이 필요합니다.

## 설정 방법

### AWS Amplify Console에서 설정

1. AWS Amplify Console 접속
2. 앱 선택 → **Rewrites and redirects** 메뉴 클릭
3. 다음 규칙 추가:

```json
[
  {
    "source": "/<*>",
    "target": "/index.html",
    "status": "200",
    "condition": null
  }
]
```

### 또는 amplify.yml에 추가

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
  customHeaders:
    - pattern: '**/*'
      headers:
        - key: 'Strict-Transport-Security'
          value: 'max-age=31536000; includeSubDomains'
        - key: 'X-Frame-Options'
          value: 'SAMEORIGIN'
        - key: 'X-Content-Type-Options'
          value: 'nosniff'
```

## 설명

- `source: "/<*>"`: 모든 경로를 매칭
- `target: "/index.html"`: index.html로 리다이렉트
- `status: "200"`: HTTP 200 상태 코드 (Rewrite, not Redirect)
- `condition: null`: 조건 없음

이 설정으로 `/crew`, `/running` 등의 경로로 직접 접속해도 
React Router가 올바르게 작동합니다.

## 주의사항

⚠️ **기존 maintenance.html 설정과 충돌 가능**

점검 모드를 사용 중이라면 다음 순서로 규칙을 배치하세요:

```json
[
  {
    "source": "/maintenance.html",
    "target": "/maintenance.html",
    "status": "200",
    "condition": null
  },
  {
    "source": "/<*>",
    "target": "/index.html",
    "status": "200",
    "condition": null
  }
]
```

점검 모드 활성화 시에는 첫 번째 규칙을 다음과 같이 변경:

```json
{
  "source": "/<*>",
  "target": "/maintenance.html",
  "status": "200",
  "condition": null
}
```
