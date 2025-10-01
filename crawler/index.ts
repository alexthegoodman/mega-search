import { PrismaClient } from "@prisma/client";
import got from "got";
import * as cheerio from "cheerio";
import { DateTime } from "luxon";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// using Properties supplied by source-crawler.ts
const SEED_DOMAINS: string[] = [];
const CRAWL_DELAY_MS = 5000; // 5 second delay between each crawl

interface PageMetadata {
  keywords: string[];
  industry: string;
  summary: string;
  audience: string;
}

interface AddressAndSocial {
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  tiktok: string | null;
  discord: string | null;
  github: string | null;
}

async function extractMetadataWithAI(
  bodyText: string,
  title: string,
  description: string
): Promise<PageMetadata> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that analyzes webpage content and extracts metadata in JSON format.",
      },
      {
        role: "user",
        content: `Analyze this webpage and extract keywords, industry classification, a summary, and target audience description.\n\nTitle: ${title}\nDescription: ${description}\n\nBody text (first 3000 chars):\n${bodyText.slice(
          0,
          3000
        )}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return {
    keywords: result.keywords || [],
    industry: result.industry || "",
    summary: result.summary || "",
    audience: result.audience || "",
  };
}

async function extractAddressAndSocialWithAI(
  footerHtml: string
): Promise<AddressAndSocial> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that extracts physical addresses and social media links from HTML footer content in JSON format.",
      },
      {
        role: "user",
        content: `Extract the physical address (in separate fields: address1, address2, city, state, zip, country) and social media links (facebook, twitter, instagram, linkedin, youtube, tiktok, discord, github) from this footer HTML. Return null for any field that is not found.\n\n${footerHtml}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return {
    address1: result.address1 || null,
    address2: result.address2 || null,
    city: result.city || null,
    state: result.state || null,
    zip: result.zip || null,
    country: result.country || null,
    facebook: result.facebook || null,
    twitter: result.twitter || null,
    instagram: result.instagram || null,
    linkedin: result.linkedin || null,
    youtube: result.youtube || null,
    tiktok: result.tiktok || null,
    discord: result.discord || null,
    github: result.github || null,
  };
}

async function main() {
  // check properties table for anything, use seed domains if empty
  let domainsToProcess: string[] = [];
  const existingProperties = await prisma.property.findMany({
    select: { hostname: true },
    where: { nodes: { none: {} } }, // only properties with no nodes
  });

  if (existingProperties.length === 0) {
    domainsToProcess = SEED_DOMAINS.filter((d) => d !== "");
  } else {
    domainsToProcess = existingProperties.map((p) => p.hostname);
  }

  for (const domain of domainsToProcess) {
    try {
      console.log(`Processing domain: ${domain}`);

      // use got to fetch page html
      const url = `https://${domain}`;
      const response = await got(url);
      const html = response.body;

      // use cheerio to extract body text, title, meta description, favicon url, and og image url
      const $ = cheerio.load(html);

      const title = $("title").text() || "";
      const metaDescription =
        $('meta[name="description"]').attr("content") || "";
      const faviconUrl =
        $('link[rel="icon"]').attr("href") ||
        $('link[rel="shortcut icon"]').attr("href") ||
        null;
      const ogImageUrl = $('meta[property="og:image"]').attr("content") || null;

      // Extract body text
      const bodyText = $("body").text().trim();

      // use OpenAI JSON mode to extract keywords, industry, summary, and audience
      const metadata = await extractMetadataWithAI(
        bodyText,
        title,
        metaDescription
      );

      // use cheerio to extract the footer
      const footerHtml = $("footer").html() || "";

      // use OpenAI to extract the physical address (in separate fields for searchability) and social media links from the footer
      const addressAndSocial = await extractAddressAndSocialWithAI(footerHtml);

      // save to database
      // Create or update Media records for favicon and og:image
      let faviconRecord = null;
      if (faviconUrl) {
        const absoluteFaviconUrl = new URL(faviconUrl, url).href;
        faviconRecord = await prisma.media.create({
          data: { url: absoluteFaviconUrl },
        });
      }

      let ogImageRecord = null;
      if (ogImageUrl) {
        const absoluteOgImageUrl = new URL(ogImageUrl, url).href;
        ogImageRecord = await prisma.media.create({
          data: { url: absoluteOgImageUrl },
        });
      }

      // Create or update Property
      const property = await prisma.property.upsert({
        where: { hostname: domain },
        create: {
          hostname: domain,
          faviconId: faviconRecord?.id,
          ogImageId: ogImageRecord?.id,
          ...addressAndSocial,
        },
        update: {
          faviconId: faviconRecord?.id,
          ogImageId: ogImageRecord?.id,
          ...addressAndSocial,
        },
      });

      // Create or update Node (homepage)
      await prisma.node.upsert({
        where: { url },
        create: {
          url,
          title,
          description: metaDescription,
          summary: metadata.summary,
          keywords: metadata.keywords,
          industry: metadata.industry,
          audience: metadata.audience,
          propertyId: property.id,
        },
        update: {
          title,
          description: metaDescription,
          summary: metadata.summary,
          keywords: metadata.keywords,
          industry: metadata.industry,
          audience: metadata.audience,
        },
      });

      console.log(`Successfully processed: ${domain}`);
    } catch (error) {
      console.error(`Error processing ${domain}:`, error);
      // continue to next domain after error
      // remove from db so not reprocessed next run
      await prisma.property.deleteMany({ where: { hostname: domain } });
    }

    // Wait 5 seconds before next crawl
    await new Promise((resolve) => setTimeout(resolve, CRAWL_DELAY_MS));
  }

  // go back around to next domain
  console.log("All domains processed");
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
