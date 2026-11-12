package com.example.reservation.service;

import com.example.reservation.dto.ReservationCreateRequest;
import com.example.reservation.dto.RoomUsage;
import com.example.reservation.entity.Reservation;
import com.example.reservation.entity.Student;
import com.example.reservation.exception.BadRequestException;
import com.example.reservation.exception.ConflictException;
import com.example.reservation.exception.ForbiddenException;
import com.example.reservation.exception.NotFoundException;
import com.example.reservation.repository.ReservationRepository;
import com.example.reservation.repository.StudentRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 予約に関する処理（予約のルール）を担当する。日時は、日本時間の Clock を使って判断する */
@Service
public class ReservationService {

    private static final LocalTime OPEN_TIME = LocalTime.of(10, 0);        // 利用開始
    private static final LocalTime LAST_START_TIME = LocalTime.of(22, 45); // 最後の枠の開始時刻
    private static final LocalTime CLOSE_TIME = LocalTime.of(23, 0);       // 利用終了
    private static final int SLOT_MINUTES = 15;                            // 1枠の長さ（分）
    private static final List<Integer> ROOM_NUMBERS = List.of(1, 2);       // シャワー室の番号

    private final ReservationRepository reservationRepository;
    private final StudentRepository studentRepository;
    private final Clock clock;

    public ReservationService(ReservationRepository reservationRepository,
                              StudentRepository studentRepository,
                              Clock clock) {
        this.reservationRepository = reservationRepository;
        this.studentRepository = studentRepository;
        this.clock = clock;
    }

    /** 予約を登録する。予約のルールに合わない場合は、400（または、すでに予約済みなら409）になる */
    @Transactional
    public Reservation create(String loginId, ReservationCreateRequest request) {
        LocalDate today = LocalDate.now(clock);
        LocalTime now = LocalTime.now(clock);
        LocalDate date = request.reservedDate();
        LocalTime start = request.startTime();

        if (!ROOM_NUMBERS.contains(request.roomNo())) {
            throw new BadRequestException("シャワー室を正しく選択してください");
        }
        // 10:00〜22:45 の、15分刻みの時刻だけ
        if (start.isBefore(OPEN_TIME) || start.isAfter(LAST_START_TIME)
                || start.getMinute() % SLOT_MINUTES != 0 || start.getSecond() != 0 || start.getNano() != 0) {
            throw new BadRequestException("時間を正しく選択してください");
        }
        // 当日と翌日だけ
        if (!date.equals(today) && !date.equals(today.plusDays(1))) {
            throw new BadRequestException("予約できるのは当日と翌日です");
        }
        // 過去の枠、すでに開始した枠は予約できない
        if (date.equals(today) && !start.isAfter(now)) {
            throw new BadRequestException("過去の時間は予約できません");
        }
        // 同じ枠が、先に予約されていないか
        if (reservationRepository.existsByRoomNoAndReservedDateAndStartTime(request.roomNo(), date, start)) {
            throw new ConflictException("この枠はすでに予約されています");
        }
        // 同じ学生が、同じ時間帯に、もう予約を持っていないか
        if (reservationRepository.existsByStudentLoginIdAndReservedDateAndStartTime(loginId, date, start)) {
            throw new ConflictException("同じ時間帯にすでに予約があります");
        }

        Student student = studentRepository.findById(loginId).orElseThrow(NotFoundException::new);
        Reservation reservation = new Reservation(student, request.roomNo(), date, start);
        try {
            // 2人が同時に同じ枠を予約した場合は、DBの制約（ユニーク制約）でエラーになるので、409として返す
            return reservationRepository.saveAndFlush(reservation);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("この枠はすでに予約されています");
        }
    }

    /** 当日と翌日の、予約済みの枠を、時間の順に取得する */
    @Transactional(readOnly = true)
    public List<Reservation> findUpcoming() {
        LocalDate today = LocalDate.now(clock);
        return reservationRepository.findAllInRange(today, today.plusDays(1));
    }

    /** 自分の予約を、開始前にキャンセルする */
    @Transactional
    public void cancel(String loginId, Long reservationId) {
        Reservation reservation = reservationRepository.findByIdWithStudent(reservationId)
                .orElseThrow(NotFoundException::new);
        if (!reservation.getStudent().getLoginId().equals(loginId)) {
            throw new ForbiddenException("ほかの学生の予約はキャンセルできません");
        }
        LocalDateTime start = LocalDateTime.of(reservation.getReservedDate(), reservation.getStartTime());
        if (!start.isAfter(LocalDateTime.now(clock))) {
            throw new BadRequestException("開始した予約はキャンセルできません");
        }
        reservationRepository.delete(reservation);
    }

    /**
     * 今の時刻の、シャワー室ごとの使用状況を求める。
     * 「今の時刻が含まれる15分の枠」を予約している学生を、使用中とみなす。
     */
    @Transactional(readOnly = true)
    public List<RoomUsage> usage() {
        LocalDate today = LocalDate.now(clock);
        LocalTime now = LocalTime.now(clock);
        boolean open = !now.isBefore(OPEN_TIME) && now.isBefore(CLOSE_TIME);
        // 今の時刻が含まれる枠の開始時刻（例：19:07 なら 19:00）
        LocalTime slotStart = LocalTime.of(now.getHour(), now.getMinute() - now.getMinute() % SLOT_MINUTES);

        List<RoomUsage> result = new ArrayList<>();
        for (Integer roomNo : ROOM_NUMBERS) {
            if (!open) {
                result.add(new RoomUsage(roomNo, "OUT_OF_HOURS", null, null));
                continue;
            }
            Optional<Reservation> reservation = reservationRepository.findSlot(roomNo, today, slotStart);
            if (reservation.isPresent()) {
                Student student = reservation.get().getStudent();
                result.add(new RoomUsage(roomNo, "IN_USE", student.getGrade(), student.getName()));
            } else {
                result.add(new RoomUsage(roomNo, "EMPTY", null, null));
            }
        }
        return result;
    }
}
