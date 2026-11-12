import { Navigate, Route, Routes } from 'react-router-dom'
import RequireRole from './components/RequireRole.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import TopPage from './pages/TopPage.jsx'
import StudentListPage from './pages/StudentListPage.jsx'

/** 画面遷移図のとおりに、URLと画面を対応づける */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* 学生だけが開ける画面 */}
      <Route
        path="/top"
        element={
          <RequireRole role="STUDENT">
            <TopPage />
          </RequireRole>
        }
      />
      {/* 教師だけが開ける画面 */}
      <Route
        path="/students"
        element={
          <RequireRole role="TEACHER">
            <StudentListPage />
          </RequireRole>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
