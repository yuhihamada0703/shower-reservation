import { useEffect, useState } from 'react'
import { ApiError } from '../api/client.js'
import { STUDENT_EMAIL_HINT } from '../config.js'
import { getMyInfo, updateMyInfo } from '../api/students.js'
import { toProfilePayload, validateProfile } from '../validation/student.js'
import Modal from './Modal.jsx'
import TextField from './TextField.jsx'

/**
 * 登録情報の編集ポップアップ。開くときに、登録済みの情報を取得して表示する。
 * 変更したい項目だけを書き換えて「更新する」を押すと、更新して、ポップアップを閉じる。
 */
export default function ProfileModal({ onClose, onSaved }) {
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [loginId, setLoginId] = useState('')
  const [values, setValues] = useState({ name: '', grade: '', club: '', email: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    getMyInfo()
      .then((info) => {
        if (cancelled) return
        setLoginId(info.login_id)
        setValues({ name: info.name, grade: info.grade, club: info.club ?? '', email: info.email })
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoadFailed(true)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = (key) => (event) => {
    setValues((previous) => ({ ...previous, [key]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError(null)
    const found = validateProfile(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await updateMyInfo(toProfilePayload(values))
      onSaved()
    } catch (e) {
      setSubmitting(false)
      setFormError(e instanceof ApiError ? e : new ApiError(0, 'エラーが発生しました。しばらくしてからもう一度お試しください'))
    }
  }

  return (
    <Modal title="登録情報の編集" onClose={onClose}>
      {loading && <p className="note">読み込んでいます…</p>}

      {loadFailed && (
        <>
          <p className="alert" role="alert">
            登録情報を取得できませんでした
          </p>
          <div className="actions">
            <button type="button" className="button button-secondary" onClick={onClose}>
              閉じる
            </button>
          </div>
        </>
      )}

      {!loading && !loadFailed && (
        <form onSubmit={handleSubmit} noValidate>
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
          <TextField id="profile-login-id" label="学生番号（変更できません）" value={loginId} disabled onChange={() => {}} />
          <TextField
            id="profile-name"
            label="名前"
            hint="10字以内"
            value={values.name}
            onChange={handleChange('name')}
            error={errors.name}
            autoComplete="name"
          />
          <TextField
            id="profile-grade"
            label="学年"
            hint="10字以内（例：2年）"
            value={values.grade}
            onChange={handleChange('grade')}
            error={errors.grade}
          />
          <TextField
            id="profile-club"
            label="所属部活"
            hint="10字以内"
            optional
            value={values.club}
            onChange={handleChange('club')}
            error={errors.club}
          />
          <TextField
            id="profile-email"
            label="メールアドレス"
            hint={STUDENT_EMAIL_HINT}
            type="email"
            value={values.email}
            onChange={handleChange('email')}
            error={errors.email}
            autoComplete="email"
          />
          <div className="actions">
            <button type="submit" className="button button-primary" disabled={submitting}>
              更新する
            </button>
            <button type="button" className="button button-secondary" onClick={onClose}>
              閉じる
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
