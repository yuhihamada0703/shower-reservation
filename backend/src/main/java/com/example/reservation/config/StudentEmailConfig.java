package com.example.reservation.config;

import com.example.reservation.service.StudentEmailPolicy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** application.properties の app.student-email-domains の値から、メールアドレスの判定の部品を作る */
@Configuration
public class StudentEmailConfig {

    @Bean
    public StudentEmailPolicy studentEmailPolicy(@Value("${app.student-email-domains}") String domains) {
        return new StudentEmailPolicy(domains);
    }
}
