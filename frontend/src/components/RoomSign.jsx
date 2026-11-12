import { personLabel } from '../utils/date.js'

/**
 * シャワー室1室分の使用状況を、ドアにかける札の形で表示する。
 * 色だけに頼らず、文字（使用中・空・利用時間外）でも状態が分かるようにしている。
 */
export default function RoomSign({ room }) {
  let tone = 'closed'
  if (room.status === 'IN_USE') tone = 'occupied'
  if (room.status === 'EMPTY') tone = 'vacant'

  return (
    <article className={`room-sign room-sign-${tone}`} aria-label={`シャワー室${room.room_no}`}>
      <h3 className="room-sign-name">シャワー室{room.room_no}</h3>
      {room.status === 'IN_USE' && (
        <>
          <p className="room-sign-label">使用中</p>
          <p className="room-sign-main">{personLabel(room.grade, room.name)}</p>
        </>
      )}
      {room.status === 'EMPTY' && <p className="room-sign-main room-sign-empty">空</p>}
      {room.status === 'OUT_OF_HOURS' && (
        <>
          <p className="room-sign-main">利用時間外</p>
          <p className="room-sign-label">利用できるのは 10:00〜23:00</p>
        </>
      )}
    </article>
  )
}
