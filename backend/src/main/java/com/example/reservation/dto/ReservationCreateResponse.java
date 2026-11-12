package com.example.reservation.dto;

/** 予約登録APIのレスポンス（登録結果と、登録後の予約情報） */
public record ReservationCreateResponse(
        String message,
        ReservationInfo reservation
) {
}
