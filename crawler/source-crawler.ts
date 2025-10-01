import { PrismaClient } from "@prisma/client";
import got from "got";
import * as cheerio from "cheerio";

const prisma = new PrismaClient();

const SEED_DOMAINS = [
  "https://web.grandrapids.org/search",
  "https://www.crainsgrandrapids.com",
];

const MAX_DEPTH = 7; // how deep to crawl within seed domains
const CRAWL_DELAY_MS = 5000; // 5 second delay between each crawl
const URL_BLACKLIST = ["wcpages"]; // skip URLs containing these keywords

async function initializeSeedDomains() {
  // Add seed domains to crawl queue if not already present
  for (const seedUrl of SEED_DOMAINS) {
    await prisma.crawlQueue.upsert({
      where: { url: seedUrl },
      create: {
        url: seedUrl,
        depth: 0,
        isSeedDomain: true,
        status: "pending",
      },
      update: {},
    });
  }
  console.log(`Initialized ${SEED_DOMAINS.length} seed domains`);
}

function extractHostname(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

function isSameDomain(url: string, seedUrl: string): boolean {
  const urlHostname = extractHostname(url);
  const seedHostname = extractHostname(seedUrl);
  return urlHostname === seedHostname;
}

function isBlacklisted(url: string): boolean {
  return URL_BLACKLIST.some((keyword) => url.toLowerCase().includes(keyword.toLowerCase()));
}

async function extractLinks(html: string, baseUrl: string): Promise<string[]> {
  const $ = cheerio.load(html);
  const links: Set<string> = new Set();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (href) {
      try {
        const absoluteUrl = new URL(href, baseUrl).href;
        // Only include http/https URLs
        if (
          absoluteUrl.startsWith("http://") ||
          absoluteUrl.startsWith("https://")
        ) {
          links.add(absoluteUrl);
        }
      } catch {
        // Invalid URL, skip
      }
    }
  });

  return Array.from(links);
}

async function processCrawlQueueItem(item: {
  id: string;
  url: string;
  depth: number;
  isSeedDomain: boolean;
}) {
  // Skip blacklisted URLs
  if (isBlacklisted(item.url)) {
    console.log(`⊘ Skipping blacklisted: ${item.url}`);
    await prisma.crawlQueue.update({
      where: { id: item.id },
      data: { status: "completed", processedAt: new Date() },
    });
    return;
  }

  console.log(`Processing: ${item.url} (depth: ${item.depth})`);

  try {
    // Mark as processing
    await prisma.crawlQueue.update({
      where: { id: item.id },
      data: { status: "processing" },
    });

    // Fetch the page
    const response = await got(item.url, {
      timeout: { request: 10000 },
      followRedirect: true,
    });
    const html = response.body;

    // Extract all links from the page
    const links = await extractLinks(html, item.url);

    console.log(`Found ${links.length} links on ${item.url}`);

    // Process links
    for (const link of links) {
      // Skip blacklisted links
      if (isBlacklisted(link)) {
        continue;
      }

      const linkHostname = extractHostname(link);
      if (!linkHostname) continue;

      // Check if this is an internal link (same domain as current page)
      const isInternalLink = isSameDomain(link, item.url);

      if (isInternalLink) {
        // Internal link - add to crawl queue if within depth limit
        if (item.depth < MAX_DEPTH) {
          const existingQueueItem = await prisma.crawlQueue.findUnique({
            where: { url: link },
          });

          if (!existingQueueItem) {
            await prisma.crawlQueue.create({
              data: {
                url: link,
                depth: item.depth + 1,
                isSeedDomain: false,
                status: "pending",
              },
            });
            console.log(`  Added to queue: ${link} (depth: ${item.depth + 1})`);
          }
        }
      } else {
        // External link - create Property if not exists
        const existingProperty = await prisma.property.findUnique({
          where: { hostname: linkHostname },
        });

        if (!existingProperty) {
          await prisma.property.create({
            data: {
              hostname: linkHostname,
            },
          });
          console.log(`  Created property: ${linkHostname}`);
        }
      }
    }

    // Mark as completed
    await prisma.crawlQueue.update({
      where: { id: item.id },
      data: {
        status: "completed",
        processedAt: new Date(),
      },
    });

    console.log(`✓ Completed: ${item.url}`);
  } catch (error) {
    console.error(
      `✗ Failed: ${item.url}`,
      error instanceof Error ? error.message : error
    );

    // Mark as failed
    await prisma.crawlQueue.update({
      where: { id: item.id },
      data: {
        status: "failed",
        processedAt: new Date(),
      },
    });
  }

  // Wait 5 seconds before next crawl
  await new Promise((resolve) => setTimeout(resolve, CRAWL_DELAY_MS));
}

async function processQueue() {
  while (true) {
    // Get next pending item (one at a time to ensure 5 second delay between each)
    const pendingItem = await prisma.crawlQueue.findFirst({
      where: { status: "pending" },
      orderBy: [{ depth: "asc" }, { createdAt: "asc" }],
    });

    if (!pendingItem) {
      console.log("No more pending items in queue");
      break;
    }

    // Process one item at a time with built-in delay
    await processCrawlQueueItem(pendingItem);
  }
}

async function main() {
  console.log("Source Crawler starting...");

  // Initialize seed domains in the crawl queue
  await initializeSeedDomains();

  // Process the crawl queue
  await processQueue();

  // Show summary
  const summary = await prisma.crawlQueue.groupBy({
    by: ["status"],
    _count: true,
  });

  console.log("\n=== Crawl Summary ===");
  summary.forEach((s) => {
    console.log(`${s.status}: ${s._count}`);
  });

  const totalProperties = await prisma.property.count();
  console.log(`Total properties discovered: ${totalProperties}`);
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
