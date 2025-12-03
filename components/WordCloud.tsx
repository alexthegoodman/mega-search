'use client';

import React, { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

interface Word {
  text: string;
  value: number;
}

interface WordCloudProps {
  minSize?: [number, number];
  maxSize?: [number, number];
}

interface PlacedWord extends Word {
  x: number;
  y: number;
  fontSize: number;
  rotation: number;
  color: string;
  width: number;
  height: number;
}

const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const KeywordWordCloud: React.FC<WordCloudProps> = ({ minSize, maxSize }) => {
  const { data, error } = useSWR<Word[]>('/api/keywords', fetcher);
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const width = minSize ? minSize[0] : 600;
  const height = maxSize ? maxSize[1] : 400;

  useEffect(() => {
    if (!data || data.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sort words by value (largest first)
    const sortedWords = [...data].sort((a, b) => b.value - a.value);

    // Calculate font sizes
    const maxValue = Math.max(...sortedWords.map(w => w.value));
    const minValue = Math.min(...sortedWords.map(w => w.value));
    const minFont = 20;
    const maxFont = 60;

    const getFontSize = (value: number) => {
      if (maxValue === minValue) return (minFont + maxFont) / 2;
      return minFont + ((value - minValue) / (maxValue - minValue)) * (maxFont - minFont);
    };

    // Measure text dimensions
    const measureText = (text: string, fontSize: number, rotation: number) => {
      ctx.font = `${fontSize}px Impact, sans-serif`;
      const metrics = ctx.measureText(text);
      const w = metrics.width;
      const h = fontSize;
      
      if (rotation === 90 || rotation === -90) {
        return { width: h, height: w };
      }
      return { width: w, height: h };
    };

    // Check collision with existing words
    const checkCollision = (x: number, y: number, w: number, h: number, placed: PlacedWord[]) => {
      const padding = 5;
      for (const word of placed) {
        if (!(x + w + padding < word.x - padding ||
              x - padding > word.x + word.width + padding ||
              y + h + padding < word.y - padding ||
              y - padding > word.y + word.height + padding)) {
          return true;
        }
      }
      return false;
    };

    // Spiral positioning
    const findPosition = (word: Word, fontSize: number, rotation: number, placed: PlacedWord[]) => {
      const { width: w, height: h } = measureText(word.text, fontSize, rotation);
      const centerX = width / 2;
      const centerY = height / 2;
      
      let angle = 0;
      let radius = 0;
      const angleStep = 0.5;
      const radiusStep = 5;

      for (let i = 0; i < 1000; i++) {
        const x = centerX + radius * Math.cos(angle) - w / 2;
        const y = centerY + radius * Math.sin(angle) - h / 2;

        if (x >= 0 && x + w <= width && y >= 0 && y + h <= height) {
          if (!checkCollision(x, y, w, h, placed)) {
            return { x, y, width: w, height: h };
          }
        }

        angle += angleStep;
        radius += radiusStep * angleStep / (2 * Math.PI);
      }

      return null;
    };

    // Place all words
    const placed: PlacedWord[] = [];
    const rotationAngles = [0, 90];

    for (let i = 0; i < sortedWords.length; i++) {
      const word = sortedWords[i];
      const fontSize = getFontSize(word.value);
      const rotation = rotationAngles[Math.floor(Math.random() * rotationAngles.length)];
      const color = colors[i % colors.length];

      const position = findPosition(word, fontSize, rotation, placed);
      
      if (position) {
        placed.push({
          ...word,
          x: position.x,
          y: position.y,
          fontSize,
          rotation,
          color,
          width: position.width,
          height: position.height
        });
      }
    }

    setPlacedWords(placed);
  }, [data, width, height]);

  if (error) return <div>Failed to load word cloud.</div>;
  if (!data) return <div>Loading word cloud...</div>;

  return (
    <div style={{ position: 'relative', width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ position: 'absolute', visibility: 'hidden' }}
      />
      <svg width={width} height={height} style={{ fontFamily: 'Impact, sans-serif' }}>
        {placedWords.map((word, idx) => (
          <text
            key={idx}
            x={word.x + word.width / 2}
            y={word.y + word.height / 2}
            fontSize={word.fontSize}
            fill={word.color}
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(${word.rotation}, ${word.x + word.width / 2}, ${word.y + word.height / 2})`}
            style={{
              cursor: 'pointer',
              transition: 'opacity 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {word.text}
          </text>
        ))}
      </svg>
    </div>
  );
};

export default KeywordWordCloud;
