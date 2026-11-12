package com.example.reservation.config;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/** 認証（ログイン）と認可（誰がどのAPIを使えるか）の設定 */
@Configuration
public class SecurityConfig {

    /** パスワードをハッシュ化・照合するための部品（BCrypt） */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** ログインAPI（AuthController）で、ログインIDとパスワードを照合するために使う */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Reactとは別のポート（5173）で動くため、通信を許可する設定（CORS）を有効にする
            .cors(Customizer.withDefaults())
            // 学習用に、CSRF対策は無効にしている（公開する前に、有効にする改善を検討する）
            .csrf(AbstractHttpConfigurer::disable)
            // ログイン・ログアウトは AuthController で行うため、Spring標準のものは使わない
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                // ブラウザが事前に送る確認のリクエスト（CORSの事前確認）は許可する
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // ログインしていなくても使えるAPI：ログイン、学生登録
                .requestMatchers(HttpMethod.POST, "/login", "/students").permitAll()
                // 教師だけが使えるAPI：学生一覧、学生削除
                .requestMatchers(HttpMethod.GET, "/students").hasRole("TEACHER")
                .requestMatchers(HttpMethod.DELETE, "/students/*").hasRole("TEACHER")
                // 学生だけが使えるAPI：自分の情報、使用状況、予約
                .requestMatchers("/students/me").hasRole("STUDENT")
                .requestMatchers("/usage", "/reservations", "/reservations/**").hasRole("STUDENT")
                // それ以外（ログアウトなど）は、ログインしていれば使える
                .anyRequest().authenticated())
            .exceptionHandling(ex -> ex
                // ログインしていない場合 → 401
                .authenticationEntryPoint((request, response, authException) ->
                    writeJson(response, 401, "ログインが必要です"))
                // ログインしているが、権限がない場合 → 403
                .accessDeniedHandler((request, response, accessDeniedException) ->
                    writeJson(response, 403, "この操作を行う権限がありません")));
        return http.build();
    }

    /** React開発サーバー（http://localhost:5173）からのアクセスを許可する */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173", "http://127.0.0.1:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); // ログイン状態（Cookie）を送れるようにする
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private static void writeJson(jakarta.servlet.http.HttpServletResponse response, int status, String message)
            throws java.io.IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\":\"" + message + "\",\"details\":[]}");
    }
}
