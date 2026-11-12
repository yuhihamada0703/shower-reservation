/** 予約状況の日付（当日・翌日）を切り替えるボタン */
export default function DayToggle({ days, selected, onSelect }) {
  return (
    <div className="day-toggle" role="group" aria-label="表示する日付">
      {days.map((day) => (
        <button key={day.value} type="button" aria-pressed={day.value === selected} onClick={() => onSelect(day.value)}>
          {day.label}
          <span className="day-toggle-date">{day.short}</span>
        </button>
      ))}
    </div>
  )
}
