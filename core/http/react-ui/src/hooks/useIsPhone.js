import { useEffect, useState } from 'react'

// Matches the stylesheet's phone breakpoint (max-width: 639px). Used where a
// phone gets different structure, not just different styling.
export const PHONE_QUERY = '(max-width: 639px)'

export function useIsPhone() {
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(PHONE_QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia?.(PHONE_QUERY)
    if (!mq) return
    const on = () => setPhone(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return phone
}
