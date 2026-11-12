/** ログイン後に、最初に表示する画面（学生はトップページ、教師は学生一覧画面） */
export function homePath(role) {
  return role === 'TEACHER' ? '/students' : '/top'
}
