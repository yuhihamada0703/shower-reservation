package com.example.reservation.dto;

/** ログインAPIのレスポンス（認証結果と、利用者の種類 STUDENT / TEACHER） */
public record LoginResponse(
        String message,
        String role
) {
}
