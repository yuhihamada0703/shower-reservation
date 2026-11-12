import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.jsx'
import AuthProvider from '../auth/AuthProvider.jsx'

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

const BASE = 'http://localhost:8080'

/** バックエンドのふりをする。呼ばれたAPIは calls に記録する */
function createBackend(overrides = {}) {
  const state = {
    rooms: [
      { room_no: 1, status: 'IN_USE', grade: '2年', name: '山田 太郎' },
      { room_no: 2, status: 'EMPTY', grade: null, name: null },
    ],
    reservations: [
      { reservation_id: null, room_no: 1, reserved_date: '2026-11-12', start_time: '16:00', grade: '1年', name: '佐藤 花子', is_mine: false },
      { reservation_id: 7, room_no: 2, reserved_date: '2026-11-12', start_time: '17:00', grade: '2年', name: '山田 太郎', is_mine: true },
      { reservation_id: null, room_no: 1, reserved_date: '2026-11-13', start_time: '10:15', grade: '3年', name: '鈴木 一郎', is_mine: false },
    ],
    me: { login_id: '20230001', name: '山田 太郎', grade: '2年', club: 'サッカー部', email: 's20230001@example.ac.jp' },
    calls: [],
    failWith: null,
    ...overrides,
  }
  fetch.mockImplementation(async (url, options = {}) => {
    const path = url.replace(BASE, '')
    const method = options.method ?? 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    state.calls.push({ method, path, body })
    const failure = state.failWith?.(method, path, body)
    if (failure) return failure
    if (method === 'GET' && path === '/usage') return jsonResponse(200, { rooms: state.rooms })
    if (method === 'GET' && path === '/reservations') return jsonResponse(200, { reservations: state.reservations })
    if (method === 'POST' && path === '/reservations') {
      state.reservations.push({
        reservation_id: 99, room_no: body.room_no, reserved_date: body.reserved_date, start_time: body.start_time,
        grade: state.me.grade, name: state.me.name, is_mine: true,
      })
      return jsonResponse(201, { message: '予約しました' })
    }
    if (method === 'DELETE' && path.startsWith('/reservations/')) {
      const id = Number(path.split('/').pop())
      state.reservations = state.reservations.filter((r) => r.reservation_id !== id)
      return jsonResponse(200, { message: 'キャンセルしました' })
    }
    if (method === 'GET' && path === '/students/me') return jsonResponse(200, state.me)
    if (method === 'PUT' && path === '/students/me') {
      state.me = { ...state.me, ...body }
      state.rooms = state.rooms.map((r) => (r.status === 'IN_USE' ? { ...r, grade: body.grade, name: body.name } : r))
      return jsonResponse(200, { message: '更新しました', student: state.me })
    }
    if (method === 'POST' && path === '/logout') return jsonResponse(200, { message: 'ログアウトしました' })
    return jsonResponse(404, { message: 'not found', details: [] })
  })
  return state
}

function renderTop() {
  sessionStorage.setItem('shower-reservation.role', 'STUDENT')
  return render(
    <MemoryRouter initialEntries={['/top']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function openTop(overrides) {
  const backend = createBackend(overrides)
  renderTop()
  await screen.findByRole('heading', { name: '使用状況' })
  await screen.findByText('シャワー室1', { selector: 'h3' })
  return backend
}

beforeEach(() => {
  globalThis.fetch = vi.fn()
  // 「今」を、2026年11月12日 15:07 に固定する（パソコンの時刻に関係なく、同じ結果にするため）
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 12, 15, 7, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('トップページ：使用状況', () => {
  it('使用中は学年と氏名、空きは「空」、利用時間外は「利用時間外」を、札の形で表示する', async () => {
    await openTop()
    const room1 = screen.getByRole('article', { name: 'シャワー室1' })
    expect(within(room1).getByText('使用中')).toBeInTheDocument()
    expect(within(room1).getByText('2年 山田 太郎')).toBeInTheDocument()
    const room2 = screen.getByRole('article', { name: 'シャワー室2' })
    expect(within(room2).getByText('空')).toBeInTheDocument()
  })

  it('利用時間外のときは、どちらの部屋も「利用時間外」と表示する', async () => {
    await openTop({
      rooms: [
        { room_no: 1, status: 'OUT_OF_HOURS', grade: null, name: null },
        { room_no: 2, status: 'OUT_OF_HOURS', grade: null, name: null },
      ],
    })
    expect(screen.getAllByText('利用時間外')).toHaveLength(2)
  })

  it('「更新」ボタンで、使用状況と予約状況を取得し直す', async () => {
    const backend = await openTop()
    const user = userEvent.setup()
    const before = backend.calls.length
    backend.rooms = [
      { room_no: 1, status: 'EMPTY', grade: null, name: null },
      { room_no: 2, status: 'IN_USE', grade: '1年', name: '佐藤 花子' },
    ]
    await user.click(screen.getByRole('button', { name: '更新' }))
    expect(await screen.findByText('1年 佐藤 花子', { selector: '.room-sign-main' })).toBeInTheDocument()
    expect(backend.calls.slice(before).map((c) => `${c.method} ${c.path}`).sort()).toEqual(['GET /reservations', 'GET /usage'])
  })

  it('情報を取得できなかったときは、更新ボタンを促すメッセージを表示する', async () => {
    createBackend({ failWith: (method, path) => (path === '/usage' ? jsonResponse(500, { message: 'x', details: [] }) : null) })
    renderTop()
    expect(await screen.findByRole('alert')).toHaveTextContent('情報を取得できませんでした。更新ボタンをもう一度押してください')
  })
})

describe('トップページ：予約状況', () => {
  it('当日の予約を、時間・シャワー室・学年と氏名で表示し、自分の予約にだけキャンセルボタンが付く', async () => {
    await openTop()
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('16:00')
    expect(rows[0]).toHaveTextContent('シャワー室1')
    expect(rows[0]).toHaveTextContent('1年 佐藤 花子')
    expect(within(rows[0]).queryByRole('button', { name: 'キャンセル' })).not.toBeInTheDocument()
    expect(rows[1]).toHaveTextContent('17:00')
    expect(rows[1]).toHaveTextContent('自分')
    expect(within(rows[1]).getByRole('button', { name: 'キャンセル' })).toBeInTheDocument()
  })

  it('「翌日」に切り替えると、翌日の予約が表示される', async () => {
    await openTop()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /翌日/ }))
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toHaveTextContent('10:15')
    expect(rows[0]).toHaveTextContent('3年 鈴木 一郎')
  })

  it('予約がない日は、メッセージを表示する', async () => {
    await openTop({ reservations: [] })
    expect(screen.getByText(/この日の予約は、まだありません/)).toBeInTheDocument()
  })

  it('自分の予約の「キャンセル」で、DELETE を呼び、一覧から消える', async () => {
    const backend = await openTop()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(await screen.findByRole('status')).toHaveTextContent('キャンセルしました')
    expect(backend.calls.some((c) => c.method === 'DELETE' && c.path === '/reservations/7')).toBe(true)
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })
})

describe('トップページ：予約する欄', () => {
  it('当日は、過去の時間（15:07 以前）を選択肢に出さない。翌日は、10:00 から選べる', async () => {
    await openTop()
    const user = userEvent.setup()
    const time = screen.getByLabelText(/時間/)
    expect(within(time).queryByRole('option', { name: '15:00' })).not.toBeInTheDocument()
    expect(within(time).getByRole('option', { name: '15:15' })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('日付'), screen.getByRole('option', { name: /翌日/ }))
    expect(within(screen.getByLabelText(/時間/)).getByRole('option', { name: '10:00' })).toBeInTheDocument()
  })

  it('予約済みの枠と、同じ時間帯に自分の予約がある枠は、選べない', async () => {
    await openTop()
    const time = screen.getByLabelText(/時間/)
    // 16:00 のシャワー室1は、ほかの学生が予約している
    expect(within(time).getByRole('option', { name: '16:00（予約済み）' })).toBeDisabled()
    // 17:00 には、自分が（シャワー室2を）予約している
    expect(within(time).getByRole('option', { name: '17:00（同じ時間帯に予約あり）' })).toBeDisabled()
    expect(within(time).getByRole('option', { name: '18:00' })).toBeEnabled()
  })

  it('シャワー室を切り替えると、その部屋で予約済みの枠が反映される', async () => {
    await openTop()
    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText('シャワー室'), '2')
    // シャワー室2の16:00は空いている
    expect(within(screen.getByLabelText(/時間/)).getByRole('option', { name: '16:00' })).toBeEnabled()
  })

  it('時間を選ばずに予約すると、エラーを表示して、APIは呼ばない', async () => {
    const backend = await openTop()
    const user = userEvent.setup()
    const before = backend.calls.length
    await user.click(screen.getByRole('button', { name: '予約する' }))
    expect(screen.getByText('時間を選択してください')).toBeInTheDocument()
    expect(backend.calls.length).toBe(before)
  })

  it('日付・シャワー室・時間を選んで予約すると、POST /reservations を呼び、一覧に反映する', async () => {
    const backend = await openTop()
    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText(/時間/), '18:00')
    await user.click(screen.getByRole('button', { name: '予約する' }))
    expect(await screen.findByRole('status')).toHaveTextContent('予約しました')
    const post = backend.calls.find((c) => c.method === 'POST' && c.path === '/reservations')
    expect(post.body).toEqual({ reserved_date: '2026-11-12', room_no: 1, start_time: '18:00' })
    const rows = screen.getAllByRole('listitem')
    expect(rows.some((row) => row.textContent.includes('18:00') && row.textContent.includes('自分'))).toBe(true)
  })

  it('翌日の日付で予約すると、翌日の日付がAPIに送られる', async () => {
    const backend = await openTop()
    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText('日付'), screen.getByRole('option', { name: /翌日/ }))
    await user.selectOptions(screen.getByLabelText('シャワー室'), '2')
    await user.selectOptions(screen.getByLabelText(/時間/), '10:00')
    await user.click(screen.getByRole('button', { name: '予約する' }))
    await screen.findByRole('status')
    const post = backend.calls.find((c) => c.method === 'POST')
    expect(post.body).toEqual({ reserved_date: '2026-11-13', room_no: 2, start_time: '10:00' })
  })

  it('先に予約された場合（409）は、サーバーのメッセージを表示して、最新の状態に更新する', async () => {
    const backend = await openTop({
      failWith: (method, path) =>
        method === 'POST' && path === '/reservations'
          ? jsonResponse(409, { message: 'この枠はすでに予約されています', details: [] })
          : null,
    })
    const user = userEvent.setup()
    const before = backend.calls.length
    await user.selectOptions(screen.getByLabelText(/時間/), '18:00')
    await user.click(screen.getByRole('button', { name: '予約する' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('この枠はすでに予約されています')
    await waitFor(() => expect(backend.calls.slice(before).some((c) => c.path === '/usage')).toBe(true))
  })
})

describe('トップページ：情報編集ポップアップ', () => {
  it('「情報編集」で、登録済みの情報が入ったポップアップを開く。学生番号は変更できない', async () => {
    await openTop()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '情報編集' }))
    const dialog = await screen.findByRole('dialog', { name: '登録情報の編集' })
    expect(await within(dialog).findByLabelText('名前')).toHaveValue('山田 太郎')
    expect(within(dialog).getByLabelText('学年')).toHaveValue('2年')
    expect(within(dialog).getByLabelText(/所属部活/)).toHaveValue('サッカー部')
    expect(within(dialog).getByLabelText('メールアドレス')).toHaveValue('s20230001@example.ac.jp')
    expect(within(dialog).getByLabelText(/学生番号/)).toBeDisabled()
    expect(within(dialog).getByLabelText(/学生番号/)).toHaveValue('20230001')
  })

  it('変更した項目で更新すると、PUT を呼び、ポップアップが閉じて、使用状況の表示も更新される', async () => {
    const backend = await openTop()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '情報編集' }))
    const dialog = await screen.findByRole('dialog')
    const name = await within(dialog).findByLabelText('名前')
    await user.clear(name)
    await user.type(name, '山田 次郎')
    await user.clear(within(dialog).getByLabelText('学年'))
    await user.type(within(dialog).getByLabelText('学年'), '3年')
    await user.click(within(dialog).getByRole('button', { name: '更新する' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('status')).toHaveTextContent('登録情報を更新しました')
    const put = backend.calls.find((c) => c.method === 'PUT')
    expect(put.path).toBe('/students/me')
    expect(put.body).toEqual({ name: '山田 次郎', grade: '3年', club: 'サッカー部', email: 's20230001@example.ac.jp' })
    expect(await screen.findByText('3年 山田 次郎', { selector: '.room-sign-main' })).toBeInTheDocument()
  })

  it('名前を空にして更新すると、エラーを表示して、PUT は呼ばない', async () => {
    const backend = await openTop()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '情報編集' }))
    const dialog = await screen.findByRole('dialog')
    await user.clear(await within(dialog).findByLabelText('名前'))
    await user.click(within(dialog).getByRole('button', { name: '更新する' }))
    expect(within(dialog).getByText('名前を入力してください')).toBeInTheDocument()
    expect(backend.calls.some((c) => c.method === 'PUT')).toBe(false)
  })

  it('「閉じる」で、保存せずにポップアップを閉じる', async () => {
    const backend = await openTop()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '情報編集' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(await within(dialog).findByLabelText('名前'), 'あ')
    await user.click(within(dialog).getByRole('button', { name: '閉じる' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(backend.calls.some((c) => c.method === 'PUT')).toBe(false)
  })

  it('登録情報を取得できなかったときは、メッセージと「閉じる」だけを表示する', async () => {
    await openTop({ failWith: (method, path) => (path === '/students/me' ? jsonResponse(500, { message: 'x', details: [] }) : null) })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '情報編集' }))
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('登録情報を取得できませんでした')).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: '更新する' })).not.toBeInTheDocument()
  })
})

describe('トップページ：ログアウト', () => {
  it('ヘッダーの「ログアウト」で、ログイン画面に戻る', async () => {
    await openTop()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'ログアウト' }))
    expect(await screen.findByLabelText('ログインID')).toBeInTheDocument()
  })
})
