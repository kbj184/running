# 하이브리드 앱 전환 계획서

> **작성일**: 2026-01-08  
> **목적**: React 웹앱을 React Native 하이브리드 앱으로 전환  
> **전략**: 러닝 핵심 기능은 네이티브, 나머지는 WebView 활용

---

## 📋 목차

1. [전환 배경](#전환-배경)
2. [아키텍처 설계](#아키텍처-설계)
3. [기술 스택](#기술-스택)
4. [개발 로드맵](#개발-로드맵)
5. [상세 작업 계획](#상세-작업-계획)
6. [코드 재사용 전략](#코드-재사용-전략)
7. [성능 목표](#성능-목표)
8. [리스크 관리](#리스크-관리)

---

## 🎯 전환 배경

### 현재 상태
- **프론트엔드**: React 웹앱 (PWA)
- **백엔드**: Spring Boot + MySQL
- **배포**: 웹 서버 (브라우저 접근)

### 전환 이유
1. **GPS 정확도 향상**: 네이티브 GPS API 사용
2. **백그라운드 트래킹**: 화면 꺼져도 러닝 기록 가능
3. **지도 성능 개선**: 네이티브 지도 렌더링
4. **앱스토어 배포**: Google Play Store 진입
5. **푸시 알림 강화**: 네이티브 FCM 통합

### 왜 하이브리드인가?
- ✅ **개발 시간 단축**: 기존 코드 70-80% 재사용
- ✅ **성능 확보**: 중요한 부분만 네이티브로
- ✅ **유지보수 용이**: 웹 부분은 서버만 업데이트
- ✅ **점진적 전환**: 필요한 부분만 네이티브화

---

## 🏗️ 아키텍처 설계

### 전체 구조

```
React Native App
│
├─ 네이티브 화면 (새로 개발)
│  ├─ SplashScreen (스플래시)
│  ├─ LoginScreen (로그인)
│  ├─ RunningScreen (러닝 트래킹)
│  ├─ FollowCourseRunningScreen (코스 따라가기)
│  └─ ResultScreen (러닝 결과)
│
├─ WebView 화면 (기존 코드 재사용)
│  ├─ CrewTab (크루 전체)
│  │  ├─ 크루 목록
│  │  ├─ 크루 생성
│  │  ├─ 크루 상세
│  │  ├─ 게시판
│  │  └─ 멤버 관리
│  │
│  ├─ MyTab (마이 페이지)
│  │  ├─ 프로필
│  │  ├─ 활동 기록
│  │  ├─ 통계
│  │  └─ 설정
│  │
│  └─ CourseTab (코스)
│     ├─ 코스 목록
│     ├─ 코스 상세
│     └─ 코스 생성
│
└─ 공통 컴포넌트
   ├─ BottomNavigation (네이티브)
   ├─ MainHeader (네이티브)
   └─ Native ↔ Web Bridge
```

### 화면별 구현 방식

| 화면 | 구현 방식 | 이유 |
|------|----------|------|
| **스플래시** | 네이티브 | 앱 시작 화면 |
| **로그인** | 네이티브 | 카카오 SDK 연동 |
| **러닝 트래킹** | 네이티브 ⭐ | GPS, 백그라운드, 지도 성능 |
| **코스 따라가기** | 네이티브 ⭐ | 실시간 위치 추적 |
| **러닝 결과** | 네이티브 | 지도 렌더링 성능 |
| **크루 탭** | WebView | 복잡한 UI, 자주 업데이트 |
| **MY 탭** | WebView | 통계, 차트 등 |
| **코스 탭** | WebView | 목록, 상세 페이지 |
| **설정** | WebView | 간단한 폼 |

---

## 🛠️ 기술 스택

### React Native 앱

```json
{
  "core": {
    "react-native": "^0.73.0",
    "react": "^18.2.0",
    "react-navigation": "^6.0"
  },
  "location": {
    "@react-native-community/geolocation": "^3.0",
    "react-native-background-geolocation": "^4.0",
    "react-native-geolocation-service": "^5.3"
  },
  "maps": {
    "react-native-maps": "^1.10",
    "react-native-google-maps-directions": "^1.9"
  },
  "webview": {
    "react-native-webview": "^13.0"
  },
  "push": {
    "@react-native-firebase/messaging": "^19.0",
    "@react-native-firebase/app": "^19.0"
  },
  "auth": {
    "@react-native-seoul/kakao-login": "^5.0"
  },
  "storage": {
    "@react-native-async-storage/async-storage": "^1.21"
  },
  "ui": {
    "react-native-vector-icons": "^10.0",
    "react-native-linear-gradient": "^2.8"
  }
}
```

### 백엔드 (변경 없음)
- Spring Boot 3.x
- MySQL 8.0
- Firebase Admin SDK
- JWT 인증

### 웹 (WebView용, 기존 유지)
- React 18
- Google Maps JavaScript API
- Axios
- 기존 모든 컴포넌트

---

## 📅 개발 로드맵

### Phase 0: 준비 단계 (현재)
**기간**: 웹 완성까지 (2-3주)

```
□ 웹 버전 핵심 기능 완성
□ 버그 수정 및 안정화
□ PWA 설정 완료
□ 베타 테스트 진행
□ 사용자 피드백 수집
□ 하이브리드 전환 최종 결정
```

### Phase 1: 환경 설정 (1주)
**Week 1**: 개발 환경 구축

```
Day 1-2: React Native 프로젝트 생성
□ npx react-native init RunningApp
□ Android Studio 설치 및 설정
□ 에뮬레이터 설정
□ 실제 기기 연결 테스트

Day 3-4: 필수 라이브러리 설치
□ React Navigation 설정
□ react-native-maps 설치 및 Google Maps API 키 설정
□ react-native-webview 설치
□ Geolocation 라이브러리 설치
□ Firebase 설정 (FCM)

Day 5-7: 기본 구조 구축
□ 네비게이션 구조 설계
□ 폴더 구조 정리
□ 공통 스타일 시스템 구축
□ 환경 변수 설정 (.env)
```

### Phase 2: 네이티브 핵심 기능 개발 (2주)
**Week 2-3**: 러닝 트래킹 기능

```
Week 2: RunningScreen 개발
□ GPS 위치 추적 구현
  - 실시간 위치 수집
  - 정확도 필터링
  - 거리/속도 계산
□ 지도 렌더링
  - React Native Maps 통합
  - 사용자 위치 표시
  - 실시간 경로 그리기 (Polyline)
□ 러닝 데이터 수집
  - 시간, 거리, 속도, 칼로리
  - 고도, 상승/하강
□ UI 구현
  - 러닝 통계 표시
  - 일시정지/재개/종료 버튼
  - 속도별 색상 표시

Week 3: 백그라운드 트래킹 & 코스 따라가기
□ 백그라운드 위치 추적
  - react-native-background-geolocation 설정
  - 백그라운드 권한 요청
  - 배터리 최적화
□ FollowCourseRunningScreen 개발
  - 코스 데이터 로드
  - 경로 이탈 감지
  - 안내 알림
□ ResultScreen 개발
  - 러닝 결과 지도 표시
  - 통계 요약
  - 공유 기능
```

### Phase 3: WebView 통합 (1주)
**Week 4**: 기존 웹앱 통합

```
Day 1-2: WebView 기본 설정
□ WebView 컴포넌트 생성
  - CrewWebView
  - MyWebView
  - CourseWebView
□ 웹앱 URL 설정 (환경별 분리)
□ 로딩 인디케이터 추가

Day 3-5: Native ↔ Web 브릿지
□ 메시지 통신 구현
  - 네이티브 → 웹: 사용자 정보, 토큰 전달
  - 웹 → 네이티브: 러닝 시작, 알림 등
□ 인증 토큰 공유
  - AsyncStorage에 JWT 저장
  - WebView에 토큰 주입
□ 딥링크 처리
  - 웹에서 네이티브 화면 호출

Day 6-7: 네비게이션 통합
□ BottomNavigation 구현 (네이티브)
□ 탭 전환 로직
□ 뒤로가기 처리
```

### Phase 4: 인증 & 푸시 (1주)
**Week 5**: 로그인 및 알림

```
Day 1-3: 카카오 로그인
□ @react-native-seoul/kakao-login 설정
□ LoginScreen 개발
□ 토큰 저장 및 관리
□ 자동 로그인 처리

Day 4-7: FCM 푸시 알림
□ Firebase 프로젝트 설정
□ FCM 토큰 발급 및 서버 전송
□ 포그라운드 알림 처리
□ 백그라운드 알림 처리
□ 알림 클릭 시 화면 이동
```

### Phase 5: 테스트 & 최적화 (1주)
**Week 6**: 버그 수정 및 성능 개선

```
Day 1-3: 기능 테스트
□ 러닝 트래킹 정확도 테스트
□ 백그라운드 동작 테스트
□ WebView 통신 테스트
□ 메모리 누수 체크

Day 4-5: 성능 최적화
□ 지도 렌더링 최적화
□ 배터리 소모 최적화
□ 앱 크기 최적화
□ 로딩 속도 개선

Day 6-7: UI/UX 개선
□ 애니메이션 추가
□ 에러 처리 개선
□ 로딩 상태 개선
□ 접근성 개선
```

### Phase 6: 배포 준비 (1주)
**Week 7**: 릴리스 준비

```
Day 1-3: 앱 설정
□ 앱 아이콘 제작
□ 스플래시 스크린 제작
□ 앱 이름, 패키지명 설정
□ 버전 관리 설정

Day 4-5: 빌드 설정
□ ProGuard 설정 (코드 난독화)
□ 서명 키 생성
□ Release 빌드 생성
□ APK/AAB 파일 생성

Day 6-7: Google Play Console
□ 개발자 계정 생성
□ 앱 등록
□ 스크린샷 및 설명 작성
□ 내부 테스트 트랙 배포
```

---

## 📝 상세 작업 계획

### 1. RunningScreen 구현 (핵심)

#### 파일 구조
```
src/
├─ screens/
│  └─ native/
│     ├─ RunningScreen.js ⭐
│     ├─ FollowCourseRunningScreen.js ⭐
│     └─ ResultScreen.js ⭐
├─ services/
│  ├─ LocationService.js (GPS 로직)
│  ├─ RunningCalculator.js (거리/속도 계산)
│  └─ BackgroundTracker.js (백그라운드)
├─ components/
│  └─ running/
│     ├─ RunningMap.js (지도 컴포넌트)
│     ├─ RunningStats.js (통계 표시)
│     └─ RunningControls.js (버튼)
└─ utils/
   ├─ gpsUtils.js
   └─ mapUtils.js
```

#### RunningScreen.js 핵심 로직

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import BackgroundGeolocation from 'react-native-background-geolocation';

const RunningScreen = () => {
  // 상태 관리
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [route, setRoute] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // 러닝 데이터
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [calories, setCalories] = useState(0);

  // 백그라운드 위치 추적 설정
  useEffect(() => {
    BackgroundGeolocation.configure({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10, // 10m마다 업데이트
      stopOnTerminate: false,
      startOnBoot: true,
      debug: false,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
    });

    BackgroundGeolocation.on('location', onLocationUpdate);
    
    return () => {
      BackgroundGeolocation.removeAllListeners();
    };
  }, []);

  // 위치 업데이트 핸들러
  const onLocationUpdate = (location) => {
    const newPoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
      speed: location.coords.speed,
      altitude: location.coords.altitude,
    };

    setCurrentLocation(newPoint);
    
    if (isRunning && !isPaused) {
      setRoute(prev => [...prev, newPoint]);
      calculateStats(newPoint);
    }
  };

  // 통계 계산
  const calculateStats = (newPoint) => {
    // 거리 계산 (Haversine formula)
    if (route.length > 0) {
      const lastPoint = route[route.length - 1];
      const dist = calculateDistance(lastPoint, newPoint);
      setDistance(prev => prev + dist);
    }
    
    // 속도, 칼로리 등 계산
    // ...
  };

  // 러닝 시작
  const startRunning = () => {
    setIsRunning(true);
    BackgroundGeolocation.start();
  };

  // 러닝 일시정지
  const pauseRunning = () => {
    setIsPaused(true);
  };

  // 러닝 종료
  const stopRunning = async () => {
    setIsRunning(false);
    BackgroundGeolocation.stop();
    
    // 서버에 데이터 저장
    await saveRunningSession({
      route,
      distance,
      duration,
      calories,
      // ...
    });
    
    // ResultScreen으로 이동
  };

  return (
    <View style={styles.container}>
      {/* 지도 */}
      <MapView
        style={styles.map}
        showsUserLocation
        followsUserLocation
        region={{
          latitude: currentLocation?.latitude || 37.5665,
          longitude: currentLocation?.longitude || 126.9780,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* 경로 그리기 */}
        <Polyline
          coordinates={route}
          strokeColor="#FF0000"
          strokeWidth={4}
        />
      </MapView>

      {/* 통계 표시 */}
      <View style={styles.statsContainer}>
        <Text style={styles.stat}>{distance.toFixed(2)} km</Text>
        <Text style={styles.stat}>{formatDuration(duration)}</Text>
        <Text style={styles.stat}>{speed.toFixed(1)} km/h</Text>
      </View>

      {/* 컨트롤 버튼 */}
      <View style={styles.controls}>
        {!isRunning ? (
          <Button title="시작" onPress={startRunning} />
        ) : (
          <>
            <Button 
              title={isPaused ? "재개" : "일시정지"} 
              onPress={() => setIsPaused(!isPaused)} 
            />
            <Button title="종료" onPress={stopRunning} />
          </>
        )}
      </View>
    </View>
  );
};
```

### 2. WebView 통합

#### CrewWebView.js

```javascript
import React, { useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

const CrewWebView = ({ navigation }) => {
  const webViewRef = useRef(null);

  useEffect(() => {
    injectUserData();
  }, []);

  // 사용자 데이터 주입
  const injectUserData = async () => {
    const token = await AsyncStorage.getItem('jwt_token');
    const userId = await AsyncStorage.getItem('user_id');

    const script = `
      window.localStorage.setItem('jwt_token', '${token}');
      window.localStorage.setItem('user_id', '${userId}');
      window.dispatchEvent(new Event('native-login'));
    `;

    webViewRef.current?.injectJavaScript(script);
  };

  // 웹 → 네이티브 메시지 처리
  const handleMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);

    switch (data.type) {
      case 'START_RUNNING':
        navigation.navigate('Running');
        break;
      case 'OPEN_PROFILE':
        navigation.navigate('Profile', { userId: data.userId });
        break;
      // ...
    }
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: `${Config.WEB_APP_URL}/crew` }}
      onMessage={handleMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      renderLoading={() => <LoadingIndicator />}
    />
  );
};
```

### 3. 네비게이션 구조

#### App.js

```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 네이티브 화면
import RunningScreen from './screens/native/RunningScreen';
import FollowCourseRunningScreen from './screens/native/FollowCourseRunningScreen';
import ResultScreen from './screens/native/ResultScreen';
import LoginScreen from './screens/native/LoginScreen';

// WebView 화면
import CrewWebView from './screens/webview/CrewWebView';
import MyWebView from './screens/webview/MyWebView';
import CourseWebView from './screens/webview/CourseWebView';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 메인 탭 네비게이터
const MainTabs = () => (
  <Tab.Navigator>
    <Tab.Screen 
      name="Crew" 
      component={CrewWebView}
      options={{ title: '크루' }}
    />
    <Tab.Screen 
      name="Running" 
      component={RunningScreen}
      options={{ title: '러닝' }}
    />
    <Tab.Screen 
      name="My" 
      component={MyWebView}
      options={{ title: 'MY' }}
    />
  </Tab.Navigator>
);

// 루트 네비게이터
const App = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Main" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="FollowCourse" 
        component={FollowCourseRunningScreen}
      />
      <Stack.Screen 
        name="Result" 
        component={ResultScreen}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

export default App;
```

---

## 🔄 코드 재사용 전략

### 재사용 가능 (약 75%)

#### 1. 백엔드 (100% 재사용)
```
✅ Spring Boot 전체
✅ REST API 엔드포인트
✅ 데이터베이스 스키마
✅ 비즈니스 로직
✅ FCM 서버 로직
```

#### 2. 웹 프론트엔드 (80% 재사용)
```
✅ 크루 관련 모든 컴포넌트
✅ 프로필 페이지
✅ 게시판, 댓글
✅ 통계 차트
✅ 설정 화면
✅ API 통신 로직
✅ 상태 관리 로직
```

#### 3. 비즈니스 로직 (90% 재사용)
```javascript
// 거리 계산 로직 - 그대로 사용 가능
export const calculateDistance = (point1, point2) => {
  const R = 6371; // km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  // ...
  return distance;
};

// 속도 계산 - 그대로 사용 가능
export const calculateSpeed = (distance, time) => {
  return (distance / time) * 3600; // km/h
};
```

### 새로 작성 필요 (약 25%)

#### 1. 네이티브 화면 UI
```
❌ RunningScreen.js (새로 작성)
❌ FollowCourseRunningScreen.js (새로 작성)
❌ ResultScreen.js (새로 작성)
❌ LoginScreen.js (새로 작성)
```

#### 2. 네이티브 서비스
```
❌ LocationService.js (GPS 로직)
❌ BackgroundTracker.js (백그라운드)
❌ NativeBridge.js (웹 통신)
```

#### 3. 스타일 변환
```
CSS → StyleSheet 변환 필요
(하지만 로직은 동일)
```

---

## 🎯 성능 목표

### GPS 정확도
- **목표**: 평균 5m 이내 오차
- **측정**: 실제 거리와 비교
- **개선**: 정확도 필터링, Kalman 필터 적용

### 백그라운드 동작
- **목표**: 화면 꺼진 상태에서 30분 이상 안정적 추적
- **측정**: 배터리 소모율, 위치 업데이트 빈도
- **개선**: 배터리 최적화 설정

### 지도 렌더링
- **목표**: 60 FPS 유지
- **측정**: React DevTools Profiler
- **개선**: Polyline 최적화, 메모이제이션

### 앱 크기
- **목표**: APK 50MB 이하
- **측정**: 빌드 결과 파일 크기
- **개선**: ProGuard, 불필요한 리소스 제거

### 메모리 사용
- **목표**: 평균 150MB 이하
- **측정**: Android Profiler
- **개선**: 메모리 누수 제거, 이미지 최적화

---

## ⚠️ 리스크 관리

### 기술적 리스크

#### 1. GPS 정확도 문제
**리스크**: 실내/터널에서 GPS 신호 약함  
**대응**: 
- 정확도 임계값 설정 (accuracy < 20m만 사용)
- 마지막 알려진 위치 활용
- 사용자에게 GPS 상태 표시

#### 2. 백그라운드 제한
**리스크**: Android 배터리 최적화로 백그라운드 중단  
**대응**:
- Foreground Service 사용
- 배터리 최적화 제외 요청
- 사용자 가이드 제공

#### 3. WebView 통신 오류
**리스크**: 네이티브 ↔ 웹 메시지 전달 실패  
**대응**:
- 재시도 로직 구현
- 타임아웃 설정
- 에러 로깅 및 모니터링

#### 4. 플랫폼별 차이
**리스크**: Android 버전별 동작 차이  
**대응**:
- 최소 지원 버전: Android 8.0 (API 26)
- 버전별 분기 처리
- 다양한 기기에서 테스트

### 일정 리스크

#### 1. 예상보다 긴 개발 시간
**리스크**: 7주 → 10주 소요 가능  
**대응**:
- 주간 진행 상황 체크
- MVP 기능 우선 개발
- 부가 기능은 v2로 연기

#### 2. 테스트 기간 부족
**리스크**: 버그 많은 상태로 출시  
**대응**:
- 내부 테스트 트랙 활용
- 베타 테스터 모집
- 충분한 테스트 기간 확보 (최소 2주)

### 비즈니스 리스크

#### 1. 앱스토어 심사 거부
**리스크**: Google Play 정책 위반  
**대응**:
- 정책 사전 검토
- 충분한 네이티브 기능 포함
- 개인정보 처리방침 명확히

#### 2. 사용자 이탈
**리스크**: 웹 → 앱 전환 시 사용자 혼란  
**대응**:
- 웹 버전 병행 운영
- 앱 설치 유도 캠페인
- 마이그레이션 가이드 제공

---

## 📊 진행 상황 체크리스트

### Phase 0: 준비 (현재)
- [ ] 웹 버전 핵심 기능 완성
- [ ] 버그 수정 완료
- [ ] PWA 설정
- [ ] 베타 테스트
- [ ] 하이브리드 전환 최종 결정

### Phase 1: 환경 설정
- [ ] React Native 프로젝트 생성
- [ ] Android Studio 설치
- [ ] 필수 라이브러리 설치
- [ ] 기본 네비게이션 구조
- [ ] 환경 변수 설정

### Phase 2: 네이티브 핵심 기능
- [ ] RunningScreen GPS 트래킹
- [ ] 지도 렌더링
- [ ] 백그라운드 위치 추적
- [ ] FollowCourseRunningScreen
- [ ] ResultScreen

### Phase 3: WebView 통합
- [ ] WebView 컴포넌트 생성
- [ ] Native ↔ Web 브릿지
- [ ] 인증 토큰 공유
- [ ] 네비게이션 통합

### Phase 4: 인증 & 푸시
- [ ] 카카오 로그인
- [ ] FCM 푸시 알림
- [ ] 토큰 관리
- [ ] 알림 처리

### Phase 5: 테스트 & 최적화
- [ ] 기능 테스트
- [ ] 성능 최적화
- [ ] UI/UX 개선
- [ ] 버그 수정

### Phase 6: 배포
- [ ] 앱 아이콘/스플래시
- [ ] Release 빌드
- [ ] Google Play Console 등록
- [ ] 내부 테스트 배포

---

## 📚 참고 자료

### 공식 문서
- [React Native 공식 문서](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Background Geolocation](https://transistorsoft.github.io/react-native-background-geolocation/)

### 튜토리얼
- [React Native GPS Tracking App Tutorial](https://www.youtube.com/results?search_query=react+native+gps+tracking)
- [WebView Integration Guide](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Guide.md)

### 커뮤니티
- [React Native Community Discord](https://discord.gg/react-native)
- [Stack Overflow - React Native](https://stackoverflow.com/questions/tagged/react-native)

---

## 🎯 성공 기준

### 기능적 성공
- ✅ GPS 정확도 10m 이내
- ✅ 백그라운드 30분 이상 안정 동작
- ✅ 지도 렌더링 60 FPS
- ✅ WebView 화면 정상 동작
- ✅ 푸시 알림 정상 수신

### 비기능적 성공
- ✅ 앱 크기 50MB 이하
- ✅ 메모리 사용 150MB 이하
- ✅ 배터리 소모 합리적 수준
- ✅ 크래시율 1% 이하

### 비즈니스 성공
- ✅ Google Play Store 출시
- ✅ 사용자 평점 4.0 이상
- ✅ 웹 대비 사용자 만족도 향상
- ✅ 월간 활성 사용자 증가

---

## 📞 연락처 및 리소스

### 개발 환경
- **프로젝트 경로**: `c:\react\running`
- **백엔드 URL**: (환경별 설정)
- **웹앱 URL**: (환경별 설정)

### API 키 (환경 변수로 관리)
- Google Maps API Key
- Kakao REST API Key
- Firebase Server Key

### 버전 관리
- **Git Repository**: (저장소 URL)
- **브랜치 전략**: 
  - `main`: 웹 버전
  - `hybrid-dev`: 하이브리드 개발
  - `release`: 배포 버전

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-01-08 | 1.0 | 초안 작성 |

---

**이 문서는 프로젝트 진행에 따라 지속적으로 업데이트됩니다.**
