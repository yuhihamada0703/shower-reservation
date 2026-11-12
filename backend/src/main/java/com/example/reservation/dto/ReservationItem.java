package com.example.reservation.dto;

import com.example.reservation.entity.Reservation;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 予約状況の1件分。予約している学生の学年・氏名を含む。
 * ログインIDやメールアドレスは含めない。reservation_id は、自分の予約のときだけ入る（ほかの学生の分は null）。
 */
public record ReservationItem(
        @JsonProperty("reservation_id") Long reservationId,
        @JsonProperty("room_no") Integer roomNo,
        @JsonProperty("reserved_date") LocalDate reservedDate,
        @JsonProperty("start_time") @JsonFormat(pattern = "HH:mm") LocalTime startTime,
        String grade,
        String name,
        @JsonProperty("is_mine") boolean mine
) {
    public static ReservationItem from(Reservation reservation, String loginId) {
        boolean mine = reservation.getStudent().getLoginId().equals(loginId);
        return new ReservationItem(
                mine ? reservation.getId() : null,
                reservation.getRoomNo(),
                reservation.getReservedDate(),
                reservation.getStartTime(),
                reservation.getStudent().getGrade(),
                reservation.getStudent().getName(),
                mine);
    }
}
