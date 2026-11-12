import { useState } from 'react'
import { SLOT_TIMES, currentTime, formatDate } from '../utils/date.js'

/**
 * 予約する欄。日付・シャワー室・時間を選んで、予約する。
 * 過去の時間は、一覧に出さない。すでに予約されている枠や、同じ時間帯に自分の予約がある枠は、選べない。
 */
export default function ReservationForm({ days, date, onDateChange, reservations, now, onReserve }) {
  const [roomNo, setRoomNo] = useState('1')
  const [time, setTime] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isToday = date === formatDate(now)
  const nowTime = currentTime(now)

  const options = SLOT_TIMES.filter((slot) => !(isToday && slot <= nowTime)).map((slot) => {
    const sameDay = reservations.filter((r) => r.reserved_date === date && r.start_time === slot)
    const taken = sameDay.some((r) => r.room_no === Number(roomNo))
    const mineAtSameTime = sameDay.some((r) => r.is_mine)
    let label = slot
    if (taken) label = `${slot}（予約済み）`
    else if (mineAtSameTime) label = `${slot}（同じ時間帯に予約あり）`
    return { value: slot, label, disabled: taken || mineAtSameTime }
  })

  const selectedTime = options.some((option) => option.value === time && !option.disabled) ? time : ''

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (selectedTime === '') {
      setError('時間を選択してください')
      return
    }
    setError(null)
    setSubmitting(true)
    const succeeded = await onReserve({ roomNo, startTime: selectedTime })
    setSubmitting(false)
    if (succeeded) setTime('')
  }

  return (
    <form className="booking" onSubmit={handleSubmit} noValidate>
      <h3 className="panel-title">予約する</h3>
      <div className="booking-grid">
        <div className="field">
          <label htmlFor="booking-date" className="field-label">
            日付
          </label>
          <select id="booking-date" className="field-input" value={date} onChange={(e) => onDateChange(e.target.value)}>
            {days.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}（{day.short}）
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="booking-room" className="field-label">
            シャワー室
          </label>
          <select id="booking-room" className="field-input" value={roomNo} onChange={(e) => setRoomNo(e.target.value)}>
            <option value="1">シャワー室1</option>
            <option value="2">シャワー室2</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="booking-time" className="field-label">
            時間（15分）
          </label>
          <select
            id="booking-time"
            className="field-input"
            value={selectedTime}
            onChange={(e) => setTime(e.target.value)}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'booking-time-error' : undefined}
          >
            <option value="">選択してください</option>
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <p id="booking-time-error" className="field-error">
          {error}
        </p>
      )}
      <div className="actions">
        <button type="submit" className="button button-primary" disabled={submitting}>
          予約する
        </button>
      </div>
    </form>
  )
}
