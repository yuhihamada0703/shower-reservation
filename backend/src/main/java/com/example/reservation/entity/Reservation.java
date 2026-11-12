package com.example.reservation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalTime;

/** 予約（reservations テーブル）。1枠 = 15分。終了時刻は持たず、開始時刻の15分後とする */
@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reservation_id")
    private Long id;

    /** 予約した学生（reservations.login_id が、students.login_id を参照している） */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "login_id", nullable = false)
    private Student student;

    @Column(name = "room_no", nullable = false)
    private Integer roomNo;

    @Column(name = "reserved_date", nullable = false)
    private LocalDate reservedDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    protected Reservation() {
        // JPAが使う
    }

    public Reservation(Student student, Integer roomNo, LocalDate reservedDate, LocalTime startTime) {
        this.student = student;
        this.roomNo = roomNo;
        this.reservedDate = reservedDate;
        this.startTime = startTime;
    }

    public Long getId() { return id; }
    public Student getStudent() { return student; }
    public Integer getRoomNo() { return roomNo; }
    public LocalDate getReservedDate() { return reservedDate; }
    public LocalTime getStartTime() { return startTime; }
}
