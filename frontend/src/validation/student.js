// 画面設計書のエラーメッセージに合わせた、入力チェック。
// バックエンドでも、同じ内容をチェックしている（画面のチェックは、早く知らせるためのもの）
const DIGITS_ONLY = /^[0-9]+$/
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 名前・学年・所属部活・メールアドレスのチェック（学生登録と、登録情報の編集で共通） */
function validateProfileFields(values) {
  const errors = {}
  const name = values.name.trim()
  const grade = values.grade.trim()
  const club = values.club.trim()
  const email = values.email.trim()

  if (name === '') {
    errors.name = '名前を入力してください'
  } else if (name.length > 10) {
    errors.name = '名前は10字以内で入力してください'
  }

  if (grade === '') {
    errors.grade = '学年を入力してください'
  } else if (grade.length > 10) {
    errors.grade = '学年は10字以内で入力してください'
  }

  if (club.length > 10) {
    errors.club = '所属部活は10字以内で入力してください'
  }

  if (email === '') {
    errors.email = 'メールアドレスを入力してください'
  } else if (email.length > 255 || !EMAIL_FORMAT.test(email)) {
    errors.email = '学生専用のメールアドレスを入力してください'
  }
  return errors
}

/** 学生登録画面の入力内容をチェックして、{ 項目名: エラーメッセージ } を返す（問題がなければ空） */
export function validateRegister(values) {
  const errors = {}
  const loginId = values.loginId.trim()

  if (loginId === '') {
    errors.loginId = '学生番号を入力してください'
  } else if (loginId.length > 20 || !DIGITS_ONLY.test(loginId)) {
    errors.loginId = '学生番号を正しく入力してください'
  }

  if (values.password === '') {
    errors.password = 'パスワードを入力してください'
  } else if (values.password.length > 10) {
    errors.password = 'パスワードは10字以内で入力してください'
  }

  return { ...errors, ...validateProfileFields(values) }
}

/** 登録情報の編集ポップアップの入力内容をチェックする（学生番号とパスワードは変更できない） */
export function validateProfile(values) {
  return validateProfileFields(values)
}

/** 送る前に、前後の空白を取り除く（パスワードは、そのまま） */
export function toRegisterPayload(values) {
  return {
    loginId: values.loginId.trim(),
    password: values.password,
    ...toProfilePayload(values),
  }
}

export function toProfilePayload(values) {
  return {
    name: values.name.trim(),
    grade: values.grade.trim(),
    club: values.club.trim(),
    email: values.email.trim(),
  }
}
