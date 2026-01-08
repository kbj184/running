# iOS 개발 전략 문서

> **작성일**: 2026-01-08  
> **목적**: Android 하이브리드 앱 완성 후 iOS 버전 개발 전략  
> **전제**: Android 앱이 완성되어 있고, React Native 코드베이스 존재

---

## 📋 목차

1. [개발 전략 개요](#개발-전략-개요)
2. [iOS vs Android 차이점](#ios-vs-android-차이점)
3. [개발 환경 준비](#개발-환경-준비)
4. [2주 개발 로드맵](#2주-개발-로드맵)
5. [플랫폼별 코드 작성](#플랫폼별-코드-작성)
6. [iOS 특화 기능](#ios-특화-기능)
7. [App Store 배포](#app-store-배포)
8. [Mac 없이 개발하기](#mac-없이-개발하기)
9. [비용 분석](#비용-분석)
10. [리스크 관리](#리스크-관리)

---

## 🎯 개발 전략 개요

### 기본 전제

```
✅ Android 앱 완성 (React Native)
✅ 백엔드 API 동작 중
✅ WebView 통합 완료
✅ 핵심 기능 검증 완료

→ iOS는 Android 코드의 80-90% 재사용
```

### 목표

- **기간**: 1-2주
- **코드 재사용률**: 80-90%
- **추가 작업**: iOS 전용 설정 및 최적화
- **품질**: Android와 동일한 사용자 경험

### 전략

```
1단계: Android 먼저 완성 및 출시 (7주)
   ↓
2단계: 사용자 피드백 수집 (1-2주)
   ↓
3단계: iOS 개발 시작 (1-2주)
   ↓
4단계: App Store 출시
```

---

## 📱 iOS vs Android 차이점

### 1. 개발 환경

| 항목 | Android | iOS |
|------|---------|-----|
| **개발 OS** | Windows/Mac/Linux | **Mac 필수** |
| **IDE** | Android Studio | Xcode |
| **빌드 도구** | Gradle | CocoaPods, Xcode Build |
| **에뮬레이터** | AVD | iOS Simulator |
| **실제 기기 테스트** | USB 연결 | USB + 개발자 인증서 |

### 2. 권한 시스템

#### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
```

#### iOS (Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>러닝 기록을 위해 위치 권한이 필요합니다</string>

<key>NSCameraUsageDescription</key>
<string>프로필 사진 촬영을 위해 카메라 권한이 필요합니다</string>
```

**차이점:**
- iOS는 **사용자에게 보여질 설명 필수**
- 권한 요청 타이밍이 더 엄격
- 백그라운드 권한 획득이 더 어려움

### 3. 백그라운드 동작

#### Android
```javascript
// 비교적 자유로운 백그라운드 동작
BackgroundGeolocation.configure({
  distanceFilter: 10,
  stopOnTerminate: false,
});
```

#### iOS
```javascript
// 엄격한 제한, 특별 설정 필요
BackgroundGeolocation.configure({
  distanceFilter: 10,
  stopOnTerminate: false,
  // iOS 전용 설정
  preventSuspend: true,
  heartbeatInterval: 60,
  activityType: BackgroundGeolocation.ACTIVITY_TYPE_FITNESS,
});
```

**Info.plist에 추가 필요:**
```xml
<key>UIBackgroundModes</key>
<array>
  <string>location</string>
  <string>fetch</string>
  <string>remote-notification</string>
</array>
```

### 4. UI/UX 가이드라인

| 요소 | Android (Material Design) | iOS (Human Interface) |
|------|--------------------------|----------------------|
| **네비게이션** | 햄버거 메뉴, 하단 탭 | 하단 탭 바 |
| **버튼** | 각진 형태, Ripple 효과 | 둥근 형태 |
| **상태바** | 다양한 색상 | 주로 흰색/검은색 |
| **노치** | 다양한 형태 | Safe Area 필수 |
| **제스처** | 뒤로가기 버튼 | 스와이프 제스처 |

### 5. 푸시 알림

#### Android (FCM)
```javascript
import messaging from '@react-native-firebase/messaging';

const token = await messaging().getToken();
```

#### iOS (FCM + APNs)
```javascript
import messaging from '@react-native-firebase/messaging';

// iOS는 추가 설정 필요
await messaging().requestPermission();
const token = await messaging().getToken();
```

**iOS 추가 작업:**
- APNs 인증서 생성
- Firebase Console에 APNs 키 등록
- Xcode에서 Push Notifications Capability 활성화

### 6. 배포 프로세스

| 단계 | Android (Google Play) | iOS (App Store) |
|------|----------------------|-----------------|
| **개발자 등록** | $25 (1회) | $99/년 |
| **앱 등록** | 간단 | 복잡 |
| **스크린샷** | 2개 이상 | 다양한 기기별 필수 |
| **심사 기간** | 1-2일 | 1-2주 |
| **심사 난이도** | 쉬움 | **까다로움** |
| **업데이트** | 즉시 반영 | 심사 필요 |
| **거부율** | 낮음 | 높음 |

---

## 💻 개발 환경 준비

### 필수 요구사항

#### 1. Mac 컴퓨터
```
최소 사양:
- macOS 13.0 (Ventura) 이상
- 8GB RAM (16GB 권장)
- 50GB 여유 공간
- Intel 또는 Apple Silicon (M1/M2/M3)
```

**Mac이 없는 경우 대안:**
- MacinCloud (클라우드 Mac 대여)
- Expo EAS Build (클라우드 빌드)
- 지인 Mac 빌려서 빌드
- Hackintosh (비추천)

#### 2. Xcode 설치
```bash
# App Store에서 Xcode 설치 (무료)
# 또는 터미널에서
xcode-select --install

# 버전 확인
xcode-select -p
```

**설치 후 확인:**
```bash
# Command Line Tools 설치
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# 라이선스 동의
sudo xcodebuild -license accept
```

#### 3. CocoaPods 설치
```bash
# Ruby 기반 의존성 관리 도구
sudo gem install cocoapods

# 버전 확인
pod --version
```

#### 4. Apple Developer 계정
```
1. https://developer.apple.com 접속
2. Apple ID로 가입
3. $99/년 결제 (개인 또는 조직)
4. 계정 활성화 (1-2일 소요)
```

#### 5. 개발 환경 설정
```bash
# React Native 프로젝트로 이동
cd c:/react/running-app

# iOS 의존성 설치
cd ios
pod install
cd ..

# iOS 시뮬레이터 실행
npx react-native run-ios
```

### 개발 도구 체크리스트

```
□ Mac 준비 (또는 클라우드 Mac)
□ Xcode 설치 및 설정
□ CocoaPods 설치
□ Apple Developer 계정 생성 및 결제
□ iOS Simulator 설정
□ 실제 iPhone 준비 (테스트용)
□ Git 설정 (Mac에서)
□ VS Code 또는 선호하는 에디터 설치
```

---

## 📅 2주 개발 로드맵

### Week 1: 환경 설정 및 기본 빌드

#### Day 1-2: 개발 환경 구축
```
□ Mac 준비 (구매/대여/빌림)
□ Xcode 설치 (약 12GB, 시간 소요)
□ CocoaPods 설치
□ Apple Developer 계정 생성
□ Git 저장소 클론 (Mac에서)
□ iOS 의존성 설치 (pod install)
□ 첫 빌드 시도 (에러 예상)
```

**예상 에러 및 해결:**
```bash
# 에러 1: CocoaPods 버전 문제
sudo gem install cocoapods --pre

# 에러 2: Xcode Command Line Tools
sudo xcode-select --switch /Applications/Xcode.app

# 에러 3: 의존성 충돌
cd ios
pod deintegrate
pod install
```

#### Day 3-4: iOS 전용 설정
```
□ Info.plist 권한 설정
  - 위치 권한 (NSLocationWhenInUseUsageDescription)
  - 백그라운드 위치 (NSLocationAlwaysAndWhenInUseUsageDescription)
  - 카메라 권한 (NSCameraUsageDescription)
  - 사진 라이브러리 (NSPhotoLibraryUsageDescription)

□ Background Modes 설정
  - Xcode → Signing & Capabilities
  - Background Modes 추가
  - Location updates 체크
  - Remote notifications 체크

□ Google Maps API 키 설정
  - AppDelegate.m에 API 키 추가

□ Firebase 설정
  - GoogleService-Info.plist 추가
  - Firebase Console에서 iOS 앱 등록
```

**Info.plist 설정 예시:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN">
<plist version="1.0">
<dict>
  <!-- 위치 권한 -->
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>러닝 중 현재 위치를 기록하기 위해 위치 권한이 필요합니다.</string>
  
  <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
  <string>백그라운드에서도 러닝을 기록하기 위해 항상 위치 권한이 필요합니다.</string>
  
  <key>NSLocationAlwaysUsageDescription</key>
  <string>백그라운드에서도 러닝을 기록하기 위해 위치 권한이 필요합니다.</string>
  
  <!-- 카메라 및 사진 -->
  <key>NSCameraUsageDescription</key>
  <string>프로필 사진 촬영을 위해 카메라 권한이 필요합니다.</string>
  
  <key>NSPhotoLibraryUsageDescription</key>
  <string>프로필 사진 선택을 위해 사진 라이브러리 접근 권한이 필요합니다.</string>
  
  <key>NSPhotoLibraryAddUsageDescription</key>
  <string>러닝 기록 이미지를 저장하기 위해 사진 라이브러리 접근 권한이 필요합니다.</string>
  
  <!-- 백그라운드 모드 -->
  <key>UIBackgroundModes</key>
  <array>
    <string>location</string>
    <string>fetch</string>
    <string>remote-notification</string>
  </array>
  
  <!-- Google Maps -->
  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
  </dict>
</dict>
</plist>
```

#### Day 5-7: 플랫폼별 코드 조정
```
□ Safe Area 처리 (노치 대응)
□ 상태바 스타일 조정
□ 네비게이션 바 스타일
□ iOS 전용 UI 컴포넌트 조정
□ 폰트 렌더링 차이 해결
□ 애니메이션 성능 최적화
```

**Safe Area 처리 예시:**
```javascript
import { SafeAreaView, Platform } from 'react-native';

function RunningScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* iOS 노치 영역 자동 회피 */}
      <View style={styles.content}>
        {/* 컨텐츠 */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // iOS 전용 추가 패딩
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
});
```

### Week 2: 테스트 및 배포 준비

#### Day 8-10: 기능 테스트
```
□ GPS 트래킹 정확도 테스트
  - 실제 iPhone으로 야외 테스트
  - 다양한 환경 (실내/실외/터널)
  
□ 백그라운드 동작 테스트
  - 화면 꺼진 상태
  - 앱 전환 상태
  - 30분 이상 장시간 테스트
  
□ 지도 렌더링 성능
  - 부드러운 스크롤
  - Polyline 렌더링
  - 마커 표시
  
□ WebView 통합 테스트
  - 네이티브 ↔ 웹 통신
  - 토큰 공유
  - 화면 전환
  
□ 푸시 알림 테스트
  - 포그라운드 알림
  - 백그라운드 알림
  - 알림 클릭 시 화면 이동
  
□ 카카오 로그인 테스트
```

**테스트 체크리스트:**
```
기능 테스트:
□ 러닝 시작/일시정지/종료
□ 거리/속도/시간 계산 정확도
□ 경로 저장 및 불러오기
□ 코스 따라가기
□ 크루 기능 (WebView)
□ 프로필 편집
□ 사진 업로드

성능 테스트:
□ 앱 시작 시간 < 3초
□ 지도 렌더링 60 FPS
□ 메모리 사용량 < 200MB
□ 배터리 소모 합리적

호환성 테스트:
□ iPhone SE (작은 화면)
□ iPhone 15 Pro (노치)
□ iOS 15, 16, 17
□ 다크 모드
```

#### Day 11-12: UI/UX 최적화
```
□ iOS 디자인 가이드라인 준수
  - SF Symbols 사용 (iOS 아이콘)
  - iOS 스타일 버튼
  - 네이티브 느낌의 애니메이션
  
□ 제스처 처리
  - 스와이프 뒤로가기
  - Pull to Refresh
  - Long Press
  
□ 햅틱 피드백 추가
  - 버튼 클릭 시
  - 러닝 시작/종료 시
  
□ 다크 모드 지원
  - 시스템 설정 따르기
  - 색상 자동 전환
```

**햅틱 피드백 예시:**
```javascript
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const handleStartRunning = () => {
  // iOS 햅틱 피드백
  ReactNativeHapticFeedback.trigger('impactMedium', {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  });
  
  startRunning();
};
```

#### Day 13-14: 배포 준비
```
□ 앱 아이콘 생성 (iOS 전용 크기)
  - 1024x1024 (App Store)
  - 180x180 (iPhone)
  - 120x120, 87x87, 80x80, 60x60, 58x58, 40x40, 29x29
  
□ 스플래시 스크린
  - LaunchScreen.storyboard 수정
  
□ 앱 이름 및 번들 ID 설정
  - Display Name
  - Bundle Identifier (com.yourcompany.runningapp)
  
□ 버전 관리
  - Version: 1.0.0
  - Build Number: 1
  
□ Release 빌드 생성
  - Xcode → Product → Archive
  
□ App Store Connect 설정
  - 앱 정보 입력
  - 스크린샷 업로드
  - 개인정보 처리방침 URL
  - 지원 URL
```

---

## 🔧 플랫폼별 코드 작성

### 1. Platform 모듈 활용

```javascript
import { Platform, StyleSheet } from 'react-native';

// 방법 1: Platform.OS
const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
});

// 방법 2: Platform.select
const headerHeight = Platform.select({
  ios: 44,
  android: 56,
});

// 방법 3: 조건부 렌더링
{Platform.OS === 'ios' && <IOSSpecificComponent />}
{Platform.OS === 'android' && <AndroidSpecificComponent />}
```

### 2. 플랫폼별 파일 분리

```
src/
├─ components/
│  ├─ Button.ios.js      // iOS 전용
│  ├─ Button.android.js  // Android 전용
│  └─ Button.js          // 공통 (fallback)
```

**사용:**
```javascript
// 자동으로 플랫폼에 맞는 파일 import
import Button from './components/Button';
```

### 3. Safe Area 처리

```javascript
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        {/* iOS 노치, Android 상태바 자동 처리 */}
        <YourContent />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
```

### 4. 상태바 스타일

```javascript
import { StatusBar } from 'react-native';

function RunningScreen() {
  return (
    <>
      <StatusBar 
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={Platform.OS === 'android' ? '#000' : undefined}
      />
      <View>{/* 컨텐츠 */}</View>
    </>
  );
}
```

### 5. 네비게이션 스타일

```javascript
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function Navigation() {
  return (
    <Stack.Navigator
      screenOptions={{
        // iOS 스타일 헤더
        headerStyle: {
          backgroundColor: Platform.OS === 'ios' ? '#fff' : '#000',
        },
        headerTintColor: Platform.OS === 'ios' ? '#007AFF' : '#fff',
        // iOS는 큰 타이틀
        headerLargeTitle: Platform.OS === 'ios',
      }}
    >
      <Stack.Screen name="Running" component={RunningScreen} />
    </Stack.Navigator>
  );
}
```

### 6. 폰트 처리

```javascript
const styles = StyleSheet.create({
  text: {
    fontFamily: Platform.select({
      ios: 'System', // iOS 시스템 폰트
      android: 'Roboto', // Android 기본 폰트
    }),
    fontSize: Platform.select({
      ios: 17, // iOS 기본 크기
      android: 16, // Android 기본 크기
    }),
  },
});
```

---

## 🎨 iOS 특화 기능

### 1. 햅틱 피드백

```bash
npm install react-native-haptic-feedback
```

```javascript
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

// 다양한 햅틱 타입
ReactNativeHapticFeedback.trigger('impactLight', options);
ReactNativeHapticFeedback.trigger('impactMedium', options);
ReactNativeHapticFeedback.trigger('impactHeavy', options);
ReactNativeHapticFeedback.trigger('notificationSuccess', options);
ReactNativeHapticFeedback.trigger('notificationWarning', options);
ReactNativeHapticFeedback.trigger('notificationError', options);
```

### 2. 3D Touch / Haptic Touch

```javascript
import { TouchableOpacity } from 'react-native';

<TouchableOpacity
  onPress={handlePress}
  onLongPress={handleLongPress} // 길게 누르기
  delayLongPress={500}
>
  <Text>Press Me</Text>
</TouchableOpacity>
```

### 3. SF Symbols (iOS 아이콘)

```bash
npm install react-native-sfsymbols
```

```javascript
import SFSymbol from 'react-native-sfsymbols';

<SFSymbol
  name="figure.run"
  size={24}
  color="#007AFF"
  weight="medium"
/>
```

### 4. iOS 스타일 액션 시트

```javascript
import { ActionSheetIOS } from 'react-native';

const showActionSheet = () => {
  ActionSheetIOS.showActionSheetWithOptions(
    {
      options: ['취소', '사진 촬영', '앨범에서 선택'],
      cancelButtonIndex: 0,
    },
    (buttonIndex) => {
      if (buttonIndex === 1) {
        // 사진 촬영
      } else if (buttonIndex === 2) {
        // 앨범 선택
      }
    }
  );
};
```

### 5. iOS 스타일 알림

```javascript
import { Alert } from 'react-native';

Alert.alert(
  '러닝 종료',
  '정말 러닝을 종료하시겠습니까?',
  [
    {
      text: '취소',
      style: 'cancel',
    },
    {
      text: '종료',
      style: 'destructive',
      onPress: () => stopRunning(),
    },
  ],
  { cancelable: true }
);
```

### 6. 다크 모드 지원

```javascript
import { useColorScheme } from 'react-native';

function ThemedComponent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={{
      backgroundColor: isDark ? '#000' : '#fff',
    }}>
      <Text style={{
        color: isDark ? '#fff' : '#000',
      }}>
        자동 다크 모드
      </Text>
    </View>
  );
}
```

---

## 📦 App Store 배포

### 1. Apple Developer 계정 설정

```
1. https://developer.apple.com 접속
2. Apple ID로 로그인
3. "Enroll" 클릭
4. 개인($99/년) 또는 조직 선택
5. 결제 정보 입력
6. 계정 활성화 대기 (1-2일)
```

### 2. 인증서 및 프로비저닝 프로파일

#### Xcode 자동 관리 (추천)
```
1. Xcode 프로젝트 열기
2. Signing & Capabilities 탭
3. "Automatically manage signing" 체크
4. Team 선택 (Apple Developer 계정)
5. Bundle Identifier 입력
```

#### 수동 관리 (고급)
```
1. developer.apple.com → Certificates, Identifiers & Profiles
2. Certificates 생성
   - Development Certificate
   - Distribution Certificate
3. App ID 등록
   - Bundle ID: com.yourcompany.runningapp
   - Capabilities 설정 (Push Notifications, Background Modes)
4. Provisioning Profile 생성
   - Development Profile
   - Distribution Profile
```

### 3. App Store Connect 설정

```
1. https://appstoreconnect.apple.com 접속
2. "My Apps" → "+" → "New App"
3. 앱 정보 입력:
   - Platform: iOS
   - Name: 러닝 앱 (또는 앱 이름)
   - Primary Language: Korean
   - Bundle ID: com.yourcompany.runningapp
   - SKU: unique-sku-123
```

### 4. 앱 정보 작성

#### 필수 정보
```
□ 앱 이름 (30자 이내)
□ 부제목 (30자 이내)
□ 설명 (4000자 이내)
□ 키워드 (100자 이내, 쉼표로 구분)
□ 지원 URL
□ 마케팅 URL (선택)
□ 개인정보 처리방침 URL (필수)
```

**설명 예시:**
```
러닝을 더 즐겁게! 크루와 함께하는 러닝 앱

주요 기능:
• 정확한 GPS 트래킹으로 러닝 기록
• 백그라운드에서도 안정적인 위치 추적
• 크루를 만들어 함께 러닝
• 코스 공유 및 따라가기
• 상세한 러닝 통계 및 기록
• 실시간 알림으로 크루원과 소통

러닝을 혼자 하기 지루하셨나요?
크루를 만들어 함께 달리고, 기록을 공유하세요!
```

#### 스크린샷 (필수)

**필요한 크기:**
```
iPhone 6.7" (iPhone 15 Pro Max):
- 1290 x 2796 pixels
- 최소 3개, 최대 10개

iPhone 6.5" (iPhone 11 Pro Max):
- 1242 x 2688 pixels

iPhone 5.5" (iPhone 8 Plus):
- 1242 x 2208 pixels
```

**스크린샷 촬영 방법:**
```bash
# iOS Simulator에서 촬영
1. Simulator 실행
2. Device → iPhone 15 Pro Max 선택
3. 앱 실행
4. Cmd + S (스크린샷)
```

**스크린샷 구성 (예시):**
1. 러닝 트래킹 화면
2. 지도 및 경로 화면
3. 크루 목록
4. 러닝 기록 통계
5. 프로필 화면

#### 앱 미리보기 비디오 (선택)

```
- 길이: 15-30초
- 형식: .mov, .mp4, .m4v
- 해상도: 스크린샷과 동일
- 내용: 주요 기능 시연
```

### 5. 버전 정보

```
□ 버전 번호: 1.0.0
□ 빌드 번호: 1
□ 저작권: © 2026 Your Company
□ 연령 등급: 4+ (모든 연령)
□ 카테고리: 
   - Primary: Health & Fitness
   - Secondary: Social Networking
```

### 6. App Privacy (개인정보)

**수집하는 데이터:**
```
□ 위치 정보
  - 목적: 러닝 경로 기록
  - 사용자 추적에 사용: 아니오
  
□ 사용자 ID
  - 목적: 계정 관리
  - 사용자 추적에 사용: 아니오
  
□ 사진/비디오
  - 목적: 프로필 사진
  - 사용자 추적에 사용: 아니오
```

### 7. Release 빌드 생성

#### Xcode에서 Archive
```
1. Xcode 열기
2. Product → Scheme → Edit Scheme
3. Run → Build Configuration → Release
4. Generic iOS Device 선택 (실제 기기 아님)
5. Product → Archive
6. 빌드 완료 대기 (5-10분)
```

#### Archive 업로드
```
1. Organizer 창 열림
2. 생성된 Archive 선택
3. "Distribute App" 클릭
4. "App Store Connect" 선택
5. "Upload" 선택
6. 자동 서명 선택
7. "Upload" 클릭
8. 업로드 완료 대기 (5-10분)
```

### 8. TestFlight 베타 테스트 (선택)

```
1. App Store Connect → TestFlight 탭
2. 업로드된 빌드 확인 (처리 시간: 10-30분)
3. "Export Compliance" 설정
   - 암호화 사용 여부: No (일반적으로)
4. 내부 테스터 추가
   - 이메일 주소 입력
5. 테스터에게 TestFlight 앱 설치 안내
6. 피드백 수집
```

### 9. 심사 제출

```
1. App Store Connect → App Store 탭
2. "+" → "iOS App" → 버전 번호 입력
3. 빌드 선택
4. 앱 정보 최종 확인
5. "Submit for Review" 클릭
6. 심사 질문 답변:
   - 데모 계정 필요 여부
   - 특별한 설정 필요 여부
   - 연락처 정보
7. "Submit" 클릭
```

### 10. 심사 대기 및 대응

**심사 기간:**
```
- 평균: 1-2주
- 빠르면: 24시간
- 느리면: 3-4주
```

**심사 상태:**
```
1. Waiting for Review (심사 대기)
2. In Review (심사 중)
3. Pending Developer Release (승인, 출시 대기)
4. Ready for Sale (출시 완료)

또는

Rejected (거부) → 수정 후 재제출
```

**거부 사유 대응:**
```
일반적인 거부 사유:
1. 버그 또는 크래시
   → 수정 후 재제출
   
2. 불완전한 기능
   → 기능 완성 후 재제출
   
3. 개인정보 처리방침 누락
   → URL 추가 후 재제출
   
4. 스크린샷 불일치
   → 실제 앱과 일치하는 스크린샷으로 교체
   
5. WebView 앱 (단순 웹사이트 래핑)
   → 충분한 네이티브 기능 추가 강조
```

---

## 💻 Mac 없이 개발하기

### 옵션 1: MacinCloud (추천 ⭐)

**서비스:** https://www.macincloud.com

**가격:**
```
- Pay As You Go: $1/시간
- Monthly: $30-50/월
- Dedicated: $100+/월
```

**사용 방법:**
```
1. MacinCloud 계정 생성
2. Mac 서버 대여 (macOS 버전 선택)
3. 원격 데스크톱으로 접속
4. Xcode 설치 및 개발
5. 빌드 및 업로드
```

**장점:**
- ✅ 실제 Mac 환경
- ✅ Xcode 모든 기능 사용 가능
- ✅ 필요할 때만 사용 (시간당 과금)

**단점:**
- ⚠️ 인터넷 속도에 따라 느릴 수 있음
- ⚠️ 비용 발생

### 옵션 2: Expo EAS Build

**서비스:** https://expo.dev/eas

**가격:**
```
- Free: 월 30빌드
- Production: $29/월 (무제한)
```

**사용 방법:**
```bash
# EAS CLI 설치
npm install -g eas-cli

# 로그인
eas login

# iOS 빌드 (클라우드에서)
eas build --platform ios

# 빌드 완료 후 다운로드
# App Store Connect에 수동 업로드
```

**장점:**
- ✅ Mac 불필요
- ✅ 자동 빌드
- ✅ 간편한 설정

**단점:**
- ⚠️ Expo 프로젝트만 가능 (또는 마이그레이션 필요)
- ⚠️ 네이티브 모듈 제한적

### 옵션 3: GitHub Actions (무료)

**설정:**
```yaml
# .github/workflows/ios-build.yml
name: iOS Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: |
          cd ios
          pod install
      
      - name: Build iOS
        run: |
          xcodebuild -workspace ios/RunningApp.xcworkspace \
            -scheme RunningApp \
            -configuration Release \
            archive -archivePath build/RunningApp.xcarchive
      
      - name: Export IPA
        run: |
          xcodebuild -exportArchive \
            -archivePath build/RunningApp.xcarchive \
            -exportPath build \
            -exportOptionsPlist ios/ExportOptions.plist
```

**장점:**
- ✅ 완전 무료
- ✅ 자동화 가능
- ✅ Mac 불필요

**단점:**
- ⚠️ 설정 복잡
- ⚠️ 디버깅 어려움

### 옵션 4: 지인 Mac 빌림

**방법:**
```
1. Mac 소유자 찾기 (친구, 가족, 카페)
2. 개발 환경 설정 (1-2시간)
3. 빌드 및 업로드 (30분-1시간)
4. 필요할 때마다 반복
```

**장점:**
- ✅ 무료
- ✅ 실제 Mac 환경

**단점:**
- ⚠️ 불편함
- ⚠️ 자주 사용 어려움

### 추천 전략

```
개발 초기:
→ MacinCloud (시간당 과금)
→ 환경 설정 및 첫 빌드

개발 중:
→ Windows에서 개발 (Android 테스트)
→ 주 1회 MacinCloud로 iOS 빌드 테스트

배포 시:
→ MacinCloud 또는 지인 Mac
→ Release 빌드 및 업로드

장기 운영:
→ Mac Mini 구매 고려 (중고 50-80만원)
→ 또는 Expo EAS Build 구독
```

---

## 💰 비용 분석

### 필수 비용

| 항목 | 비용 | 주기 |
|------|------|------|
| **Apple Developer** | $99 | 연간 |
| **Mac (구매)** | 100-300만원 | 1회 |
| **Mac (대여)** | $30-50 | 월간 |
| **Expo EAS** | $29 | 월간 (선택) |

### 시나리오별 총 비용

#### 시나리오 1: Mac 구매
```
초기 비용:
- Mac Mini (중고): 80만원
- Apple Developer: 13만원
총: 93만원

연간 비용:
- Apple Developer: 13만원/년
```

#### 시나리오 2: MacinCloud
```
초기 비용:
- Apple Developer: 13만원
- MacinCloud (설정 10시간): $10
총: 14.3만원

월간 비용:
- MacinCloud (월 20시간): $20 (2.6만원)
- Apple Developer: 1.1만원/월
총: 3.7만원/월

연간 비용:
- 약 44만원
```

#### 시나리오 3: Expo EAS
```
초기 비용:
- Apple Developer: 13만원
총: 13만원

월간 비용:
- Expo EAS: $29 (3.8만원)
- Apple Developer: 1.1만원/월
총: 4.9만원/월

연간 비용:
- 약 59만원
```

### 비용 최소화 전략

```
1. 개발 초기 (1-2주):
   → MacinCloud 시간당 과금 ($10-20)
   
2. 베타 테스트 (2-4주):
   → 지인 Mac 빌림 (무료)
   
3. 정식 출시:
   → MacinCloud 1회 ($1-2)
   
4. 유지보수:
   → 필요할 때만 MacinCloud
   
총 비용: Apple Developer $99 + MacinCloud $30-50
= 약 17-20만원 (1년차)
```

---

## ⚠️ 리스크 관리

### 기술적 리스크

#### 1. 백그라운드 위치 추적 제한
**리스크:** iOS가 백그라운드 앱 강제 종료  
**확률:** 중간  
**영향:** 높음

**대응 방안:**
```javascript
// Foreground Service 사용
BackgroundGeolocation.configure({
  preventSuspend: true,
  heartbeatInterval: 60,
  activityType: BackgroundGeolocation.ACTIVITY_TYPE_FITNESS,
});

// 사용자에게 안내
Alert.alert(
  '백그라운드 권한',
  '러닝 중에는 앱을 종료하지 마세요. 백그라운드에서 계속 기록됩니다.'
);
```

#### 2. GPS 정확도 문제
**리스크:** 실내/터널에서 GPS 신호 약함  
**확률:** 높음  
**영향:** 중간

**대응 방안:**
```javascript
// 정확도 필터링
const isAccurate = location.coords.accuracy < 20;
if (isAccurate) {
  addLocationToRoute(location);
}

// 사용자에게 표시
<Text>GPS 정확도: {location.coords.accuracy.toFixed(1)}m</Text>
```

#### 3. 메모리 부족
**리스크:** 장시간 러닝 시 메모리 부족  
**확률:** 낮음  
**영향:** 높음

**대응 방안:**
```javascript
// 주기적으로 서버에 저장
useEffect(() => {
  const interval = setInterval(() => {
    if (route.length > 100) {
      saveToServer(route);
      setRoute([]); // 메모리 해제
    }
  }, 60000); // 1분마다
  
  return () => clearInterval(interval);
}, [route]);
```

### 일정 리스크

#### 1. 예상보다 긴 개발 시간
**리스크:** 2주 → 4주 소요  
**확률:** 중간  
**영향:** 중간

**대응 방안:**
- MVP 기능만 먼저 구현
- 부가 기능은 v1.1로 연기
- 주간 진행 상황 체크

#### 2. App Store 심사 거부
**리스크:** 심사 거부로 출시 지연  
**확률:** 중간  
**영향:** 높음

**대응 방안:**
- TestFlight 베타 테스트 충분히
- 심사 가이드라인 사전 검토
- 충분한 네이티브 기능 강조
- 개인정보 처리방침 명확히

#### 3. 플랫폼별 버그
**리스크:** iOS에서만 발생하는 버그  
**확률:** 높음  
**영향:** 중간

**대응 방안:**
- 실제 iPhone으로 충분한 테스트
- 다양한 iOS 버전 테스트
- Crashlytics 등 에러 추적 도구 사용

### 비즈니스 리스크

#### 1. 사용자 분산
**리스크:** Android/iOS 사용자 분산으로 커뮤니티 약화  
**확률:** 낮음  
**영향:** 중간

**대응 방안:**
- 백엔드는 동일하므로 데이터 공유
- 크로스 플랫폼 크루 기능
- 웹 버전도 병행 운영

#### 2. 유지보수 부담
**리스크:** 두 플랫폼 유지보수 부담 증가  
**확률:** 높음  
**영향:** 중간

**대응 방안:**
- 코드 최대한 공유 (80-90%)
- 플랫폼별 코드 최소화
- 자동화된 테스트 구축

---

## 📊 성공 기준

### 기능적 성공

```
□ GPS 정확도 10m 이내
□ 백그라운드 30분 이상 안정 동작
□ 지도 렌더링 60 FPS
□ WebView 정상 동작
□ 푸시 알림 정상 수신
□ 카카오 로그인 정상 동작
□ Android와 동일한 기능
```

### 성능 목표

```
□ 앱 시작 시간 < 3초
□ 메모리 사용 < 200MB
□ 배터리 소모: 1시간 러닝에 10-15%
□ 크래시율 < 1%
□ ANR (App Not Responding) 0건
```

### 사용자 경험

```
□ iOS 디자인 가이드라인 준수
□ 네이티브 느낌의 애니메이션
□ 직관적인 UI/UX
□ 빠른 응답 속도
□ 안정적인 동작
```

### 비즈니스 목표

```
□ App Store 출시 완료
□ 심사 통과 (거부 없이)
□ 사용자 평점 4.0 이상
□ Android 대비 기능 동등
□ 크로스 플랫폼 데이터 공유
```

---

## 📝 체크리스트

### 개발 전 준비

```
□ Android 앱 완성 및 검증
□ Mac 준비 (구매/대여/빌림)
□ Apple Developer 계정 생성 및 결제
□ Xcode 설치
□ CocoaPods 설치
□ Git 저장소 접근 (Mac에서)
```

### Week 1: 환경 설정

```
□ iOS 프로젝트 빌드 성공
□ Info.plist 권한 설정 완료
□ Background Modes 설정
□ Google Maps API 키 설정
□ Firebase iOS 앱 등록
□ Safe Area 처리
□ 플랫폼별 스타일 조정
```

### Week 2: 테스트 및 배포

```
□ GPS 트래킹 테스트 (실제 기기)
□ 백그라운드 동작 테스트
□ 지도 렌더링 테스트
□ WebView 통합 테스트
□ 푸시 알림 테스트
□ UI/UX 최적화
□ 앱 아이콘 및 스플래시
□ Release 빌드 생성
□ App Store Connect 설정
□ 심사 제출
```

### 출시 후

```
□ 사용자 피드백 모니터링
□ 크래시 리포트 확인
□ 성능 지표 추적
□ 버그 수정
□ 기능 개선
□ 정기 업데이트
```

---

## 📚 참고 자료

### 공식 문서

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [React Native iOS Guide](https://reactnative.dev/docs/platform-specific-code)

### 유용한 도구

- [App Icon Generator](https://appicon.co/) - 앱 아이콘 생성
- [LaunchScreen Generator](https://ioslaunchscreen.com/) - 스플래시 생성
- [TestFlight](https://developer.apple.com/testflight/) - 베타 테스트
- [Fastlane](https://fastlane.tools/) - 배포 자동화

### 커뮤니티

- [React Native Community Discord](https://discord.gg/react-native)
- [Stack Overflow - iOS](https://stackoverflow.com/questions/tagged/ios)
- [Apple Developer Forums](https://developer.apple.com/forums/)

---

## 🎯 최종 요약

### iOS 개발은 Android의 연장선

```
Android 개발 (7주)
  ↓
코드 80-90% 재사용
  ↓
iOS 전용 설정 (1-2주)
  ↓
App Store 출시
```

### 핵심 포인트

1. **Mac 필수** - 구매, 대여, 또는 클라우드
2. **Apple Developer $99/년** - 필수 비용
3. **코드 재사용** - 대부분의 로직 동일
4. **플랫폼 차이** - UI/권한/백그라운드 조정 필요
5. **심사 까다로움** - 충분한 준비 필요

### 예상 일정

```
Week 1: 환경 설정 및 기본 빌드
Week 2: 테스트 및 배포 준비
Week 3-4: 심사 대기 및 출시
```

### 예상 비용

```
최소: Apple Developer $99 + MacinCloud $30-50
     = 약 17-20만원

권장: Mac Mini (중고) 80만원 + Apple Developer $99
     = 약 93만원 (1회)
```

---

**이 문서는 iOS 개발 진행에 따라 지속적으로 업데이트됩니다.**

**Android 앱 완성 후, 이 문서를 참고하여 iOS 개발을 시작하세요!** 🚀
