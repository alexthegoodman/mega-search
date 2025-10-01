"use client";

import { useState, useMemo, useCallback } from "react";
import styled from "styled-components";
import { SearchBar, SearchFormData } from "@/components/SearchBar";
import { useSearch } from "@/hooks/useSearch";
import {
  defaultNodeDocument,
  defaultPropertyDocument,
  NodeDocument,
} from "@/crawler/types";
import { ResizableTable } from "@/components/ResizableTable";

const Logo = styled.h1`
  font-size: 24px;
  font-family: "IBM Plex Mono", monospace;
  display: block;
  margin-right: 16px;
`;

const Headline = styled.h1`
  font-size: 32px;
`;

const Header = styled.header`
  padding: 20px;
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e5e5;
`;

const Body = styled.section`
  padding: 20px;
  font-family: "IBM Plex Mono", monospace;
`;

const ResultsContainer = styled.div`
  margin-top: 10px;
  width: 95vw;
  height: 80vh;
  overflow-y: auto;
  font-size: 12px;
`;

export default function Home() {
  const [searchParams, setSearchParams] = useState<SearchFormData | null>(null);
  const { data, error, isLoading } = useSearch(searchParams);

  const handleSearch = (formData: SearchFormData) => {
    setSearchParams(formData);
  };

  const columns = useMemo(() => {
    const nodeColumns = Object.keys(defaultNodeDocument).map((key) => ({
      key,
      label: key,
      defaultWidth: 150,
    }));
    const propertyColumns = Object.keys(defaultPropertyDocument).map((key) => ({
      key: `property.${key}`,
      label: key,
      defaultWidth: 150,
    }));
    return [...nodeColumns, ...propertyColumns];
  }, []);

  const renderCell = useCallback((hit: NodeDocument, columnKey: string) => {
    if (columnKey.startsWith("property.")) {
      const key = columnKey.replace("property.", "");
      const hitData = hit.property
        ? ((hit.property as any)[key] as any)
        : "---";
      return Array.isArray(hitData) ? hitData.join(", ") : String(hitData);
    }
    const hitData = hit[columnKey as keyof NodeDocument];
    return Array.isArray(hitData) ? hitData.join(", ") : String(hitData);
  }, []);

  return (
    <main>
      <Header>
        <Logo>MegaSearch</Logo>
        <SearchBar onSearch={handleSearch} />
      </Header>
      <Body>
        {isLoading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}
        {data ? (
          <ResultsContainer>
            <p>
              Found {data.estimatedTotalHits} results in {data.processingTimeMs}
              ms
            </p>
            <ResizableTable
              columns={columns}
              data={data.hits}
              renderCell={renderCell}
            />
          </ResultsContainer>
        ) : (
          <>
            <Headline>Welcome to MegaSearch</Headline>
            <p>
              Find all kinds of businesses. No email harvesting. Extremely
              efficient.
            </p>
          </>
        )}
      </Body>
    </main>
  );
}
