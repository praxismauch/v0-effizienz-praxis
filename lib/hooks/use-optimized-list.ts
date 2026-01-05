"use client"

import { useMemo } from "react"

export function useOptimizedList<T>(items: T[], filterFn?: (item: T) => boolean, sortFn?: (a: T, b: T) => number) {
  return useMemo(() => {
    let result = items

    if (filterFn) {
      result = result.filter(filterFn)
    }

    if (sortFn) {
      result = [...result].sort(sortFn)
    }

    return result
  }, [items, filterFn, sortFn])
}
