import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.jsx'
import AuthProvider from '../auth/AuthProvider.jsx'

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function renderApp(path = '/login') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  globalThis.fetch = vi.fn()
})

function mockTeacherApis() {
  fetch.mockImplementation(async (url) => {
    if (url.endsWith('/students')) return jsonResponse(200, { students: [] })
    return jsonResponse(200, { message: 'ok' })
  })
}

function mockTopPageApis() {
  fetch.mockImplementation(async (url) => {
    if (url.endsWith('/usage')) return jsonResponse(200, { rooms: [] })
    if (url.endsWith('/reservations')) return jsonResponse(200, { reservations: [] })
    return jsonResponse(200, { message: 'ok' })
  })
}

describe('ログイン画面', () => {
  it('未入力のときは、APIを呼ばずに、エラーメッセージを表示する', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'ログイン' }))
    expect(screen.getByRole('alert')).toHaveTextContent('ログインIDとパスワードを入力してください')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('学生がログインすると、credentials付きで /login を呼び、トップページへ移動する', async () => {
    fetch.mockImplementation(async (url) => {
      if (url.endsWith('/login')) return jsonResponse(200, { message: 'ログインしました', role: 'STUDENT' })
      if (url.endsWith('/usage')) return jsonResponse(200, { rooms: [] })
      return jsonResponse(200, { reservations: [] })
    })
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('ログインID'), '20230001')
    await user.type(screen.getByLabelText('パスワード'), 'pass1234')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(await screen.findByRole('heading', { name: '使用状況' })).toBeInTheDocument()
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('http://localhost:8080/login')
    expect(options.method).toBe('POST')
    expect(options.credentials).toBe('include')
    expect(JSON.parse(options.body)).toEqual({ login_id: '20230001', password: 'pass1234' })
    expect(sessionStorage.getItem('shower-reservation.role')).toBe('STUDENT')
  })

  it('教師がログインすると、学生一覧画面へ移動する', async () => {
    fetch.mockImplementation(async (url) => {
      if (url.endsWith('/login')) return jsonResponse(200, { message: 'ログインしました', role: 'TEACHER' })
      return jsonResponse(200, { students: [] })
    })
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('ログインID'), 'user')
    await user.type(screen.getByLabelText('パスワード'), 'admin123')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))
    expect(await screen.findByRole('heading', { name: '学生一覧' })).toBeInTheDocument()
  })

  it('パスワードが違うとき（401）は、サーバーのメッセージを表示して、画面にとどまる', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(401, { message: 'ログインIDまたはパスワードが違います', details: [] }))
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('ログインID'), 'user')
    await user.type(screen.getByLabelText('パスワード'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('ログインIDまたはパスワードが違います')
    expect(screen.getByRole('heading', { name: '予約管理システム' })).toBeInTheDocument()
  })

  it('バックエンドに接続できないときは、そのことを表示する', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('ログインID'), 'user')
    await user.type(screen.getByLabelText('パスワード'), 'admin123')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('サーバーに接続できませんでした')
  })

  it('「学生登録画面へ」で学生登録画面に移動する', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('link', { name: '学生登録画面へ' }))
    expect(screen.getByRole('heading', { name: '学生登録' })).toBeInTheDocument()
  })
})

describe('学生登録画面', () => {
  async function fillValid(user) {
    await user.type(screen.getByLabelText(/学生番号/), '20250001')
    await user.type(screen.getByLabelText('パスワード'), 'pass1234')
    await user.type(screen.getByLabelText('名前'), 'テスト 太郎')
    await user.type(screen.getByLabelText('学年'), '1年')
    await user.type(screen.getByLabelText('メールアドレス'), 's20250001@example.ac.jp')
  }

  it('未入力のまま登録すると、項目ごとにエラーを表示して、ポップアップは出ない', async () => {
    const user = userEvent.setup()
    renderApp('/register')
    await user.click(screen.getByRole('button', { name: '登録する' }))
    expect(screen.getByText('学生番号を入力してください')).toBeInTheDocument()
    expect(screen.getByText('パスワードを入力してください')).toBeInTheDocument()
    expect(screen.getByText('名前を入力してください')).toBeInTheDocument()
    expect(screen.getByText('学年を入力してください')).toBeInTheDocument()
    expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument()
    expect(screen.queryByText('所属部活を入力してください')).not.toBeInTheDocument() // 所属部活は任意
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('10字を超える入力、数字以外の学生番号、メールの形式違いを、画面設計書のメッセージで知らせる', async () => {
    const user = userEvent.setup()
    renderApp('/register')
    await user.type(screen.getByLabelText(/学生番号/), 'abc123')
    await user.type(screen.getByLabelText('パスワード'), '12345678901')
    await user.type(screen.getByLabelText('名前'), '12345678901')
    await user.type(screen.getByLabelText('学年'), '12345678901')
    await user.type(screen.getByLabelText(/所属部活/), '12345678901')
    await user.type(screen.getByLabelText('メールアドレス'), 'abc')
    await user.click(screen.getByRole('button', { name: '登録する' }))
    expect(screen.getByText('学生番号を正しく入力してください')).toBeInTheDocument()
    expect(screen.getByText('パスワードは10字以内で入力してください')).toBeInTheDocument()
    expect(screen.getByText('名前は10字以内で入力してください')).toBeInTheDocument()
    expect(screen.getByText('学年は10字以内で入力してください')).toBeInTheDocument()
    expect(screen.getByText('所属部活は10字以内で入力してください')).toBeInTheDocument()
    expect(screen.getByText('学生専用のメールアドレスを入力してください')).toBeInTheDocument()
  })

  it('入力が正しければ、確認ポップアップを出す（パスワードは伏せ字）。「修正する」で閉じて、入力は残る', async () => {
    const user = userEvent.setup()
    renderApp('/register')
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: '登録する' }))

    const dialog = screen.getByRole('dialog', { name: '以下の内容で登録しますか？' })
    expect(within(dialog).getByText('20250001')).toBeInTheDocument()
    expect(within(dialog).getByText('テスト 太郎')).toBeInTheDocument()
    expect(within(dialog).getByText('（なし）')).toBeInTheDocument() // 所属部活は空欄
    expect(within(dialog).getByText('●●●●●●●●')).toBeInTheDocument()
    expect(dialog).not.toHaveTextContent('pass1234')
    expect(fetch).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: '修正する' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('名前')).toHaveValue('テスト 太郎')
  })

  it('Escキーでもポップアップを閉じられる', async () => {
    const user = userEvent.setup()
    renderApp('/register')
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: '登録する' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('ポップアップの「登録する」で、API仕様書どおりの項目名で POST /students を呼び、ログイン画面へ戻る', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(201, { message: '登録しました', student: { login_id: '20250001' } }))
    const user = userEvent.setup()
    renderApp('/register')
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: '登録する' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '登録する' }))

    expect(await screen.findByRole('status')).toHaveTextContent('登録しました。学生番号とパスワードでログインしてください')
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('http://localhost:8080/students')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({
      login_id: '20250001',
      password: 'pass1234',
      name: 'テスト 太郎',
      grade: '1年',
      club: '',
      email: 's20250001@example.ac.jp',
    })
  })

  it('登録済みの学生番号（409）のときは、ポップアップを閉じて、学生番号の欄にエラーを表示する', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(409, { message: 'この学生番号はすでに登録されています', details: [] }))
    const user = userEvent.setup()
    renderApp('/register')
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: '登録する' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '登録する' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getAllByText('この学生番号はすでに登録されています').length).toBeGreaterThan(0)
    expect(screen.getByLabelText(/学生番号/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('サーバー側の入力チェック（400）のメッセージも、一覧で表示する', async () => {
    fetch.mockResolvedValueOnce(
      jsonResponse(400, { message: '入力内容に誤りがあります', details: ['学生専用のメールアドレスを入力してください'] }),
    )
    const user = userEvent.setup()
    renderApp('/register')
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: '登録する' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '登録する' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('入力内容に誤りがあります')
    expect(alert).toHaveTextContent('学生専用のメールアドレスを入力してください')
  })

  it('「ログイン画面へ戻る」でログイン画面に移動する', async () => {
    const user = userEvent.setup()
    renderApp('/register')
    await user.click(screen.getByRole('link', { name: 'ログイン画面へ戻る' }))
    expect(screen.getByRole('heading', { name: '予約管理システム' })).toBeInTheDocument()
  })
})

describe('画面の出し分け（ログイン状態と権限）', () => {
  it('ログインしていないと、/top や /students はログイン画面に戻される', () => {
    renderApp('/top')
    expect(screen.getByRole('heading', { name: '予約管理システム' })).toBeInTheDocument()
  })

  it('学生が /students を開こうとすると、トップページに戻される', async () => {
    mockTopPageApis()
    sessionStorage.setItem('shower-reservation.role', 'STUDENT')
    renderApp('/students')
    expect(await screen.findByRole('heading', { name: '使用状況' })).toBeInTheDocument()
  })

  it('教師が /top を開こうとすると、学生一覧画面に戻される', async () => {
    mockTeacherApis()
    sessionStorage.setItem('shower-reservation.role', 'TEACHER')
    renderApp('/top')
    expect(await screen.findByRole('heading', { name: '学生一覧' })).toBeInTheDocument()
  })

  it('ログイン中に /login を開くと、自分の画面へ移動する', async () => {
    mockTopPageApis()
    sessionStorage.setItem('shower-reservation.role', 'STUDENT')
    renderApp('/login')
    expect(await screen.findByRole('heading', { name: '使用状況' })).toBeInTheDocument()
  })

  it('ログアウトすると、/logout を呼んで、ログイン画面へ戻り、ログイン状態を消す', async () => {
    fetch.mockImplementation(async (url) => {
      if (url.endsWith('/logout')) return jsonResponse(200, { message: 'ログアウトしました' })
      if (url.endsWith('/usage')) return jsonResponse(200, { rooms: [] })
      return jsonResponse(200, { reservations: [] })
    })
    sessionStorage.setItem('shower-reservation.role', 'STUDENT')
    const user = userEvent.setup()
    renderApp('/top')
    await user.click(screen.getByRole('button', { name: 'ログアウト' }))
    expect(await screen.findByLabelText('ログインID')).toBeInTheDocument()
    expect(fetch.mock.calls.some(([url]) => url === 'http://localhost:8080/logout')).toBe(true)
    expect(sessionStorage.getItem('shower-reservation.role')).toBeNull()
  })

  it('APIが401（ログインが切れた）を返すと、ログイン状態を消して、ログイン画面へ戻す', async () => {
    const { apiFetch } = await import('../api/client.js')
    mockTopPageApis()
    sessionStorage.setItem('shower-reservation.role', 'STUDENT')
    renderApp('/top')
    await screen.findByRole('heading', { name: '使用状況' })
    fetch.mockResolvedValueOnce(jsonResponse(401, { message: 'ログインが必要です', details: [] }))
    await expect(apiFetch('/reservations')).rejects.toMatchObject({ status: 401 })
    expect(await screen.findByLabelText('ログインID')).toBeInTheDocument()
    expect(sessionStorage.getItem('shower-reservation.role')).toBeNull()
  })
})
