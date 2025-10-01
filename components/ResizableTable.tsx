"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import styled from "styled-components";

const TableContainer = styled.div`
  overflow-x: auto;
  font-size: 12px;
`;

const TableWrapper = styled.div`
  display: inline-block;
  min-width: 100%;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid #e5e5e5;
`;

const Cell = styled.div<{ $width: number }>`
  padding: 8px;
  border-right: 1px solid #e5e5e5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  width: ${(props) => props.$width}px;
  min-width: ${(props) => props.$width}px;
  max-width: ${(props) => props.$width}px;
  position: relative;

  &:last-child {
    border-right: none;
  }
`;

const HeaderCell = styled(Cell)`
  font-weight: 600;
  user-select: none;
`;

const ResizeHandle = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: col-resize;
  z-index: 1;

  &:hover {
    background-color: rgba(0, 123, 255, 0.1);
  }

  &:active {
    background-color: rgba(0, 123, 255, 0.2);
  }
`;

interface Column {
  key: string;
  label: string;
  defaultWidth?: number;
}

interface ResizableTableProps {
  columns: Column[];
  data: any[];
  renderCell: (item: any, columnKey: string) => React.ReactNode;
}

export function ResizableTable({
  columns,
  data,
  renderCell,
}: ResizableTableProps) {
  const [columnWidths, setColumnWidths] = useState<number[]>(
    columns.map((col) => col.defaultWidth || 150)
  );

  // console.info("info columns", columns, columnWidths);

  const resizingRef = useRef<{
    columnIndex: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const pendingWidthRef = useRef<number | null>(null);

  const handleMouseDown = useCallback(
    (columnIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      resizingRef.current = {
        columnIndex,
        startX: e.clientX,
        startWidth: columnWidths[columnIndex],
      };
    },
    [columnWidths]
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;

    const { columnIndex, startX, startWidth } = resizingRef.current;
    const diff = e.clientX - startX;

    const newWidth = Math.max(50, startWidth + diff);

    pendingWidthRef.current = newWidth;

    console.info("info ", startWidth, diff, pendingWidthRef.current);

    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(() => {
        if (pendingWidthRef.current !== null) {
          setColumnWidths((prev) => {
            if (!pendingWidthRef.current) return prev;

            const updated = [...prev];
            updated[columnIndex] = pendingWidthRef.current;
            console.info("info updated", updated[columnIndex]);
            return updated;
          });
          pendingWidthRef.current = null;
        }
        animationFrameRef.current = null;
      });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    resizingRef.current = null;
    pendingWidthRef.current = null;
  }, []);

  useEffect(() => {
    // if (resizingRef.current) {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    // }
  }, [handleMouseMove, handleMouseUp]);

  return (
    <TableContainer>
      <TableWrapper>
        {/* Header Row */}
        <Row>
          {columns.map((column, index) => (
            <HeaderCell key={column.key} $width={columnWidths[index]}>
              <span>{column.label}</span>
              <ResizeHandle onMouseDown={(e) => handleMouseDown(index, e)} />
            </HeaderCell>
          ))}
        </Row>

        {/* Data Rows */}
        {data.map((item, rowIndex) => (
          <Row key={rowIndex}>
            {columns.map((column, colIndex) => (
              <Cell key={column.key} $width={columnWidths[colIndex]}>
                {renderCell(item, column.key)}
              </Cell>
            ))}
          </Row>
        ))}
      </TableWrapper>
    </TableContainer>
  );
}
