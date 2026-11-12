// バックエンド（Spring Boot）の場所。開発中は、手元のパソコンの 8080 番で動いている
const BASE_URL = 'http://localhost:8080'

/** APIがエラーを返したとき（ステータスコードと、エラーメッセージを持つ） */
export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

// ログインが必要（401）と言われたときに呼ぶ処理。AuthProvider が登録する
let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

/**
 * APIを呼び出す。
 * credentials: 'include' で、ログイン状態（Cookie）を、毎回いっしょに送る
 */
export async function apiFetch(path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'サーバーに接続できませんでした。バックエンドが起動しているか確認してください')
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    // 本文のない応答は、そのまま null にする
  }

  if (!response.ok) {
    // ログインが切れていたら、ログイン画面に戻す（ログインAPI自身の401は、パスワードの間違いなので除く）
    if (response.status === 401 && path !== '/login' && unauthorizedHandler) {
      unauthorizedHandler()
    }
    throw new ApiError(response.status, data?.message ?? 'エラーが発生しました', data?.details ?? [])
  }
  return data
}
