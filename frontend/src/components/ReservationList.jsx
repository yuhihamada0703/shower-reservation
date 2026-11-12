import { personLabel } from '../utils/date.js'

/** 予約している学生の、時間・シャワー室・学年と氏名の一覧。自分の予約には、キャンセルボタンを付ける */
export default function ReservationList({ reservations, onCancel, busyId }) {
  if (reservations.length === 0) {
    return <p className="empty-note">この日の予約は、まだありません。下の欄から予約できます。</p>
  }
  return (
    <ol className="slot-list">
      {reservations.map((reservation) => (
        <li
          key={`${reservation.reserved_date}-${reservation.room_no}-${reservation.start_time}`}
          className={reservation.is_mine ? 'slot-row slot-row-mine' : 'slot-row'}
        >
          <span className="slot-time">{reservation.start_time}</span>
          <span className="slot-room">シャワー室{reservation.room_no}</span>
          <span className="slot-person">
            {personLabel(reservation.grade, reservation.name)}
            {reservation.is_mine && <span className="slot-mine-tag">自分</span>}
          </span>
          {reservation.is_mine && (
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => onCancel(reservation.reservation_id)}
              disabled={busyId === reservation.reservation_id}
            >
              キャンセル
            </button>
          )}
        </li>
      ))}
    </ol>
  )
}
