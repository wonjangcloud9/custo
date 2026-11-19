import type { Member } from './members'

/**
 * Member birthdays as a yearly all-day .ics: each event starts at this year's (or next year's) date so
 * calendars don't fill with past years; a reminder at 09:00 the day before. Used by the birthday ring
 * (all eight) and each member page (one).
 */
export function birthdaysIcs(list: Member[], siteMembersUrl: string, now = Date.now()): string {
  const today = new Date(now + 9 * 3600e3).toISOString().slice(0, 10)
  const ymd = (d: string) => d.replace(/-/g, '')
  const esc = (t: string) => t.replace(/[\;,]/g, (c) => '\\' + c)
  const stamp = new Date(now).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const ev = list.flatMap((m) => {
    const md = m.birthday.slice(5)
    const y = +today.slice(0, 4)
    const first = `${today.slice(5) <= md ? y : y + 1}-${md}`
    const next = new Date(`${first}T00:00:00Z`); next.setUTCDate(next.getUTCDate() + 1)
    return ['BEGIN:VEVENT', `UID:birthday-${m.id}@custo`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(first)}`, `DTEND;VALUE=DATE:${ymd(next.toISOString().slice(0, 10))}`,
      'RRULE:FREQ=YEARLY', `SUMMARY:${esc(`🎂 ${m.ja} (${m.ko}) 생일`)}`, `DESCRIPTION:${esc(`CUTIE STREET ${m.ko} 생일 — ${siteMembersUrl}${m.id}`)}`, `URL:${siteMembersUrl}${m.id}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(`내일은 ${m.ko} 생일 🎂`)}`, 'TRIGGER:-PT15H', 'END:VALARM', 'END:VEVENT']
  })
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//custo//cutie street fan hub//KO', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${list.length > 1 ? 'CUTIE STREET 멤버 생일' : `${list[0].ko} 생일`}`, ...ev, 'END:VCALENDAR'].join('\r\n')
}

export function downloadIcs(ics: string, filename: string): void {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' })); a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1500)
}
