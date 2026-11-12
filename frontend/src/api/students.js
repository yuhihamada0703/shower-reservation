import { apiFetch } from './client.js'

/** 学生登録API（POST /students）。画面の項目名を、API仕様書の項目名（login_id など）に直して送る */
export function registerStudent(values) {
  return apiFetch('/students', {
    method: 'POST',
    body: {
      login_id: values.loginId,
      password: values.password,
      name: values.name,
      grade: values.grade,
      club: values.club,
      email: values.email,
    },
  })
}

/** 自分の学生情報取得API（GET /students/me）。{ login_id, name, grade, club, email } */
export function getMyInfo() {
  return apiFetch('/students/me')
}

/** 自分の学生情報更新API（PUT /students/me）。学生番号とパスワードは変更できない */
export function updateMyInfo(values) {
  return apiFetch('/students/me', {
    method: 'PUT',
    body: { name: values.name, grade: values.grade, club: values.club, email: values.email },
  })
}

/** 学生一覧取得API（GET /students）。教師だけが使える。{ students: [{ login_id, name, grade, club, email }] } */
export function listStudents() {
  return apiFetch('/students')
}

/** 学生削除API（DELETE /students/{login_id}）。教師だけが使える。その学生の予約も、一緒に削除される */
export function deleteStudent(loginId) {
  return apiFetch(`/students/${encodeURIComponent(loginId)}`, { method: 'DELETE' })
}
