# 🛠️ 서비스 점검 모드 가이드

서비스 점검 시 사용자의 접근을 차단하고 공지 페이지를 띄우는 방법입니다.
프론트엔드(Amplify)와 백엔드(EC2)에서 각각 설정해야 완벽하게 차단할 수 있습니다.

## 1. 프론트엔드 (AWS Amplify)

사용자가 웹사이트(`https://llrun.shop`)에 접속했을 때 React 앱 대신 점검 페이지를 보여줍니다.

1. **AWS Amplify Console 접속**
2. 해당 앱 선택 -> 사이드바의 **Rewrites and redirects** 메뉴 클릭
3. **Manage rewrites and redirects** 클릭
4. **Add rule** 클릭하여 아래 규칙 추가 (최상단으로 이동):
   - **Source address**: `/<*>` (모든 경로)
   - **Target address**: `/maintenance.html` (우리가 만든 파일)
   - **Type**: `200 (Rewrite)`
5. **Save** 클릭
   - 즉시 적용되며, 모든 접속자가 점검 페이지를 보게 됩니다.

*(점검 종료 시: 해당 규칙을 삭제하거나 Disable 처리하세요)*

---

## 2. 백엔드 (AWS EC2 Nginx)

API 요청(`https://api.llrun.shop/api/...`)을 차단하고 503 코드를 반환합니다.

### 2-1. 준비
1. `public/maintenance.html` 파일을 EC2 서버의 `/usr/share/nginx/html/` 경로에 업로드합니다.
   ```bash
   scp -i키파일.pem public/maintenance.html ubuntu@EC2_IP:/tmp/
   ssh -i키파일.pem ubuntu@EC2_IP
   sudo mv /tmp/maintenance.html /usr/share/nginx/html/
   ```

### 2-2. 설정 적용
1. Nginx 설정 파일 열기
   ```bash
   sudo nano /etc/nginx/sites-available/default
   # 또는 프로젝트 설정 파일
   ```

2. `location /api` 블록 안에 `return 503;` 추가
   ```nginx
   location /api {
       return 503;  # <-- 이 줄 추가
       
       # (기존 설정)
       proxy_pass http://localhost:8080;
       ...
   }
   
   # 503 에러 페이지 설정 (server 블록 안에 추가)
   error_page 503 @maintenance;
   location @maintenance {
       root /usr/share/nginx/html;
       rewrite ^(.*)$ /maintenance.html break;
   }
   ```

3. Nginx 재시작
   ```bash
   sudo service nginx reload
   ```

*(점검 종료 시: `return 503;` 라인을 주석 처리하거나 삭제하고 reload 하세요)*

---

## 3. 요약

| 구분 | 차단 대상 | 방법 | 비고 |
|------|-----------|------|------|
| **프론트엔드** | 웹 접속 차단 | Amplify Redirect 규칙 추가 | `/<*>` → `/maintenance.html` |
| **백엔드** | API 호출 차단 | Nginx `return 503` | API 호출 시 에러가 아닌 점검 HTML 반환 |
