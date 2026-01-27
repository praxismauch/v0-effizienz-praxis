import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useArbeitsplaetze(practiceId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId ? `/api/practices/${practiceId}/arbeitsplaetze` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  )

  return {
    arbeitsplaetze: data?.arbeitsplaetze || [],
    isLoading,
    error,
    mutate,
  }
}

export function useArbeitsmittel(practiceId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    practiceId ? `/api/practices/${practiceId}/arbeitsmittel` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  )

  return {
    arbeitsmittel: data?.arbeitsmittel || [],
    isLoading,
    error,
    mutate,
  }
}
