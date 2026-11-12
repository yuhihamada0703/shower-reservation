import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client.js'
import { registerStudent } from '../api/students.js'
import Modal from '../components/Modal.jsx'
import TextField from '../components/TextField.jsx'
import { toRegisterPayload, validateRegister } from '../validation/student.js'

const INITIAL_VALUES = { loginId: '', password: '', name: '', grade: '', club: '', email: '' }

/** 学生登録画面（/register）。登録ボタンで、入力内容を確認するポップアップを出し、「登録する」で登録する */
export default function RegisterPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (key) => (event) => {
    setValues((previous) => ({ ...previous, [key]: event.target.value }))
  }

  // 登録ボタン：入力に問題がなければ、確認のポップアップを出す
  const handleSubmit = (event) => {
    event.preventDefault()
    setFormError(null)
    const found = validateRegister(values)
    setErrors(found)
    if (Object.keys(found).length === 0) {
      setConfirming(true)
    }
  }

  // 確認ポップアップの「登録する」：APIを呼び出して、登録する
  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await registerStudent(toRegisterPayload(values))
      navigate('/login', { state: { registered: true } })
    } catch (e) {
      // 失敗したら、ポップアップを閉じて、入力画面にエラーを表示する
      setConfirming(false)
      setSubmitting(false)
      if (e instanceof ApiError) {
        setFormError(e)
        if (e.status === 409) {
          setErrors({ loginId: e.message })
        }
      } else {
        setFormError(new ApiError(0, 'エラーが発生しました。しばらくしてからもう一度お試しください'))
      }
    }
  }

  const payload = toRegisterPayload(values)

  return (
    <main className="stage">
      <section className="plate plate-wide" aria-labelledby="register-title">
        <h1 id="register-title" className="plate-title">
          学生登録
        </h1>
        <p className="plate-sub">寮の学生が、はじめに1回だけ行います</p>

        {formError && (
          <div className="alert" role="alert">
            <p>{formError.message}</p>
            {formError.details.length > 0 && (
              <ul>
                {formError.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            id="register-login-id"
            label="学生番号（ログインID）"
            value={values.loginId}
            onChange={handleChange('loginId')}
            error={errors.loginId}
            inputMode="numeric"
            autoComplete="username"
          />
          <TextField
            id="register-password"
            label="パスワード"
            hint="10字以内"
            type="password"
            value={values.password}
            onChange={handleChange('password')}
            error={errors.password}
            autoComplete="new-password"
          />
          <TextField
            id="register-name"
            label="名前"
            hint="10字以内"
            value={values.name}
            onChange={handleChange('name')}
            error={errors.name}
            autoComplete="name"
          />
          <TextField
            id="register-grade"
            label="学年"
            hint="10字以内（例：2年）"
            value={values.grade}
            onChange={handleChange('grade')}
            error={errors.grade}
          />
          <TextField
            id="register-club"
            label="所属部活"
            hint="10字以内"
            optional
            value={values.club}
            onChange={handleChange('club')}
            error={errors.club}
          />
          <TextField
            id="register-email"
            label="メールアドレス"
            hint="学生専用のメールアドレス"
            type="email"
            value={values.email}
            onChange={handleChange('email')}
            error={errors.email}
            autoComplete="email"
          />
          <div className="actions">
            <button type="submit" className="button button-primary">
              登録する
            </button>
            <Link to="/login" className="button button-secondary">
              ログイン画面へ戻る
            </Link>
          </div>
        </form>
      </section>

      {confirming && (
        <Modal title="以下の内容で登録しますか？" onClose={() => setConfirming(false)}>
          <dl className="summary">
            <dt>学生番号</dt>
            <dd>{payload.loginId}</dd>
            <dt>パスワード</dt>
            <dd aria-label="入力済み（表示しません）">{'●'.repeat(values.password.length)}</dd>
            <dt>名前</dt>
            <dd>{payload.name}</dd>
            <dt>学年</dt>
            <dd>{payload.grade}</dd>
            <dt>所属部活</dt>
            <dd>{payload.club === '' ? '（なし）' : payload.club}</dd>
            <dt>メールアドレス</dt>
            <dd>{payload.email}</dd>
          </dl>
          <div className="actions">
            <button type="button" className="button button-primary" onClick={handleConfirm} disabled={submitting}>
              登録する
            </button>
            <button type="button" className="button button-secondary" onClick={() => setConfirming(false)}>
              修正する
            </button>
          </div>
        </Modal>
      )}
    </main>
  )
}
