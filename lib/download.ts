/** Hands the browser a text file to save. Browser only; a no-op anywhere else. */
export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8'): void {
  if (typeof document === 'undefined') return
  const url = URL.createObjectURL(new Blob([text], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
