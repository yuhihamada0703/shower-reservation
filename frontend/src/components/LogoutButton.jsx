import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../api/auth.js'
import { useAuth } from '../auth/authContext.js'

/** ログアウトボタン。サーバー側のログイン状態を消してから、ログイン画面へ戻る */
export default function LogoutButton({ className = 'button button-secondary' }) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    setBusy(true)
    try {
      await logout()
    } catch {
      // すでにログインが切れている場合なども、画面はログイン画面へ戻す
    } finally {
      signOut()
      navigate('/login', { replace: true })
    }
  }

  return (
    <button type="button" className={className} onClick={handleClick} disabled={busy}>
      ログアウト
    </button>
  )
}
