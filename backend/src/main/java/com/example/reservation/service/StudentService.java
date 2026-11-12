package com.example.reservation.service;

import com.example.reservation.dto.StudentRegisterRequest;
import com.example.reservation.dto.StudentUpdateRequest;
import com.example.reservation.entity.Login;
import com.example.reservation.entity.Role;
import com.example.reservation.entity.Student;
import com.example.reservation.exception.BadRequestException;
import com.example.reservation.exception.DuplicateLoginIdException;
import com.example.reservation.exception.NotFoundException;
import com.example.reservation.repository.LoginRepository;
import com.example.reservation.repository.StudentRepository;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 学生に関する処理（業務のルール）を担当する */
@Service
public class StudentService {

    private final LoginRepository loginRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentEmailPolicy studentEmailPolicy;

    public StudentService(LoginRepository loginRepository,
                          StudentRepository studentRepository,
                          PasswordEncoder passwordEncoder,
                          StudentEmailPolicy studentEmailPolicy) {
        this.loginRepository = loginRepository;
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.studentEmailPolicy = studentEmailPolicy;
    }

    /**
     * 学生を新しく登録する。
     * login と students の2つのテーブルに書き込むので、途中で失敗したら両方とも取り消す（@Transactional）。
     */
    @Transactional
    public Student register(StudentRegisterRequest request) {
        requireStudentEmail(request.email());
        if (loginRepository.existsById(request.loginId())) {
            throw new DuplicateLoginIdException();
        }

        // 先に login（ログイン情報）を保存する。students は login を参照しているため
        Login login = new Login(
                request.loginId(),
                passwordEncoder.encode(request.password()),   // ハッシュ化して保存する
                Role.STUDENT);
        loginRepository.save(login);

        Student student = new Student(
                request.loginId(),
                request.name(),
                request.grade(),
                blankToNull(request.club()),                   // 空欄は null として保存する
                request.email());
        return studentRepository.save(student);
    }

    /** 学生番号で、学生を1人取得する。いなければ404 */
    @Transactional(readOnly = true)
    public Student findByLoginId(String loginId) {
        return studentRepository.findById(loginId).orElseThrow(NotFoundException::new);
    }

    /** 登録されている学生を、学生番号の順に、すべて取得する */
    @Transactional(readOnly = true)
    public List<Student> findAll() {
        return studentRepository.findAll(Sort.by("loginId"));
    }

    /** 本人の学生情報を更新する（学生番号は変更できない） */
    @Transactional
    public Student update(String loginId, StudentUpdateRequest request) {
        requireStudentEmail(request.email());
        Student student = studentRepository.findById(loginId).orElseThrow(NotFoundException::new);
        student.update(request.name(), request.grade(), blankToNull(request.club()), request.email());
        return student;   // 取得した Student を変更するだけで、@Transactional の終了時にDBへ反映される
    }

    /**
     * 学生を削除する（教師用）。
     * login を削除すると、DBの設定（ON DELETE CASCADE）で、students と、その学生の reservations も一緒に削除される。
     */
    @Transactional
    public void delete(String loginId) {
        if (!studentRepository.existsById(loginId)) {
            throw new NotFoundException();   // 教師のアカウントなど、学生ではないIDもここで404になる
        }
        loginRepository.deleteById(loginId);
    }

    /** メールアドレスが、学生専用のドメインでなければ、400にする（画面でもチェックしているが、API側でも必ず確認する） */
    private void requireStudentEmail(String email) {
        if (!studentEmailPolicy.isStudentEmail(email)) {
            throw new BadRequestException("学生専用のメールアドレスを入力してください");
        }
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
