package com.example.reservation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * シャワー室1室分の使用状況。
 * status は IN_USE（使用中）、EMPTY（空）、OUT_OF_HOURS（利用時間外）のどれか。
 * 使用中のときだけ、使用している学生の学年・氏名が入る。
 */
public record RoomUsage(
        @JsonProperty("room_no") Integer roomNo,
        String status,
        String grade,
        String name
) {
}
