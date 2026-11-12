import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext.js'
import { homePath } from '../auth/paths.js'

/** 指定した種類の利用者だけに、画面を見せる。ログインしていなければ、ログイン画面へ。種類が違えば、自分の画面へ */
export default function RequireRole({ role, children }) {
  const auth = useAuth()
  if (!auth.role) {
    return <Navigate to="/login" replace />
  }
  if (auth.role !== role) {
    return <Navigate to={homePath(auth.role)} replace />
  }
  return children
}
