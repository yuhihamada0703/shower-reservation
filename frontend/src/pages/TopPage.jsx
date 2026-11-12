import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client.js'
import { cancelReservation, createReservation, getReservations, getUsage } from '../api/reservations.js'
import DayToggle from '../components/DayToggle.jsx'
import LogoutButton from '../components/LogoutButton.jsx'
import ProfileModal from '../components/ProfileModal.jsx'
import ReservationForm from '../components/ReservationForm.jsx'
import ReservationList from '../components/ReservationList.jsx'
import RoomSign from '../components/RoomSign.jsx'
import { addDays, formatDate, shortDate } from '../utils/date.js'

/** APIのエラーを、画面に出す文章にする（サーバーが詳細を返していれば、いっしょに出す） */
function messageOf(error) {
  if (error instanceof ApiError) {
    return error.details.length > 0 ? `${error.message}：${error.details.join('、')}` : error.message
  }
  return 'エラーが発生しました。しばらくしてからもう一度お試しください'
}

/** 使用状況と予約状況を、同時に取得する */
function fetchAll() {
  return Promise.all([getUsage(), getReservations()])
}

/**
 * トップページ（/top）。学生用。左に使用状況、右に予約状況と、予約する欄を表示する。
 * 使用状況・予約状況は、自動では更新せず、「更新」ボタンと、予約・キャンセルのあとに、取得し直す。
 */
export default function TopPage() {
  // 「今」の時刻。過去の時間を、選べないようにするために使う。1分ごとに更新する
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timerId = setInterval(() => setNow(new Date()), 60 * 1000)
    return () => clearInterval(timerId)
  }, [])

  const today = formatDate(now)
  const tomorrow = formatDate(addDays(now, 1))
  const days = [
    { value: today, label: '当日', short: shortDate(today) },
    { value: tomorrow, label: '翌日', short: shortDate(tomorrow) },
  ]

  const [selectedDate, setDate] = useState(today)
  // 日付をまたいで開きっぱなしにして、選んでいた日が過去になった場合は、当日に戻す
  const date = days.some((day) => day.value === selectedDate) ? selectedDate : today
  const [rooms, setRooms] = useState([])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)

  // 取得したデータ・エラーを、画面に反映する
  const applyData = useCallback(([usage, list]) => {
    setRooms(usage.rooms)
    setReservations(list.reservations)
    setLoadError(null)
    setLoading(false)
  }, [])
  const applyError = useCallback(() => {
    setLoadError('情報を取得できませんでした。更新ボタンをもう一度押してください')
    setLoading(false)
  }, [])

  // 使用状況と予約状況を、まとめて取得し直す（更新ボタン・予約・キャンセルのあとに使う）
  const reload = useCallback(() => fetchAll().then(applyData, applyError), [applyData, applyError])

  // 画面を開いたときに、1回取得する
  useEffect(() => {
    let cancelled = false
    fetchAll().then(
      (data) => {
        if (!cancelled) applyData(data)
      },
      () => {
        if (!cancelled) applyError()
      },
    )
    return () => {
      cancelled = true
    }
  }, [applyData, applyError])

  const handleRefresh = async () => {
    setNotice(null)
    setActionError(null)
    await reload()
  }

  const handleReserve = async ({ roomNo, startTime }) => {
    setNotice(null)
    setActionError(null)
    try {
      await createReservation({ reservedDate: date, roomNo, startTime })
      await reload()
      setNotice('予約しました')
      return true
    } catch (e) {
      setActionError(messageOf(e))
      await reload() // 先に予約された場合などに、最新の状態を表示する
      return false
    }
  }

  const handleCancel = async (reservationId) => {
    setNotice(null)
    setActionError(null)
    setBusyId(reservationId)
    try {
      await cancelReservation(reservationId)
      await reload()
      setNotice('キャンセルしました')
    } catch (e) {
      setActionError(messageOf(e))
      await reload()
    } finally {
      setBusyId(null)
    }
  }

  const handleProfileSaved = () => {
    setProfileOpen(false)
    setNotice('登録情報を更新しました')
    setActionError(null)
    reload() // 名前や学年が変わると、使用状況・予約状況の表示も変わる
  }

  const reservationsOfDay = reservations.filter((reservation) => reservation.reserved_date === date)

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">予約管理システム</h1>
        <div className="app-header-actions">
          <button type="button" className="button button-secondary button-small" onClick={() => setProfileOpen(true)}>
            情報編集
          </button>
          <LogoutButton className="button button-secondary button-small" />
        </div>
      </header>

      <main className="dashboard">
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {(actionError || loadError) && (
          <p className="alert" role="alert">
            {actionError ?? loadError}
          </p>
        )}

        <div className="dashboard-grid">
          <section aria-labelledby="usage-title">
            <div className="panel-head">
              <h2 id="usage-title" className="panel-title">
                使用状況
              </h2>
              <button type="button" className="button button-secondary button-small" onClick={handleRefresh}>
                更新
              </button>
            </div>
            {loading ? <p className="note">読み込んでいます…</p> : rooms.map((room) => <RoomSign key={room.room_no} room={room} />)}
          </section>

          <section className="sheet" aria-labelledby="reservations-title">
            <div className="panel-head">
              <h2 id="reservations-title" className="panel-title">
                予約状況
              </h2>
              <DayToggle days={days} selected={date} onSelect={setDate} />
            </div>
            <ReservationList reservations={reservationsOfDay} onCancel={handleCancel} busyId={busyId} />
            <ReservationForm
              days={days}
              date={date}
              onDateChange={setDate}
              reservations={reservations}
              now={now}
              onReserve={handleReserve}
            />
          </section>
        </div>
      </main>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} onSaved={handleProfileSaved} />}
    </div>
  )
}
