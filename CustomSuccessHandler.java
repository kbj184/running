package com.secondwind.oauth2;

import com.secondwind.dto.CustomOAuth2User;
import com.secondwind.dto.CustomUserDetail;
import com.secondwind.jwt.JWTUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Collection;
import java.util.Iterator;

@Component
public class CustomSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Value("${secondwind.allowed-origins}")
    private String allowedOrigins;

    private final JWTUtil jwtUtil;

    public CustomSuccessHandler(JWTUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        Object principal = authentication.getPrincipal();

        String providerId;
        Long id;
        if (principal instanceof CustomUserDetail user) {
            providerId = user.getProviderId(); // 일반 로그인
            id = user.getId();
        } else if (principal instanceof CustomOAuth2User oauth) {
            providerId = oauth.getProviderId(); // OAuth
            id = oauth.getId();
        } else {
            throw new IllegalStateException("Unknown principal type");
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        Iterator<? extends GrantedAuthority> iterator = authorities.iterator();
        GrantedAuthority auth = iterator.next();
        String role = auth.getAuthority();

        System.out.println("✅ 로그인 성공 - User ID: " + id);

        // Refresh Token 생성 (24시간)
        String refresh = jwtUtil.createJwt(id, providerId, role, 86400000L);
        System.out.println("✅ Refresh Token 생성 완료");

        // ResponseCookie 생성 및 응답 헤더에 추가
        ResponseCookie refreshCookie = jwtUtil.createCookie("rt", refresh);
        response.addHeader("Set-Cookie", refreshCookie.toString());
        System.out.println("✅ Refresh Token 쿠키 설정 완료");

        // OAuth와 일반 로그인 구분 처리
        if (principal instanceof CustomOAuth2User) {
            // ⭐ OAuth 로그인: 프론트엔드 메인 페이지로 리다이렉트
            System.out.println("✅ OAuth 로그인 - 프론트엔드로 리다이렉트: " + allowedOrigins);
            response.sendRedirect(allowedOrigins);
        } else {
            // 일반 로그인: 200 OK 응답
            System.out.println("✅ 일반 로그인 - 200 OK 응답");
            response.setStatus(HttpServletResponse.SC_OK);
        }
    }
}
