/** ラベル・入力欄・エラーメッセージを、ひとまとめにした部品 */
export default function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  optional = false,
  disabled = false,
  type = 'text',
  autoComplete,
  inputMode,
}) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {optional && <span className="field-optional">任意</span>}
      </label>
      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      <input
        id={id}
        className="field-input"
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
      />
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
