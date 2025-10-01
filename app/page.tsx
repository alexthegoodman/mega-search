"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import styled from "styled-components";

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

const SearchBar = styled.input`
  width: 100%;
  padding: 10px;
  font-size: 16px;
  box-sizing: border-box;
`;

const SearchButton = styled.button`
  padding: 8px 12px;
  font-size: 16px;
  cursor: pointer;
`;

const Body = styled.section`
  padding: 20px;
  font-family: "IBM Plex Mono", monospace;
`;

export default function Home() {
  return (
    <main>
      <Header>
        <Logo>MegaSearch</Logo>
        <SearchButton>
          <MagnifyingGlassIcon size={18} />
        </SearchButton>
        <SearchBar type="text" placeholder="Search..." />
      </Header>
      <Body>
        <Headline>Welcome to MegaSearch</Headline>
        <p>
          Find all kinds of businesses. No email harvesting. Extremely
          efficient.
        </p>
      </Body>
    </main>
  );
}
