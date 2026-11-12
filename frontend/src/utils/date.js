// 日付・時刻まわりの小さな道具。時刻は、ブラウザ（パソコン）の日本時間をもとにする

function pad(number) {
  return String(number).padStart(2, '0')
}

/** Date を、API仕様書の日付の形式（2026-11-13）にする */
export function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 日付を、指定した日数だけ進めた Date を返す */
export function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** 2026-11-13 を、11/13 の表示にする */
export function shortDate(isoDate) {
  const [, month, day] = isoDate.split('-')
  return `${Number(month)}/${Number(day)}`
}

/** 今の時刻を、19:05 の形式にする */
export function currentTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 予約できる時間枠の開始時刻（10:00〜22:45の15分刻み。全部で52枠） */
export const SLOT_TIMES = Array.from({ length: 52 }, (_, index) => {
  const minutes = 10 * 60 + index * 15
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
})

/** 学年と名前を、画面に表示する形にする（例：2年 山田 太郎） */
export function personLabel(grade, name) {
  return `${grade} ${name}`
}
