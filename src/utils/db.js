// IndexedDB 유틸리티
const DB_NAME = 'RunningTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'runningSessions';

// DB 초기화
export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('❌ IndexedDB 초기화 실패:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            console.log('✅ IndexedDB 연결 성공:', DB_NAME);
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            console.log('🔧 IndexedDB 업그레이드 시작...');
            const db = event.target.result;

            // 세션 저장소 생성
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                console.log('📦 새로운 Object Store 생성:', STORE_NAME);
                const objectStore = db.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true
                });

                // 인덱스 생성
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                objectStore.createIndex('sessionId', 'sessionId', { unique: false });
                console.log('🔍 인덱스 생성 완료: timestamp, sessionId');
            }
            console.log('✅ IndexedDB 업그레이드 완료');
        };
    });
};

// 러닝 데이터 저장
export const saveRunningData = async (data) => {
    const db = await initDB();

    // 저장 전 데이터 로그
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 IndexedDB 저장 시작');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 세션 ID:', data.sessionId);
    console.log('⏰ 타임스탬프:', new Date(data.timestamp).toLocaleString('ko-KR'));
    console.log('📍 위치:', data.position ? `[${data.position[0].toFixed(6)}, ${data.position[1].toFixed(6)}]` : 'N/A');
    console.log('📏 거리:', data.distance ? `${data.distance.toFixed(3)} km` : '0 km');
    console.log('🏃 속도:', data.speed ? `${data.speed.toFixed(2)} km/h` : '0 km/h');
    console.log('⚡ 페이스:', data.pace ? `${data.pace.toFixed(2)} min/km` : '0 min/km');
    console.log('⏱️ 경과 시간:', data.duration ? `${Math.floor(data.duration / 60)}분 ${data.duration % 60}초` : '0초');
    console.log('🗺️ 경로 포인트 수:', data.route ? data.route.length : 0);
    console.log('✅ 완료 여부:', data.isComplete ? '완료' : '진행중');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(data);

        request.onsuccess = () => {
            console.log('✅ DB 저장 성공! ID:', request.result);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            resolve(request.result);
        };
        request.onerror = () => {
            console.error('❌ DB 저장 실패:', request.error);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            reject(request.error);
        };
    });
};

// 세션 ID로 모든 데이터 가져오기
export const getSessionData = async (sessionId) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('sessionId');
        const request = index.getAll(sessionId);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// 모든 세션 가져오기
export const getAllSessions = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const allData = request.result;
            // 세션별로 그룹화
            const sessions = {};
            allData.forEach(record => {
                if (!sessions[record.sessionId]) {
                    sessions[record.sessionId] = [];
                }
                sessions[record.sessionId].push(record);
            });
            resolve(sessions);
        };
        request.onerror = () => reject(request.error);
    });
};

// 최근 완료된 세션 가져오기
export const getRecentSessions = async (limit = 3) => {
    const sessions = await getAllSessions();
    const completedSessions = [];

    Object.values(sessions).forEach(sessionRecords => {
        // 완료된 기록이 있는 세션만 찾기
        const completeRecord = sessionRecords.find(r => r.isComplete);
        if (completeRecord) {
            completedSessions.push(completeRecord);
        }
    });

    // 최신순 정렬
    completedSessions.sort((a, b) => b.timestamp - a.timestamp);

    return completedSessions.slice(0, limit);
};

// 세션 삭제
export const deleteSession = async (sessionId) => {
    const db = await initDB();
    const sessionData = await getSessionData(sessionId);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        let deletedCount = 0;
        sessionData.forEach(record => {
            store.delete(record.id);
            deletedCount++;
        });

        transaction.oncomplete = () => resolve(deletedCount);
        transaction.onerror = () => reject(transaction.error);
    });
};

// 모든 데이터 삭제
export const clearAllData = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
