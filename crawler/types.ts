export interface PropertyDocument {
  id: string;
  hostname: string;
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
  faviconUrl: string | null;
  ogImageUrl: string | null;
  createdAt: number;
  updatedAt: number;
  _vectors?: { default: number[] };
}

export const defaultPropertyDocument: PropertyDocument = {
  id: "",
  hostname: "",
  address1: null,
  address2: null,
  city: null,
  state: null,
  zip: null,
  country: null,
  facebook: null,
  twitter: null,
  instagram: null,
  linkedin: null,
  youtube: null,
  tiktok: null,
  discord: null,
  github: null,
  faviconUrl: null,
  ogImageUrl: null,
  createdAt: 0,
  updatedAt: 0,
};

export interface NodeDocument {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  summary: string | null;
  keywords: string[];
  industry: string | null;
  audience: string | null;
  technologies: string[];
  propertyId: string;
  propertyHostname: string;
  createdAt: number;
  updatedAt: number;
  _vectors?: { default: number[] };
  // Denormalized property data
  property?: {
    id: string;
    hostname: string;
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
    faviconUrl: string | null;
    ogImageUrl: string | null;
  };
}

export const defaultNodeDocument: NodeDocument = {
  id: "",
  url: "",
  title: null,
  description: null,
  summary: null,
  keywords: [],
  industry: null,
  audience: null,
  technologies: [],
  propertyId: "",
  propertyHostname: "",
  createdAt: 0,
  updatedAt: 0,
  //   property: { ...defaultPropertyDocument },
};
