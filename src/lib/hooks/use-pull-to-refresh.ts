"use client"

import { useEffect, useRef, useState } from "react"

const TRIGGER = 70
const MAX = 120

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const active = useRef(false)

  useEffect(() => {
    function isAtTop() {
      return (document.scrollingElement?.scrollTop ?? window.scrollY) <= 0
    }

    function onStart(e: TouchEvent) {
      if (!isAtTop() || refreshing) return
      startY.current = e.touches[0].clientY
      active.current = true
    }
    function onMove(e: TouchEvent) {
      if (!active.current || startY.current == null) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) {
        setPull(0)
        return
      }
      if (!isAtTop()) {
        active.current = false
        setPull(0)
        return
      }
      const damped = Math.min(MAX, dy * 0.5)
      setPull(damped)
      if (damped > 5) e.preventDefault()
    }
    async function onEnd() {
      if (!active.current) return
      active.current = false
      const shouldFire = pull >= TRIGGER
      if (shouldFire) {
        setRefreshing(true)
        setPull(TRIGGER)
        try {
          await onRefresh()
        } finally {
          setRefreshing(false)
          setPull(0)
        }
      } else {
        setPull(0)
      }
      startY.current = null
    }

    window.addEventListener("touchstart", onStart, { passive: true })
    window.addEventListener("touchmove", onMove, { passive: false })
    window.addEventListener("touchend", onEnd)
    window.addEventListener("touchcancel", onEnd)
    return () => {
      window.removeEventListener("touchstart", onStart)
      window.removeEventListener("touchmove", onMove)
      window.removeEventListener("touchend", onEnd)
      window.removeEventListener("touchcancel", onEnd)
    }
  }, [pull, refreshing, onRefresh])

  return { pull, refreshing, trigger: TRIGGER }
}
