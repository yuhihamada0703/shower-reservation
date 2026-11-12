import { useCallback, useEffect, useMemo, useState } from 'react'
import { setUnauthorizedHandler } from '../api/client.js'
import { AuthContext } from './authContext.js'

const STORAGE_KEY = 'shower-reservation.role'

/**
 * ログイン中の利用者の種類を、画面全体で共有する。
 * ブラウザを更新しても、ログイン状態が分かるように、sessionStorage にも残す（タブを閉じると消える）。
 * 本当のログイン状態は、サーバーのセッションが持っていて、切れていれば、APIが401を返す。
 */
export default function AuthProvider({ children }) {
  const [role, setRole] = useState(() => sessionStorage.getItem(STORAGE_KEY))

  const signIn = useCallback((newRole) => {
    sessionStorage.setItem(STORAGE_KEY, newRole)
    setRole(newRole)
  }, [])

  const signOut = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setRole(null)
  }, [])

  // APIが「ログインが必要」（401）と返したら、画面側のログイン状態も消す
  useEffect(() => {
    setUnauthorizedHandler(signOut)
    return () => setUnauthorizedHandler(null)
  }, [signOut])

  const value = useMemo(() => ({ role, signIn, signOut }), [role, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
