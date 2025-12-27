# Cloudinary 이미지 업로드 설정 가이드

사용자가 직접 프로필 이미지를 업로드할 수 있도록 Cloudinary를 설정하는 방법입니다.

## 1. Cloudinary 계정 생성

1. [Cloudinary](https://cloudinary.com) 웹사이트에 접속
2. 무료 계정 생성 (Sign Up)
3. 이메일 인증 후 로그인

## 2. Cloud Name 확인

1. 로그인 후 Dashboard로 이동
2. 상단에 표시된 **Cloud Name** 복사
   - 예: `dxxxxxxxx`

## 3. Upload Preset 생성

1. Dashboard에서 **Settings** (톱니바퀴 아이콘) 클릭
2. 왼쪽 메뉴에서 **Upload** 탭 선택
3. 아래로 스크롤하여 **Upload presets** 섹션 찾기
4. **Add upload preset** 클릭
5. 다음 설정 적용:
   - **Signing Mode**: `Unsigned` 선택 ⚠️ 중요!
   - **Preset name**: 원하는 이름 입력 (예: `running_profile_images`)
   - **Folder**: `profiles` (프로필 이미지를 저장할 폴더명)
   - **Access Mode**: `public` 선택
6. **Save** 클릭

## 4. 환경 변수 설정

1. 프로젝트 루트에 `.env.local` 파일 생성
2. 아래 내용을 복사하여 실제 값으로 변경:

```env
VITE_CLOUDINARY_CLOUD_NAME=여기에_Cloud_Name_입력
VITE_CLOUDINARY_UPLOAD_PRESET=여기에_Upload_Preset_이름_입력
VITE_API_URL=https://localhost:8443
```

예시:
```env
VITE_CLOUDINARY_CLOUD_NAME=dxxxxxxxxx
VITE_CLOUDINARY_UPLOAD_PRESET=running_profile_images
VITE_API_URL=https://localhost:8443
```

## 5. 개발 서버 재시작

환경 변수를 변경했으므로 개발 서버를 재시작해야 합니다:

```bash
# 개발 서버 중지 (Ctrl + C)
# 개발 서버 재시작
npm run dev
```

## 6. 테스트

1. 애플리케이션에서 로그인
2. 닉네임 등록 화면에서 **내 이미지 업로드** 버튼 클릭
3. 이미지 파일 선택 (5MB 이하)
4. 업로드 완료 후 미리보기 확인
5. **시작하기** 버튼으로 프로필 저장

## 주의사항

- ⚠️ **Unsigned Upload Preset**을 반드시 사용해야 합니다
- 이미지 크기는 최대 5MB까지 지원
- jpg, png, gif 등 일반적인 이미지 형식 모두 지원
- 업로드된 이미지는 Cloudinary에 영구 저장됩니다

## 보안 설정 (선택사항)

프로덕션 환경에서는 다음과 같은 추가 보안 설정을 권장합니다:

1. **Upload Preset**에서 파일 크기 제한 설정
2. **Allowed formats** 설정 (jpg, png만 허용)
3. **Transformation** 설정으로 이미지 크기 자동 조절
   - Width: 500px
   - Height: 500px
   - Crop: fill

## 문제 해결

### 업로드 실패 시
- Cloud Name과 Upload Preset이 정확한지 확인
- Upload Preset이 **Unsigned** 모드인지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 환경 변수가 적용되지 않을 때
- 개발 서버 재시작
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 변수명이 `VITE_` prefix로 시작하는지 확인
