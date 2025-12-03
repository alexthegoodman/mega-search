import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const nodes = await prisma.node.findMany({
      select: {
        keywords: true,
      },
    });

    const wordCounts = new Map<string, number>();

    nodes.forEach(node => {
      node.keywords.forEach(keyword => {
        wordCounts.set(keyword, (wordCounts.get(keyword) || 0) + 1);
      });
    });

    const words = Array.from(wordCounts.entries()).map(([text, value]) => ({
      text,
      value,
    }));

    return NextResponse.json(words);
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
