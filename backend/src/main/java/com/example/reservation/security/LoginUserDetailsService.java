package com.example.reservation.security;

import com.example.reservation.entity.Login;
import com.example.reservation.repository.LoginRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * ログイン時に、login テーブルから、ログインID・ハッシュ化したパスワード・種類（STUDENT / TEACHER）を探す。
 * Spring Security は、ここで返した情報と、入力されたパスワードを BCrypt で照合する。
 */
@Service
public class LoginUserDetailsService implements UserDetailsService {

    private final LoginRepository loginRepository;

    public LoginUserDetailsService(LoginRepository loginRepository) {
        this.loginRepository = loginRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String loginId) throws UsernameNotFoundException {
        Login login = loginRepository.findById(loginId)
                .orElseThrow(() -> new UsernameNotFoundException("ログインIDが見つかりません"));
        return User.withUsername(login.getLoginId())
                .password(login.getPassword())
                .roles(login.getRole().name())   // "ROLE_STUDENT" または "ROLE_TEACHER" になる
                .build();
    }
}
