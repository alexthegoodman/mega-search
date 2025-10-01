"use client";

import { useState } from "react";
import styled from "styled-components";
import { SearchBar, SearchFormData } from "@/components/SearchBar";
import { useSearch } from "@/hooks/useSearch";
import {
  defaultNodeDocument,
  defaultPropertyDocument,
  NodeDocument,
} from "@/crawler/types";

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
  overflow-x: scroll;
  font-size: 12px;
`;

const ResultItem = styled.div`
  padding: 12px;
  border: 1px solid #e5e5e5;
  margin-bottom: 8px;
  border-radius: 4px;
`;

const TableRow = styled.div`
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid #e5e5e5;
`;

const TableCell = styled.div`
  flex: 1;
  padding: 8px;
  border-right: 1px solid #e5e5e5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 100px;
  font-size: 10px;

  &:last-child {
    border-right: none;
  }
`;

export default function Home() {
  const [searchParams, setSearchParams] = useState<SearchFormData | null>(null);
  const { data, error, isLoading } = useSearch(searchParams);

  const handleSearch = (formData: SearchFormData) => {
    setSearchParams(formData);
  };

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
            <TableRow>
              {Object.keys(defaultNodeDocument).map((key) => (
                <TableCell key={key}>
                  <span>{key}</span>
                </TableCell>
              ))}
              {Object.keys(defaultPropertyDocument).map((key) => (
                <TableCell key={key}>
                  <span>{key}</span>
                </TableCell>
              ))}
            </TableRow>
            <hr />
            {data.hits.map((hit: NodeDocument, index: number) => (
              <TableRow key={index}>
                {Object.keys(defaultNodeDocument).map((key) => {
                  let hitData = hit[key as keyof NodeDocument];
                  return (
                    <TableCell key={key}>
                      <span>
                        {Array.isArray(hitData)
                          ? hitData.join(", ")
                          : String(hitData)}
                      </span>
                    </TableCell>
                  );
                })}
                {Object.keys(defaultPropertyDocument).map((key) => {
                  let hitData = hit.property
                    ? ((hit.property as any)[key] as any)
                    : "---";
                  return (
                    <TableCell key={key}>
                      <span>
                        {Array.isArray(hitData)
                          ? hitData.join(", ")
                          : String(hitData)}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
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
