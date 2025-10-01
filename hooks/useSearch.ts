import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { SearchFormData } from "@/components/SearchBar";

export interface SearchResult {
  hits: any[];
  estimatedTotalHits: number;
  limit: number;
  offset: number;
  processingTimeMs: number;
  query: string;
}

export function useSearch(params: SearchFormData | null) {
  const buildUrl = (data: SearchFormData) => {
    const searchParams = new URLSearchParams();

    if (data.query) searchParams.set("q", data.query);
    if (data.type) searchParams.set("type", data.type);
    if (data.vector) searchParams.set("vector", "true");
    if (data.industry) searchParams.set("industry", data.industry);
    if (data.city) searchParams.set("city", data.city);
    if (data.state) searchParams.set("state", data.state);
    if (data.country) searchParams.set("country", data.country);

    return `/api/search?${searchParams.toString()}`;
  };

  const url = params?.query ? buildUrl(params) : null;

  const { data, error, isLoading, mutate } = useSWR<SearchResult>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}
