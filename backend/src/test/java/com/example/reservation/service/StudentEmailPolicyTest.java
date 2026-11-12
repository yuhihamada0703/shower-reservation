package com.example.reservation.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class StudentEmailPolicyTest {

    private final StudentEmailPolicy policy = new StudentEmailPolicy(" Example.ac.jp , school.ac.jp ");

    @Test
    void 認めているドメインは_大文字小文字を区別せずに_学生専用として扱う() {
        assertTrue(policy.isStudentEmail("s20230001@example.ac.jp"));
        assertTrue(policy.isStudentEmail("S20230001@EXAMPLE.AC.JP"));
        assertTrue(policy.isStudentEmail("a@school.ac.jp"));
    }

    @Test
    void ほかのドメイン_サブドメイン_似たドメインは_学生専用として扱わない() {
        assertFalse(policy.isStudentEmail("a@gmail.com"));
        assertFalse(policy.isStudentEmail("b@gamil.com"));
        assertFalse(policy.isStudentEmail("a@mail.example.ac.jp"));
        assertFalse(policy.isStudentEmail("a@example.ac.jp.evil.com"));
        assertFalse(policy.isStudentEmail("a@xexample.ac.jp"));
    }

    @Test
    void 形式が正しくないメールアドレスは_学生専用として扱わない() {
        assertFalse(policy.isStudentEmail(null));
        assertFalse(policy.isStudentEmail(""));
        assertFalse(policy.isStudentEmail("example.ac.jp"));
        assertFalse(policy.isStudentEmail("@example.ac.jp"));
        assertFalse(policy.isStudentEmail("a@"));
    }

    @Test
    void ドメインが1つも指定されていないときは_エラーにする() {
        assertThrows(IllegalArgumentException.class, () -> new StudentEmailPolicy(" , "));
    }
}
