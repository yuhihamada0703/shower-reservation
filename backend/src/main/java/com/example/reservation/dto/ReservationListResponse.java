package com.example.reservation.dto;

import java.util.List;

/** 予約状況取得APIのレスポンス（当日と翌日の予約済みの枠の一覧） */
public record ReservationListResponse(
        List<ReservationItem> reservations
) {
}
