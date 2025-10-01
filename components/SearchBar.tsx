"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import styled from "styled-components";

const SearchForm = styled.form`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: calc(100vw - 300px);
`;

const SearchInput = styled.input`
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

export interface SearchFormData {
  query: string;
  type?: "nodes" | "properties";
  vector?: boolean;
  industry?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface SearchBarProps {
  onSearch: (data: SearchFormData) => void;
  defaultValues?: Partial<SearchFormData>;
}

export function SearchBar({ onSearch, defaultValues }: SearchBarProps) {
  const { register, handleSubmit } = useForm<SearchFormData>({
    defaultValues: {
      query: "",
      type: "nodes",
      vector: false,
      ...defaultValues,
    },
  });

  return (
    <SearchForm onSubmit={handleSubmit(onSearch)}>
      <SearchInput
        type="text"
        placeholder="Search..."
        {...register("query", { required: true })}
      />
      <SearchButton type="submit">
        <MagnifyingGlassIcon size={18} />
      </SearchButton>
    </SearchForm>
  );
}
