package com.example.reservation.dto;

import java.util.List;

/** 使用状況取得APIのレスポンス */
public record UsageResponse(
        List<RoomUsage> rooms
) {
}
