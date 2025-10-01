import { NextRequest, NextResponse } from "next/server";
import { MeiliSearch } from "meilisearch";
import OpenAI from "openai";

// Query parameters:
// - q - Search query (required)
// - type - "nodes" or "properties" (default: "nodes")
// - limit - Results per page (default: 20)
// - offset - Pagination offset (default: 0)
// - vector - Set to "true" for AI vector search (default: false)
// - industry, city, state, country - Optional filters

// Examples:
// # Keyword search
// GET /api/search?q=real+estate&limit=10

// # AI vector search with filters
// GET /api/search?q=commercial+properties&vector=true&state=Michigan

// # Search properties instead of nodes
// GET /api/search?q=construction&type=properties

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://127.0.0.1:7700",
  apiKey: process.env.MEILISEARCH_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const NODES_INDEX = "nodes";
const PROPERTIES_INDEX = "properties";

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "nodes"; // "nodes" or "properties"
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const useVector = searchParams.get("vector") === "true";

    // Filters
    const industry = searchParams.get("industry");
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const country = searchParams.get("country");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    // Build filter string
    const filters: string[] = [];
    if (industry) filters.push(`industry = "${industry}"`);
    if (city) filters.push(`property.city = "${city}"`);
    if (state) filters.push(`property.state = "${state}"`);
    if (country) filters.push(`property.country = "${country}"`);

    const filterString = filters.length > 0 ? filters.join(" AND ") : undefined;

    let results;

    if (type === "nodes") {
      const nodesIndex = client.index(NODES_INDEX);

      if (useVector) {
        // Hybrid search: keyword + vector search
        const embedding = await generateEmbedding(query);

        results = await nodesIndex.search(query, {
          limit,
          offset,
          filter: filterString,
          hybrid: {
            semanticRatio: 0.5, // 50% semantic, 50% keyword
            embedder: "default",
          },
          vector: embedding,
        });
      } else {
        // Standard keyword search
        results = await nodesIndex.search(query, {
          limit,
          offset,
          filter: filterString,
        });
      }
    } else if (type === "properties") {
      const propertiesIndex = client.index(PROPERTIES_INDEX);

      if (useVector) {
        // Hybrid search: keyword + vector search
        const embedding = await generateEmbedding(query);

        results = await propertiesIndex.search(query, {
          limit,
          offset,
          filter: filterString,
          hybrid: {
            semanticRatio: 0.5,
            embedder: "default",
          },
          vector: embedding,
        });
      } else {
        // Standard keyword search
        results = await propertiesIndex.search(query, {
          limit,
          offset,
          filter: filterString,
        });
      }
    } else {
      return NextResponse.json(
        { error: "Invalid type. Must be 'nodes' or 'properties'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      hits: results.hits,
      estimatedTotalHits: results.estimatedTotalHits,
      limit: results.limit,
      offset: results.offset,
      processingTimeMs: results.processingTimeMs,
      query: results.query,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
