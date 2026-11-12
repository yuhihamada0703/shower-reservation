package com.example.reservation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

/** 予約登録APIのリクエスト（POST /reservations）。日付は 2026-11-13、時刻は 19:00 の形式 */
public record ReservationCreateRequest(

        @JsonProperty("reserved_date")
        @NotNull(message = "日付を選択してください")
        LocalDate reservedDate,

        @JsonProperty("room_no")
        @NotNull(message = "シャワー室を選択してください")
        Integer roomNo,

        @JsonProperty("start_time")
        @NotNull(message = "時間を選択してください")
        LocalTime startTime
) {
}
