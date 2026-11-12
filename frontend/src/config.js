// 学生専用のメールアドレスとして認める、ドメイン（@ より後ろの部分）。
// 環境変数 VITE_STUDENT_EMAIL_DOMAINS で変えられる（複数あるときは、カンマで区切る）。
// 本当のドメインは、frontend/.env.local に書く（このファイルは、GitHubには上げない）
const raw = import.meta.env.VITE_STUDENT_EMAIL_DOMAINS ?? 'example.ac.jp'

export const STUDENT_EMAIL_DOMAINS = raw
  .split(',')
  .map((domain) => domain.trim().toLowerCase())
  .filter((domain) => domain !== '')

/** メールアドレスの @ より後ろが、認めているドメインか（大文字・小文字は区別しない） */
export function isStudentEmailDomain(email) {
  const at = email.lastIndexOf('@')
  if (at < 0) return false
  return STUDENT_EMAIL_DOMAINS.includes(email.slice(at + 1).toLowerCase())
}

/** 入力欄の補足に出す文章（例：学生専用のメールアドレス（@example.ac.jp）） */
export const STUDENT_EMAIL_HINT = `学生専用のメールアドレス（@${STUDENT_EMAIL_DOMAINS.join('、@')}）`
