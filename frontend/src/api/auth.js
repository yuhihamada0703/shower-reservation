import { apiFetch } from './client.js'

/** ログインAPI（POST /login）。成功すると { message, role } が返る */
export function login(loginId, password) {
  return apiFetch('/login', { method: 'POST', body: { login_id: loginId, password } })
}

/** ログアウトAPI（POST /logout） */
export function logout() {
  return apiFetch('/logout', { method: 'POST' })
}
