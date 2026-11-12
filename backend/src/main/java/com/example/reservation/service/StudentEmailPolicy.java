package com.example.reservation.service;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 「学生専用のメールアドレス」かどうかの判定。
 * メールアドレスの @ より後ろ（ドメイン）が、設定したドメインのどれかと、まったく同じであれば、学生専用として扱う。
 * 大文字・小文字は区別しない。サブドメイン（mail.example.ac.jp など）や、似たドメインは、認めない。
 */
public class StudentEmailPolicy {

    private final Set<String> domains;

    /** @param commaSeparatedDomains 認めるドメイン。複数あるときは、カンマで区切る（例：example.ac.jp,school.ac.jp） */
    public StudentEmailPolicy(String commaSeparatedDomains) {
        this.domains = Arrays.stream(commaSeparatedDomains.split(","))
                .map(String::trim)
                .map(domain -> domain.toLowerCase(Locale.ROOT))
                .filter(domain -> !domain.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
        if (domains.isEmpty()) {
            throw new IllegalArgumentException("app.student-email-domains に、ドメインを1つ以上指定してください");
        }
    }

    public boolean isStudentEmail(String email) {
        if (email == null) {
            return false;
        }
        int at = email.lastIndexOf('@');
        if (at <= 0 || at == email.length() - 1) {
            return false;
        }
        return domains.contains(email.substring(at + 1).trim().toLowerCase(Locale.ROOT));
    }
}
