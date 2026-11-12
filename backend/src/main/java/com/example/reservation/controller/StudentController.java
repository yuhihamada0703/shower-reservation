package com.example.reservation.controller;

import com.example.reservation.dto.MessageResponse;
import com.example.reservation.dto.StudentInfo;
import com.example.reservation.dto.StudentListResponse;
import com.example.reservation.dto.StudentRegisterRequest;
import com.example.reservation.dto.StudentRegisterResponse;
import com.example.reservation.dto.StudentUpdateRequest;
import com.example.reservation.dto.StudentUpdateResponse;
import com.example.reservation.entity.Student;
import com.example.reservation.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 学生に関するAPIの入り口。リクエストを受け取り、Serviceに処理を任せて、結果を返す */
@RestController
@RequestMapping("/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    /** 学生登録API（POST /students）。ログインしていなくても使える */
    @PostMapping
    public ResponseEntity<StudentRegisterResponse> register(@Valid @RequestBody StudentRegisterRequest request) {
        Student student = studentService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new StudentRegisterResponse("登録しました", StudentInfo.from(student)));
    }

    /** 学生一覧取得API（GET /students）。教師だけが使える（権限は SecurityConfig で設定） */
    @GetMapping
    public StudentListResponse list() {
        return new StudentListResponse(
                studentService.findAll().stream().map(StudentInfo::from).toList());
    }

    /** 自分の学生情報取得API（GET /students/me）。ログイン中の学生本人の情報を返す */
    @GetMapping("/me")
    public StudentInfo getMe(Authentication authentication) {
        // 誰のデータかは、リクエストではなく、ログイン状態から決める（他の学生の情報は見られない）
        return StudentInfo.from(studentService.findByLoginId(authentication.getName()));
    }

    /** 自分の学生情報更新API（PUT /students/me）。ログイン中の学生本人の情報だけを更新できる */
    @PutMapping("/me")
    public StudentUpdateResponse updateMe(@Valid @RequestBody StudentUpdateRequest request,
                                          Authentication authentication) {
        Student student = studentService.update(authentication.getName(), request);
        return new StudentUpdateResponse("更新しました", StudentInfo.from(student));
    }

    /** 学生削除API（DELETE /students/{login_id}）。教師だけが使える */
    @DeleteMapping("/{loginId}")
    public MessageResponse delete(@PathVariable("loginId") String loginId) {
        studentService.delete(loginId);
        return new MessageResponse("削除しました");
    }
}
