import useSWR from "swr"

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export function useRoomsData(practiceId: string | undefined) {
  const roomsUrl = practiceId ? `/api/practices/${practiceId}/rooms` : null

  const { data: roomsData, error, mutate } = useSWR(
    roomsUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  const isLoading = !roomsData && !error

  return {
    data: {
      rooms: roomsData?.rooms || [],
    },
    isLoading,
    error,
    refresh: mutate,
    mutate,
  }
}
