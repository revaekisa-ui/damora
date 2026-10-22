import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DEFAULT_BUCKET = 'gallery-images';
const ALLOWED_BUCKETS = ['gallery-images', 'dp-proofs'];
const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_MAX_SIZE_KB = 100;
const DEFAULT_BACKUP_ROOT = path.resolve('backups', 'storage-image-originals');

function parseArgs(args) {
  const options = {
    apply: false,
    bucket: DEFAULT_BUCKET,
    maxDimension: DEFAULT_MAX_DIMENSION,
    maxSizeKb: DEFAULT_MAX_SIZE_KB,
    backupRoot: DEFAULT_BACKUP_ROOT,
    help: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--apply') options.apply = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (['--bucket', '--max-dimension', '--max-size-kb', '--backup-dir'].includes(arg)) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      index += 1;
      if (arg === '--bucket') options.bucket = value;
      if (arg === '--max-dimension') options.maxDimension = Number(value);
      if (arg === '--max-size-kb') options.maxSizeKb = Number(value);
      if (arg === '--backup-dir') options.backupRoot = path.resolve(value);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!options.help) {
    if (options.bucket !== 'all' && !ALLOWED_BUCKETS.includes(options.bucket)) {
      throw new Error(`Unsupported bucket "${options.bucket}". Choose ${ALLOWED_BUCKETS.join(', ')} or all.`);
    }
    if (!Number.isInteger(options.maxDimension) || options.maxDimension < 640) {
      throw new Error('--max-dimension must be an integer of at least 640');
    }
    if (!Number.isFinite(options.maxSizeKb) || options.maxSizeKb <= 0) {
      throw new Error('--max-size-kb must be greater than 0');
    }
  }

  return options;
}

function printHelp() {
  console.log(`Compress existing raster images in Supabase Storage.

Usage:
  node scripts/compress-existing-images.mjs [options]

Options:
  --bucket <name|all>      gallery-images (default), dp-proofs, or all
  --max-size-kb <number>   Target maximum file size (default: ${DEFAULT_MAX_SIZE_KB})
  --max-dimension <pixels> Longest image side (default: ${DEFAULT_MAX_DIMENSION})
  --backup-dir <path>      Local original backup root (default: backups/storage-image-originals)
  --apply                  Replace objects; without this flag the script only reports
  --help                   Show this message

Required environment:
  VITE_SUPABASE_URL (or SUPABASE_URL)
  SUPABASE_SERVICE_ROLE_KEY
`);
}

function isRasterImage(object) {
  const contentType = object.metadata?.mimetype || object.metadata?.contentType || '';
  const extension = path.extname(object.name).toLowerCase();
  return ['image/jpeg', 'image/png', 'image/webp'].includes(contentType)
    || ['.jpg', '.jpeg', '.png', '.webp'].includes(extension);
}

async function listImageObjects(storage, bucket, prefix = '') {
  const objects = [];
  const limit = 100;

  for (let offset = 0; ; offset += limit) {
    const { data, error } = await storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`Could not list ${bucket}/${prefix}: ${error.message}`);
    if (!data?.length) break;

    for (const entry of data) {
      const objectPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        objects.push(...await listImageObjects(storage, bucket, objectPath));
      } else if (isRasterImage(entry)) {
        objects.push({ ...entry, path: objectPath });
      }
    }
    if (data.length < limit) break;
  }

  return objects;
}

export async function compressToTarget(original, options) {
  const metadata = await sharp(original, { failOn: 'none' }).metadata();
  if (!metadata.width || !metadata.height) throw new Error('Image dimensions could not be read');
  if (!['jpeg', 'png', 'webp'].includes(metadata.format || '')) {
    throw new Error(`Unsupported image format: ${metadata.format || 'unknown'}`);
  }

  let dimension = Math.max(640, Math.min(options.maxDimension, Math.max(metadata.width, metadata.height)));
  let best = null;
  const qualities = [82, 74, 66, 58, 50];
  const maxBytes = options.maxSizeKb * 1024;

  while (dimension >= 640) {
    for (const quality of qualities) {
      const compressed = await sharp(original, { failOn: 'none' })
        .rotate()
        .resize({ width: dimension, height: dimension, fit: 'inside', withoutEnlargement: true })
        .toFormat(metadata.format, metadata.format === 'jpeg'
          ? { quality, mozjpeg: true }
          : metadata.format === 'png'
            ? { compressionLevel: 9, palette: true, quality, effort: 8 }
            : { quality, effort: 6 })
        .toBuffer();

      if (!best || compressed.length < best.length) best = compressed;
      if (compressed.length <= maxBytes) return { buffer: compressed, metadata };
    }
    if (dimension === 640) break;
    dimension = Math.max(640, Math.floor(dimension * 0.85));
  }

  return { buffer: best, metadata };
}

function backupPath(root, runId, bucket, objectPath) {
  const destination = path.resolve(root, runId, bucket, ...objectPath.split('/'));
  const runRoot = path.resolve(root, runId) + path.sep;
  if (!destination.startsWith(runRoot)) throw new Error(`Unsafe storage path: ${objectPath}`);
  return destination;
}

async function processObject(storage, bucket, object, options, runId) {
  const { data, error } = await storage.from(bucket).download(object.path);
  if (error || !data) throw new Error(`Download failed: ${error?.message || 'no file returned'}`);

  const original = Buffer.from(await data.arrayBuffer());
  const originalKb = original.length / 1024;
  if (originalKb <= options.maxSizeKb) return { status: 'already-small', originalKb };

  const { buffer, metadata } = await compressToTarget(original, options);
  const compressedKb = buffer.length / 1024;
  if (buffer.length >= original.length) return { status: 'no-smaller', originalKb, compressedKb };

  if (!options.apply) return { status: 'would-compress', originalKb, compressedKb, dimensions: `${metadata.width}x${metadata.height}` };

  const destination = backupPath(options.backupRoot, runId, bucket, object.path);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, original, { flag: 'wx' });

  const { error: uploadError } = await storage.from(bucket).upload(object.path, buffer, {
    cacheControl: '31536000',
    contentType: metadata.format === 'jpeg' ? 'image/jpeg' : `image/${metadata.format}`,
    upsert: true,
  });
  if (uploadError) throw new Error(`Upload failed; original backed up at ${destination}: ${uploadError.message}`);

  return { status: compressedKb <= options.maxSizeKb ? 'compressed' : 'compressed-over-target', originalKb, compressedKb, backup: destination };
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }
  if (options.help) return printHelp();

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
    process.exitCode = 1;
    return;
  }

  const buckets = options.bucket === 'all' ? ALLOWED_BUCKETS : [options.bucket];
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const totals = { scanned: 0, compressed: 0, wouldCompress: 0, alreadySmall: 0, noSmaller: 0, overTarget: 0, errors: 0 };

  console.log(`${options.apply ? 'APPLY MODE' : 'DRY RUN'} | target <= ${options.maxSizeKb} KB | max dimension ${options.maxDimension}px`);
  if (options.apply) console.log(`Originals are backed up to: ${path.join(options.backupRoot, runId)}`);

  for (const bucket of buckets) {
    const objects = await listImageObjects(supabase.storage, bucket);
    console.log(`\n${bucket}: found ${objects.length} raster image(s)`);
    for (const object of objects) {
      totals.scanned += 1;
      try {
        const result = await processObject(supabase.storage, bucket, object, options, runId);
        if (result.status === 'already-small') totals.alreadySmall += 1;
        if (result.status === 'no-smaller') totals.noSmaller += 1;
        if (result.status === 'would-compress') totals.wouldCompress += 1;
        if (result.status === 'compressed' || result.status === 'compressed-over-target') totals.compressed += 1;
        if (result.status === 'compressed-over-target') totals.overTarget += 1;

        const sizes = result.compressedKb === undefined
          ? `${result.originalKb.toFixed(1)} KB`
          : `${result.originalKb.toFixed(1)} KB -> ${result.compressedKb.toFixed(1)} KB`;
        console.log(`[${result.status}] ${bucket}/${object.path} (${sizes})`);
      } catch (error) {
        totals.errors += 1;
        console.error(`[error] ${bucket}/${object.path}: ${error.message}`);
      }
    }
  }

  console.log('\nSummary:', JSON.stringify(totals, null, 2));
  if (totals.errors > 0) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
