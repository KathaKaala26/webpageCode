-- Schema required by @opennextjs/cloudflare's D1NextModeTagCache (on-demand revalidation
-- backing the admin panel's revalidatePath/updateTag("catalog") calls).
-- Apply with: npx wrangler d1 execute katha-and-kala-tag-cache --remote --file=migrations-d1/0001_revalidations.sql
CREATE TABLE IF NOT EXISTS revalidations (
  tag TEXT PRIMARY KEY,
  revalidatedAt INTEGER NOT NULL,
  stale INTEGER,
  expire INTEGER
);
