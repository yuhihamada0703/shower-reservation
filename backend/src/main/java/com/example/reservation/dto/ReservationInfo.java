package com.example.reservation.dto;

import com.example.reservation.entity.Reservation;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.time.LocalTime;

/** 予約登録APIのレスポンスに入れる、登録後の予約情報 */
public record ReservationInfo(
        @JsonProperty("reservation_id") Long reservationId,
        @JsonProperty("room_no") Integer roomNo,
        @JsonProperty("reserved_date") LocalDate reservedDate,
        @JsonProperty("start_time") @JsonFormat(pattern = "HH:mm") LocalTime startTime
) {
    public static ReservationInfo from(Reservation reservation) {
        return new ReservationInfo(
                reservation.getId(),
                reservation.getRoomNo(),
                reservation.getReservedDate(),
                reservation.getStartTime());
    }
}
