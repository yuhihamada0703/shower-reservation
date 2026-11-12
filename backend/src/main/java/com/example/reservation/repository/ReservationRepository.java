package com.example.reservation.repository;

import com.example.reservation.entity.Reservation;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** reservations テーブルを操作する */
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    /** 同じシャワー室・日付・開始時刻の予約があるか（二重予約の確認） */
    boolean existsByRoomNoAndReservedDateAndStartTime(Integer roomNo, LocalDate reservedDate, LocalTime startTime);

    /** 同じ学生が、同じ日付・開始時刻の予約を、すでに持っているか */
    boolean existsByStudentLoginIdAndReservedDateAndStartTime(String loginId, LocalDate reservedDate, LocalTime startTime);

    /** 指定した期間の予約を、学生の情報つきで、時間の順に取得する（予約状況の一覧用） */
    @Query("select r from Reservation r join fetch r.student "
            + "where r.reservedDate between :from and :to "
            + "order by r.reservedDate, r.startTime, r.roomNo")
    List<Reservation> findAllInRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    /** 指定した枠（シャワー室・日付・開始時刻）の予約を、学生の情報つきで取得する（使用状況用） */
    @Query("select r from Reservation r join fetch r.student "
            + "where r.roomNo = :roomNo and r.reservedDate = :date and r.startTime = :time")
    Optional<Reservation> findSlot(@Param("roomNo") Integer roomNo,
                                   @Param("date") LocalDate date,
                                   @Param("time") LocalTime time);

    /** 予約IDで、学生の情報つきで取得する（キャンセル用） */
    @Query("select r from Reservation r join fetch r.student where r.id = :id")
    Optional<Reservation> findByIdWithStudent(@Param("id") Long id);
}
