import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.jsx'
import AuthProvider from '../auth/AuthProvider.jsx'

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

const BASE = 'http://localhost:8080'

function createBackend(overrides = {}) {
  const state = {
    students: [
      { login_id: '20220005', name: '鈴木 一郎', grade: '3年', club: null, email: 's20220005@example.ac.jp' },
      { login_id: '20230001', name: '山田 太郎', grade: '2年', club: 'サッカー部', email: 's20230001@example.ac.jp' },
      { login_id: '20240012', name: '佐藤 花子', grade: '1年', club: '吹奏楽部', email: 's20240012@example.ac.jp' },
    ],
    calls: [],
    failWith: null,
    ...overrides,
  }
  fetch.mockImplementation(async (url, options = {}) => {
    const path = url.replace(BASE, '')
    const method = options.method ?? 'GET'
    state.calls.push({ method, path })
    const failure = state.failWith?.(method, path)
    if (failure) return failure
    if (method === 'GET' && path === '/students') return jsonResponse(200, { students: state.students })
    if (method === 'DELETE' && path.startsWith('/students/')) {
      const id = path.split('/').pop()
      if (!state.students.some((s) => s.login_id === id)) return jsonResponse(404, { message: '対象のデータが見つかりません', details: [] })
      state.students = state.students.filter((s) => s.login_id !== id)
      return jsonResponse(200, { message: '削除しました' })
    }
    if (method === 'POST' && path === '/logout') return jsonResponse(200, { message: 'ログアウトしました' })
    return jsonResponse(404, { message: 'not found', details: [] })
  })
  return state
}

function renderList() {
  sessionStorage.setItem('shower-reservation.role', 'TEACHER')
  return render(
    <MemoryRouter initialEntries={['/students']}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function openList(overrides) {
  const backend = createBackend(overrides)
  renderList()
  await screen.findByRole('heading', { name: '学生一覧' })
  return backend
}

beforeEach(() => {
  globalThis.fetch = vi.fn()
})

describe('学生一覧画面（教師用）', () => {
  it('登録されている学生を、名前・学年・所属部活・メールアドレスで一覧表示する', async () => {
    await openList()
    const rows = await screen.findAllByRole('row')
    expect(rows).toHaveLength(4) // 見出し1行 + 学生3人
    expect(rows[1]).toHaveTextContent('鈴木 一郎')
    expect(rows[1]).toHaveTextContent('3年')
    expect(rows[2]).toHaveTextContent('山田 太郎')
    expect(rows[2]).toHaveTextContent('サッカー部')
    expect(rows[2]).toHaveTextContent('s20230001@example.ac.jp')
    expect(screen.getByText('登録数：3人')).toBeInTheDocument()
    expect(screen.getByText('教師用')).toBeInTheDocument()
  })

  it('学生がいないときは、メッセージを表示する', async () => {
    await openList({ students: [] })
    expect(await screen.findByText('登録されている学生は、まだいません。')).toBeInTheDocument()
  })

  it('一覧を取得できなかったときは、メッセージを表示する', async () => {
    createBackend({ failWith: (method, path) => (path === '/students' ? jsonResponse(500, { message: 'x', details: [] }) : null) })
    renderList()
    expect(await screen.findByRole('alert')).toHaveTextContent('学生一覧を取得できませんでした')
  })

  it('「削除」を押すと、確認ポップアップを出す。まだ、削除のAPIは呼ばない', async () => {
    const backend = await openList()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: '山田 太郎を削除' }))
    const dialog = screen.getByRole('dialog', { name: 'この学生を削除しますか？' })
    expect(within(dialog).getByText('山田 太郎')).toBeInTheDocument()
    expect(within(dialog).getByText('サッカー部')).toBeInTheDocument()
    expect(dialog).toHaveTextContent('この学生の予約も、一緒に削除されます')
    expect(backend.calls.some((c) => c.method === 'DELETE')).toBe(false)
  })

  it('「キャンセル」と Escキーで、削除せずに、ポップアップを閉じる', async () => {
    const backend = await openList()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: '山田 太郎を削除' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'キャンセル' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '佐藤 花子を削除' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(backend.calls.some((c) => c.method === 'DELETE')).toBe(false)
    expect(screen.getAllByRole('row')).toHaveLength(4)
  })

  it('「削除する」で、DELETE /students/{login_id} を呼び、一覧から消えて、メッセージを表示する', async () => {
    const backend = await openList()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: '山田 太郎を削除' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '削除する' }))

    expect(await screen.findByRole('status')).toHaveTextContent('山田 太郎さんを削除しました')
    expect(backend.calls.some((c) => c.method === 'DELETE' && c.path === '/students/20230001')).toBe(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('山田 太郎')).not.toBeInTheDocument()
    expect(screen.getByText('登録数：2人')).toBeInTheDocument()
  })

  it('すでに削除されていた場合（404）は、メッセージを表示して、一覧を取得し直す', async () => {
    const backend = await openList()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: '佐藤 花子を削除' }))
    backend.students = backend.students.filter((s) => s.login_id !== '20240012') // 別の画面で、先に削除された
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '削除する' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('対象の学生が見つかりませんでした。一覧を更新しました')
    await waitFor(() => expect(screen.queryByText('佐藤 花子')).not.toBeInTheDocument())
  })

  it('削除に失敗したときは、メッセージを表示して、ポップアップを閉じる', async () => {
    await openList({
      failWith: (method) => (method === 'DELETE' ? jsonResponse(500, { message: 'x', details: [] }) : null),
    })
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: '山田 太郎を削除' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '削除する' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('削除できませんでした。もう一度お試しください')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('「ログアウト」で、ログイン画面に戻る', async () => {
    await openList()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'ログアウト' }))
    expect(await screen.findByLabelText('ログインID')).toBeInTheDocument()
  })
})
