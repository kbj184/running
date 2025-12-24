// JWTUtil.java의 createCookie 메서드 수정

public ResponseCookie createCookie(String key, String value) {
    return ResponseCookie.from(key, value)
            .httpOnly(true)
            .secure(true)
            .path("/")
            .maxAge(60 * 60 * 60) // 60시간
            .sameSite("None") // ⭐ Cross-Site 요청 허용
            .domain("localhost") // ⭐ localhost 전체에서 쿠키 공유
            .build();
}
