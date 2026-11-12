import { afterEach, describe, expect, it, vi } from 'vitest'
import { isStudentEmailDomain } from '../config.js'
import { validateProfile, validateRegister } from '../validation/student.js'

const valid = { loginId: '20250001', password: 'pass1234', name: 'テスト 太郎', grade: '1年', club: '', email: 's20250001@example.ac.jp' }

describe('学生専用のメールアドレスの判定', () => {
  it('認めているドメインは、大文字・小文字を区別せずに、学生専用として扱う', () => {
    expect(isStudentEmailDomain('s20250001@example.ac.jp')).toBe(true)
    expect(isStudentEmailDomain('S20250001@EXAMPLE.AC.JP')).toBe(true)
  })

  it('ほかのドメイン、サブドメイン、似たドメインは、学生専用として扱わない', () => {
    expect(isStudentEmailDomain('a@gmail.com')).toBe(false)
    expect(isStudentEmailDomain('b@gamil.com')).toBe(false)
    expect(isStudentEmailDomain('a@mail.example.ac.jp')).toBe(false)
    expect(isStudentEmailDomain('a@example.ac.jp.evil.com')).toBe(false)
    expect(isStudentEmailDomain('a@xexample.ac.jp')).toBe(false)
    expect(isStudentEmailDomain('abc')).toBe(false)
  })

  it('学生登録の入力チェックで、学生専用ではないドメインは、エラーになる', () => {
    expect(validateRegister(valid)).toEqual({})
    expect(validateRegister({ ...valid, email: 'a@gmail.com' }).email).toBe('学生専用のメールアドレスを入力してください')
  })

  it('登録情報の編集の入力チェックでも、同じように、エラーになる', () => {
    expect(validateProfile({ name: '山田', grade: '2年', club: '', email: 'a@example.ac.jp' })).toEqual({})
    expect(validateProfile({ name: '山田', grade: '2年', club: '', email: 'a@gmail.com' }).email).toBe(
      '学生専用のメールアドレスを入力してください',
    )
  })
})

describe('ドメインの設定（環境変数）', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('環境変数で、複数のドメインを指定できる（空白・大文字は、取り除いて・小文字にそろえる）', async () => {
    vi.stubEnv('VITE_STUDENT_EMAIL_DOMAINS', ' School.ac.jp , other.jp ')
    vi.resetModules()
    const config = await import('../config.js')
    expect(config.STUDENT_EMAIL_DOMAINS).toEqual(['school.ac.jp', 'other.jp'])
    expect(config.isStudentEmailDomain('a@school.ac.jp')).toBe(true)
    expect(config.isStudentEmailDomain('a@other.jp')).toBe(true)
    expect(config.isStudentEmailDomain('a@example.ac.jp')).toBe(false)
    expect(config.STUDENT_EMAIL_HINT).toBe('学生専用のメールアドレス（@school.ac.jp、@other.jp）')
  })
})
