import { apiFetch } from './client.js'

/** 使用状況取得API（GET /usage）。{ rooms: [{ room_no, status, grade, name }] } */
export function getUsage() {
  return apiFetch('/usage')
}

/** 予約状況取得API（GET /reservations）。当日と翌日の予約済みの枠 */
export function getReservations() {
  return apiFetch('/reservations')
}

/** 予約登録API（POST /reservations） */
export function createReservation({ reservedDate, roomNo, startTime }) {
  return apiFetch('/reservations', {
    method: 'POST',
    body: { reserved_date: reservedDate, room_no: Number(roomNo), start_time: startTime },
  })
}

/** 予約キャンセルAPI（DELETE /reservations/{reservation_id}） */
export function cancelReservation(reservationId) {
  return apiFetch(`/reservations/${reservationId}`, { method: 'DELETE' })
}
