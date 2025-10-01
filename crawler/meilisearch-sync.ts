import { PrismaClient } from "@prisma/client";
import { MeiliSearch } from "meilisearch";
import OpenAI from "openai";
import { NodeDocument, PropertyDocument } from "./types";

const prisma = new PrismaClient();
const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://127.0.0.1:7700",
  apiKey: process.env.MEILISEARCH_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PROPERTIES_INDEX = "properties";
const NODES_INDEX = "nodes";
const BATCH_SIZE = 100;

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

async function setupIndexes() {
  console.log("Setting up Meilisearch indexes...");

  // Create or update properties index
  try {
    await client.createIndex(PROPERTIES_INDEX, { primaryKey: "id" });
    console.log(`Created index: ${PROPERTIES_INDEX}`);
  } catch (error: any) {
    if (error.code === "index_already_exists") {
      console.log(`Index already exists: ${PROPERTIES_INDEX}`);
    } else {
      throw error;
    }
  }

  // Create or update nodes index
  try {
    await client.createIndex(NODES_INDEX, { primaryKey: "id" });
    console.log(`Created index: ${NODES_INDEX}`);
  } catch (error: any) {
    if (error.code === "index_already_exists") {
      console.log(`Index already exists: ${NODES_INDEX}`);
    } else {
      throw error;
    }
  }

  // Configure properties index
  const propertiesIndex = client.index(PROPERTIES_INDEX);
  await propertiesIndex.updateSettings({
    searchableAttributes: [
      "hostname",
      "city",
      "state",
      "country",
      "address1",
      "address2",
    ],
    filterableAttributes: ["city", "state", "country"],
    sortableAttributes: ["createdAt", "updatedAt"],
  });

  // Configure nodes index
  const nodesIndex = client.index(NODES_INDEX);
  await nodesIndex.updateSettings({
    searchableAttributes: [
      "title",
      "description",
      "summary",
      "keywords",
      "industry",
      "audience",
      "technologies",
      "propertyHostname",
      "property.hostname",
      "property.city",
      "property.state",
      "property.country",
    ],
    filterableAttributes: [
      "propertyId",
      "industry",
      "keywords",
      "technologies",
      "propertyHostname",
      "property.city",
      "property.state",
      "property.country",
    ],
    sortableAttributes: ["createdAt", "updatedAt"],
  });

  console.log("Indexes configured successfully");
}

async function getExistingDocumentIds(indexName: string): Promise<Set<string>> {
  const index = client.index(indexName);
  const existingIds = new Set<string>();

  let offset = 0;
  const limit = 1000;

  while (true) {
    const results = await index.getDocuments({
      offset,
      limit,
      fields: ["id"],
    });

    if (results.results.length === 0) break;

    results.results.forEach((doc: any) => {
      existingIds.add(doc.id);
    });

    offset += limit;

    if (results.results.length < limit) break;
  }

  return existingIds;
}

async function syncProperties() {
  console.log("\nSyncing properties to Meilisearch...");

  const propertiesIndex = client.index(PROPERTIES_INDEX);
  const existingIds = await getExistingDocumentIds(PROPERTIES_INDEX);

  console.log(`Found ${existingIds.size} existing properties in Meilisearch`);

  // Fetch all properties from database
  const properties = await prisma.property.findMany({
    include: {
      favicon: true,
      ogImage: true,
    },
  });

  console.log(`Found ${properties.length} properties in database`);

  // Filter to only new properties
  const newProperties = properties.filter((p) => !existingIds.has(p.id));

  console.log(`${newProperties.length} new properties to sync`);

  if (newProperties.length === 0) {
    console.log("No new properties to sync");
    return;
  }

  // Process in batches
  for (let i = 0; i < newProperties.length; i += BATCH_SIZE) {
    const batch = newProperties.slice(i, i + BATCH_SIZE);

    const documents: PropertyDocument[] = await Promise.all(
      batch.map(async (property) => {
        // Generate embedding from searchable text
        const textForEmbedding = [
          property.hostname,
          property.address1,
          property.address2,
          property.city,
          property.state,
          property.country,
        ]
          .filter(Boolean)
          .join(" ");

        const embedding = await generateEmbedding(textForEmbedding);

        return {
          id: property.id,
          hostname: property.hostname,
          address1: property.address1,
          address2: property.address2,
          city: property.city,
          state: property.state,
          zip: property.zip,
          country: property.country,
          facebook: property.facebook,
          twitter: property.twitter,
          instagram: property.instagram,
          linkedin: property.linkedin,
          youtube: property.youtube,
          tiktok: property.tiktok,
          discord: property.discord,
          github: property.github,
          faviconUrl: property.favicon?.url || null,
          ogImageUrl: property.ogImage?.url || null,
          createdAt: property.createdAt.getTime(),
          updatedAt: property.updatedAt.getTime(),
          _vectors: { default: embedding },
        };
      })
    );

    await propertiesIndex.addDocuments(documents);
    console.log(
      `Synced batch ${i / BATCH_SIZE + 1}: ${documents.length} properties`
    );
  }

  console.log(`✓ Synced ${newProperties.length} new properties`);
}

async function syncNodes() {
  console.log("\nSyncing nodes to Meilisearch...");

  const nodesIndex = client.index(NODES_INDEX);
  const existingIds = await getExistingDocumentIds(NODES_INDEX);

  console.log(`Found ${existingIds.size} existing nodes in Meilisearch`);

  // Fetch all nodes from database
  const nodes = await prisma.node.findMany({
    include: {
      property: {
        include: {
          favicon: true,
          ogImage: true,
        },
      },
    },
  });

  console.log(`Found ${nodes.length} nodes in database`);

  // Filter to only new nodes
  const newNodes = nodes.filter((n) => !existingIds.has(n.id));

  console.log(`${newNodes.length} new nodes to sync`);

  if (newNodes.length === 0) {
    console.log("No new nodes to sync");
    return;
  }

  // Process in batches
  for (let i = 0; i < newNodes.length; i += BATCH_SIZE) {
    const batch = newNodes.slice(i, i + BATCH_SIZE);

    const documents: NodeDocument[] = await Promise.all(
      batch.map(async (node) => {
        // Generate embedding from searchable text
        const textForEmbedding = [
          node.title,
          node.description,
          node.summary,
          node.keywords.join(" "),
          node.industry,
          node.audience,
          node.technologies.join(" "),
        ]
          .filter(Boolean)
          .join(" ");

        const embedding = await generateEmbedding(textForEmbedding);

        return {
          id: node.id,
          url: node.url,
          title: node.title,
          description: node.description,
          summary: node.summary,
          keywords: node.keywords,
          industry: node.industry,
          audience: node.audience,
          technologies: node.technologies,
          propertyId: node.propertyId,
          propertyHostname: node.property.hostname,
          createdAt: node.createdAt.getTime(),
          updatedAt: node.updatedAt.getTime(),
          _vectors: { default: embedding },
          property: {
            id: node.property.id,
            hostname: node.property.hostname,
            address1: node.property.address1,
            address2: node.property.address2,
            city: node.property.city,
            state: node.property.state,
            zip: node.property.zip,
            country: node.property.country,
            facebook: node.property.facebook,
            twitter: node.property.twitter,
            instagram: node.property.instagram,
            linkedin: node.property.linkedin,
            youtube: node.property.youtube,
            tiktok: node.property.tiktok,
            discord: node.property.discord,
            github: node.property.github,
            faviconUrl: node.property.favicon?.url || null,
            ogImageUrl: node.property.ogImage?.url || null,
          },
        };
      })
    );

    await nodesIndex.addDocuments(documents);
    console.log(
      `Synced batch ${i / BATCH_SIZE + 1}: ${documents.length} nodes`
    );
  }

  console.log(`✓ Synced ${newNodes.length} new nodes`);
}

async function main() {
  console.log("Starting Meilisearch sync...\n");

  try {
    // Setup indexes with proper configuration
    await setupIndexes();

    // Sync properties
    await syncProperties();

    // Sync nodes
    await syncNodes();

    console.log("\n=== Sync Complete ===");

    // Show summary
    const propertiesIndex = client.index(PROPERTIES_INDEX);
    const nodesIndex = client.index(NODES_INDEX);

    const propertiesStats = await propertiesIndex.getStats();
    const nodesStats = await nodesIndex.getStats();

    console.log(
      `Total properties in Meilisearch: ${propertiesStats.numberOfDocuments}`
    );
    console.log(`Total nodes in Meilisearch: ${nodesStats.numberOfDocuments}`);
  } catch (error) {
    console.error("Error during sync:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
