# Spring Boot 백엔드 실행 가이드

## 백엔드 저장소

이 프로젝트의 백엔드는 별도 저장소로 관리됩니다:
- **저장소**: https://github.com/kbj184/secondwind
- **위치**: `./backend/` (프론트엔드 프로젝트 내 서브모듈)

## 실행 방법

### 1. 개발 서버 실행

```bash
cd backend
./gradlew.bat bootRun
```

서버는 `https://localhost:8443`에서 실행됩니다.

### 2. 빌드

```bash
cd backend
./gradlew.bat build
```

빌드된 JAR 파일은 `backend/build/libs/` 디렉토리에 생성됩니다.

### 3. 테스트 실행

```bash
cd backend
./gradlew.bat test
```

## 주요 엔드포인트

### 인증
- `POST /login` - 로컬 로그인
- `GET /oauth2/authorization/naver` - 네이버 소셜 로그인
- `GET /oauth2/authorization/google` - 구글 소셜 로그인
- `POST /refresh/token` - 토큰 갱신

### 사용자
- `GET /` - 메인 페이지 (인증 필요)
- `GET /my` - 내 정보 조회
- `GET /emailcheck` - 이메일 중복 확인

## 환경 설정

백엔드 실행을 위해서는 다음 설정이 필요합니다:

### application.properties
```properties
# 데이터베이스 설정
spring.datasource.url=jdbc:mariadb://localhost:3306/secondwind
spring.datasource.username=your_username
spring.datasource.password=your_password

# JWT 설정
jwt.secret=your_jwt_secret_key

# OAuth2 설정
spring.security.oauth2.client.registration.naver.client-id=your_naver_client_id
spring.security.oauth2.client.registration.naver.client-secret=your_naver_client_secret
spring.security.oauth2.client.registration.google.client-id=your_google_client_id
spring.security.oauth2.client.registration.google.client-secret=your_google_client_secret
```

자세한 설정은 백엔드 저장소의 `application.properties.example` 파일을 참조하세요.

## 데이터베이스 설정

### MariaDB 설치 및 설정

1. MariaDB 설치
2. 데이터베이스 생성:
```sql
CREATE DATABASE secondwind CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. 사용자 생성 및 권한 부여:
```sql
CREATE USER 'your_username'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON secondwind.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
```

## 프론트엔드와 연동

프론트엔드에서 백엔드 API를 호출할 때:
- 백엔드 URL: `https://localhost:8443`
- CORS 설정이 되어 있어 `https://localhost:3000`에서의 요청을 허용합니다.

## 개발 팁

### Hot Reload
Spring Boot DevTools가 설정되어 있으면 코드 변경 시 자동으로 재시작됩니다.

### 로그 확인
애플리케이션 로그는 콘솔에 출력됩니다. 로그 레벨은 `application.properties`에서 조정할 수 있습니다.

### API 테스트
Postman이나 curl을 사용하여 API를 테스트할 수 있습니다.

## 문제 해결

### 포트 충돌
8443 포트가 이미 사용 중인 경우, `application.properties`에서 포트를 변경하세요:
```properties
server.port=8444
```

### 데이터베이스 연결 오류
- MariaDB 서비스가 실행 중인지 확인
- 데이터베이스 접속 정보가 올바른지 확인
- 방화벽 설정 확인

### SSL 인증서 오류
개발 환경에서는 자체 서명된 인증서를 사용합니다. 브라우저에서 경고가 표시되면 "계속 진행"을 선택하세요.

## 추가 정보

백엔드 저장소에서 더 자세한 정보를 확인할 수 있습니다:
https://github.com/kbj184/secondwind
