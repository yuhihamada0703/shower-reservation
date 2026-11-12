import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../api/auth.js'
import { ApiError } from '../api/client.js'
import { useAuth } from '../auth/authContext.js'
import { homePath } from '../auth/paths.js'
import TextField from '../components/TextField.jsx'

/** ログイン画面（/login）。学生は学生番号、教師は共用のIDで、ログインする */
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // すでにログイン中なら、自分の画面へ
  if (auth.role) {
    return <Navigate to={homePath(auth.role)} replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loginId.trim() === '' || password === '') {
      setError('ログインIDとパスワードを入力してください')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const result = await login(loginId.trim(), password)
      auth.signIn(result.role)
      navigate(homePath(result.role), { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'エラーが発生しました。しばらくしてからもう一度お試しください')
      setSubmitting(false)
    }
  }

  return (
    <main className="stage">
      <section className="plate" aria-labelledby="login-title">
        <h1 id="login-title" className="plate-title">
          予約管理システム
        </h1>
        <p className="plate-sub">学生寮のシャワー室</p>

        {location.state?.registered && (
          <p className="notice" role="status">
            登録しました。学生番号とパスワードでログインしてください
          </p>
        )}
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            id="login-id"
            label="ログインID"
            hint="学生は、学生番号を入力します"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            autoComplete="username"
          />
          <TextField
            id="login-password"
            label="パスワード"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
          <div className="actions">
            <button type="submit" className="button button-primary" disabled={submitting}>
              ログイン
            </button>
            <Link to="/register" className="button button-secondary">
              学生登録画面へ
            </Link>
          </div>
        </form>
      </section>
    </main>
  )
}
