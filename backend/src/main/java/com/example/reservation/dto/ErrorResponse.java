package com.example.reservation.dto;

import java.util.List;

/** エラー時のレスポンス（共通）。details には、項目ごとのエラーメッセージが入る */
public record ErrorResponse(
        String message,
        List<String> details
) {
}
