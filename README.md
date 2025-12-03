
Install:

- `npm i`
- meilisearch (https://www.meilisearch.com/docs/learn/self_hosted/install_meilisearch_locally#direct-download)
- `npx prisma migrate dev`

Run:

- `npm run start:source-crawler` for awhile. It will get all the home pages for sites connected to the seed sites and connected to themselves.
- `npm run start:crawler` will then be ran and scour the home pages of all these available sites and collect AI data
- `sync:meilisearch` then this sill sync the embeddings and data to meillisearch

Search and Enjoy:

- `npm run dev`
