import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";

// The admin panel drives nearly every content change through revalidatePath/updateTag — a
// single revalidateCatalog() call (src/app/admin/actions.ts) fires ~8 tag/path revalidations
// in one request. The D1-backed tag cache (d1-next-tag-cache) silently dropped all but one of
// those 8 writes under this burst (confirmed: only 1 of 8 tags ever landed in the D1
// `revalidations` table after a real admin edit) — this matches OpenNext's own guidance that
// "the D1 based tag cache should only be used if your site receives low traffic; the Durable
// Object based tag cache is the recommended option for most sites." Switched to the
// DO-sharded tag cache, which doesn't have this burst-write problem.
// See https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  tagCache: doShardedTagCache({ baseShardSize: 12 }),
});
