// Shared helpers for the canvas share cards (CountdownCard; BirthdayCard has its own copy of the same ideas).
// Lessons baked in: load the font subsets for the exact text first (#172), trace rounded rects by hand on
// Safari < 16 (#174), and shrink single lines until they fit the card (#174).

export async function loadFonts(text: string, fonts: string[]): Promise<void> {
  try { await Promise.all(fonts.map((f) => document.fonts.load(f, text))) } catch { /* system fonts */ }
}

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath()
  if (g.roundRect) { g.roundRect(x, y, w, h, r); return }
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath()
}

/** Draw one centred line, shrinking the font 2px at a time until it is at most maxW wide. */
export function fitText(g: CanvasRenderingContext2D, text: string, family: string, size: number, x: number, y: number, maxW: number, weight = 700): void {
  let px = size
  do { g.font = `${weight} ${px}px ${family}`; px -= 2 } while (g.measureText(text).width > maxW && px > 18)
  g.fillText(text, x, y)
}

/** Phones: the share sheet with the image; elsewhere (or if sharing files isn't possible): a PNG download. */
export async function deliver(blob: Blob, filename: string, title: string): Promise<'shared' | 'saved' | 'cancelled'> {
  const file = new File([blob], filename, { type: 'image/png' })
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); return 'shared' }
    catch (e) { if ((e as Error).name === 'AbortError') return 'cancelled' }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1500)
  return 'saved'
}
