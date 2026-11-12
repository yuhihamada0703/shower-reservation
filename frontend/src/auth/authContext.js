import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

/** ログイン中の利用者の種類（'STUDENT' / 'TEACHER' / null）と、ログイン・ログアウトの操作を取り出す */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth は AuthProvider の中で使います')
  }
  return context
}
