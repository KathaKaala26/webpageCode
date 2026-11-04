// One-off maintenance script: shrinks every admin-uploaded image that's already sitting in
// Supabase storage uncompressed (uploaded before compressImage() was added to
// src/app/admin/actions.ts). Downloads each, resizes to a 2000px long edge, re-encodes as
// WebP at quality 80, re-uploads, and updates the DB row to point at the new file.
//
// Run once against production:
//   npx tsx --env-file=.env.local scripts/compress-existing-images.ts
//
// Safe to re-run: files already small (<400KB) are skipped, so a second run is a no-op.

import sharp from "sharp";
import { prisma } from "../src/lib/prisma";
import { PRODUCT_IMAGES_BUCKET, supabaseAdmin } from "../src/lib/supabaseAdmin";

const SKIP_UNDER_BYTES = 400 * 1024;
const MAX_IMAGE_DIMENSION = 2000;
const BUCKET_MARKER = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;

function isBucketUrl(url: string): boolean {
  return url.includes(BUCKET_MARKER);
}

function pathFromUrl(url: string): string {
  return url.slice(url.indexOf(BUCKET_MARKER) + BUCKET_MARKER.length);
}

async function compressAndReupload(url: string): Promise<string | null> {
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  skip (fetch ${res.status}): ${url}`);
    return null;
  }
  const original = Buffer.from(await res.arrayBuffer());
  if (original.byteLength < SKIP_UNDER_BYTES) {
    console.log(`  already small (${(original.byteLength / 1024).toFixed(0)}KB), skipping`);
    return null;
  }

  const compressed = await sharp(original)
    .rotate()
    .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const oldPath = pathFromUrl(url);
  const dir = oldPath.split("/")[0];
  const newPath = `${dir}/${Date.now()}.webp`;

  const supabase = supabaseAdmin();
  const { error: uploadError } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(newPath, compressed, { contentType: "image/webp" });
  if (uploadError) {
    console.warn(`  upload failed: ${uploadError.message}`);
    return null;
  }
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([oldPath]);

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(newPath);
  console.log(`  ${(original.byteLength / 1024).toFixed(0)}KB -> ${(compressed.byteLength / 1024).toFixed(0)}KB`);
  return data.publicUrl;
}

async function main() {
  const images = await prisma.productImage.findMany();
  for (const img of images) {
    if (!isBucketUrl(img.url)) continue;
    console.log(`ProductImage ${img.slug}: ${img.url}`);
    const newUrl = await compressAndReupload(img.url);
    if (newUrl) await prisma.productImage.update({ where: { slug: img.slug }, data: { url: newUrl } });
  }

  const products = await prisma.product.findMany();
  for (const p of products) {
    if (!isBucketUrl(p.image)) continue;
    console.log(`Product ${p.slug}: ${p.image}`);
    const newUrl = await compressAndReupload(p.image);
    if (newUrl) await prisma.product.update({ where: { slug: p.slug }, data: { image: newUrl } });
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
