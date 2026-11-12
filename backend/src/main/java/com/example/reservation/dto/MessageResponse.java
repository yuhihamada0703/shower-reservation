package com.example.reservation.dto;

/** メッセージだけを返すレスポンス（ログアウトなど） */
public record MessageResponse(
        String message
) {
}
