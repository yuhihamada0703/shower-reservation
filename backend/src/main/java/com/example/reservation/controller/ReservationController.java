package com.example.reservation.controller;

import com.example.reservation.dto.MessageResponse;
import com.example.reservation.dto.ReservationCreateRequest;
import com.example.reservation.dto.ReservationCreateResponse;
import com.example.reservation.dto.ReservationInfo;
import com.example.reservation.dto.ReservationItem;
import com.example.reservation.dto.ReservationListResponse;
import com.example.reservation.dto.UsageResponse;
import com.example.reservation.entity.Reservation;
import com.example.reservation.service.ReservationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** 使用状況・予約に関するAPIの入り口。学生だけが使える（権限は SecurityConfig で設定） */
@RestController
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    /** 使用状況取得API（GET /usage） */
    @GetMapping("/usage")
    public UsageResponse usage() {
        return new UsageResponse(reservationService.usage());
    }

    /** 予約状況取得API（GET /reservations）。当日と翌日の予約済みの枠を返す */
    @GetMapping("/reservations")
    public ReservationListResponse list(Authentication authentication) {
        String loginId = authentication.getName();
        List<ReservationItem> items = reservationService.findUpcoming().stream()
                .map(reservation -> ReservationItem.from(reservation, loginId))
                .toList();
        return new ReservationListResponse(items);
    }

    /** 予約登録API（POST /reservations） */
    @PostMapping("/reservations")
    public ResponseEntity<ReservationCreateResponse> create(@Valid @RequestBody ReservationCreateRequest request,
                                                            Authentication authentication) {
        // 誰の予約かは、リクエストではなく、ログイン状態から決める
        Reservation reservation = reservationService.create(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ReservationCreateResponse("予約しました", ReservationInfo.from(reservation)));
    }

    /** 予約キャンセルAPI（DELETE /reservations/{reservation_id}） */
    @DeleteMapping("/reservations/{reservationId}")
    public MessageResponse cancel(@PathVariable("reservationId") Long reservationId,
                                  Authentication authentication) {
        reservationService.cancel(authentication.getName(), reservationId);
        return new MessageResponse("キャンセルしました");
    }
}
