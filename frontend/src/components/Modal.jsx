import { useEffect, useRef } from 'react'

/**
 * 画面の上に重ねて表示するポップアップ。
 * 表示した瞬間に、ポップアップへ操作の位置（フォーカス）を移し、Escキーで閉じられる。
 * 閉じたあとは、開く前の位置へ、フォーカスを戻す。
 */
export default function Modal({ title, onClose, children }) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previouslyFocused = document.activeElement
    dialogRef.current?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [])

  return (
    <div className="overlay">
      <div
        ref={dialogRef}
        className="plate plate-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <h2 id="modal-title" className="dialog-title">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
