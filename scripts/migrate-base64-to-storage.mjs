import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Migrasi nilai base64 (data URL) yang tersimpan di kolom database menjadi
 * URL Supabase Storage. Tujuan: baris tabel (terutama `profiles`) tidak lagi
 * membawa blob gambar/PDF berukuran MB, sehingga egress database turun drastis.
 *
 * Aman: default DRY RUN. Tambahkan --apply untuk benar-benar menulis.
 * Sebelum menulis, nilai lama dicadangkan ke backups/base64-migration/<runId>.
 */

const BUCKET = 'gallery-images';

const TARGETS = [
  { table: 'packages', column: 'cover_image', folder: 'packages/covers' },
  { table: 'profiles', column: 'logo_base64', folder: 'profiles/logo' },
  { table: 'profiles', column: 'signature_base64', folder: 'profiles/signature' },
  { table: 'projects', column: 'invoice_signature', folder: 'projects/signatures' },
  { table: 'transactions', column: 'vendor_signature', folder: 'transactions/signatures' },
  { table: 'contracts', column: 'vendor_signature', folder: 'contracts/signatures' },
  { table: 'contracts', column: 'client_signature', folder: 'contracts/signatures' },
  { table: 'team_payment_records', column: 'vendor_signature', folder: 'team-payments/signatures' },
  { table: 'galleries', column: 'cover_image_url', folder: 'galleries/covers' },
  { table: 'galleries', column: 'pdf_url', folder: 'galleries/pdfs' },
];

function parseArgs(args) {
  const options = { apply: false, help: false, backupRoot: path.resolve('backups', 'base64-migration') };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--apply') options.apply = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--backup-dir') {
      const value = args[i + 1];
      if (!value || value.startsWith('--')) throw new Error('Missing value for --backup-dir');
      options.backupRoot = path.resolve(value);
      i += 1;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

function printHelp() {
  console.log(`Migrate base64 data-URLs in the database to Supabase Storage URLs.

Usage:
  node scripts/migrate-base64-to-storage.mjs [--apply] [--backup-dir <path>]

Without --apply the script only reports what it would change (dry run).
Originals are backed up before writing.

Required environment:
  VITE_SUPABASE_URL (or SUPABASE_URL)
  SUPABASE_SERVICE_ROLE_KEY
`);
}

function parseDataUrl(value) {
  if (typeof value !== 'string' || !value.startsWith('data:')) return null;
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(value);
  if (!match) return null;
  const contentType = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const payload = match[3] || '';
  const buffer = isBase64
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload), 'utf8');
  const extFromType = (contentType.split('/')[1] || 'bin').split('+')[0].replace(/[^a-z0-9]/gi, '');
  return { buffer, contentType, ext: extFromType === 'plain' ? 'txt' : extFromType };
}

async function uploadAsset(supabase, folder, parsed) {
  const objectPath = `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${parsed.ext}`;
  const { data, error } = await supabase.storage.from(BUCKET).upload(objectPath, parsed.buffer, {
    cacheControl: '31536000',
    upsert: false,
    contentType: parsed.contentType,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return publicUrl.publicUrl;
}

async function fetchAll(supabase, table, columns) {
  const rows = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from(table).select(`id,${columns}`).range(from, from + pageSize - 1);
    if (error) throw new Error(`Could not read ${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

async function migrateColumn(supabase, target, options) {
  const rows = await fetchAll(supabase, target.table, target.column);
  const report = { scanned: rows.length, converted: 0, skipped: 0, bytes: 0, errors: 0 };
  const backup = [];

  for (const row of rows) {
    const value = row[target.column];
    const parsed = parseDataUrl(value);
    if (!parsed) {
      report.skipped += 1;
      continue;
    }
    report.bytes += parsed.buffer.length;
    try {
      if (!options.apply) {
        report.converted += 1;
        continue;
      }
      const url = await uploadAsset(supabase, target.folder, parsed);
      const { error } = await supabase.from(target.table).update({ [target.column]: url }).eq('id', row.id);
      if (error) throw new Error(error.message);
      backup.push({ id: row.id, column: target.column, original: value });
      report.converted += 1;
    } catch (error) {
      report.errors += 1;
      console.error(`[error] ${target.table}.${target.column} id=${row.id}: ${error.message}`);
    }
  }
  return { report, backup };
}

async function migratePublicPageConfig(supabase, options) {
  const rows = await fetchAll(supabase, 'profiles', 'public_page_config');
  const report = { scanned: rows.length, converted: 0, skipped: 0, bytes: 0, errors: 0 };
  const backup = [];

  const uploadIfDataUrl = async (value, folder) => {
    const parsed = parseDataUrl(value);
    if (!parsed) return value;
    report.bytes += parsed.buffer.length;
    if (!options.apply) {
      report.converted += 1;
      return value;
    }
    const url = await uploadAsset(supabase, folder, parsed);
    report.converted += 1;
    return url;
  };

  for (const row of rows) {
    const config = row.public_page_config;
    if (!config || typeof config !== 'object') {
      report.skipped += 1;
      continue;
    }
    try {
      const next = JSON.parse(JSON.stringify(config));
      let changed = false;

      if (Array.isArray(next.galleryImages)) {
        const migrated = [];
        for (const img of next.galleryImages) {
          const url = await uploadIfDataUrl(img, 'public-page/gallery');
          if (url !== img) changed = true;
          migrated.push(url);
        }
        next.galleryImages = migrated;
      }

      if (next.backgroundImages && typeof next.backgroundImages === 'object') {
        for (const key of Object.keys(next.backgroundImages)) {
          const current = next.backgroundImages[key];
          const url = await uploadIfDataUrl(current, 'public-page/backgrounds');
          if (url !== current) {
            next.backgroundImages[key] = url;
            changed = true;
          }
        }
      }

      if (typeof next.pricelistPdfUrl === 'string') {
        const url = await uploadIfDataUrl(next.pricelistPdfUrl, 'pricelists');
        if (url !== next.pricelistPdfUrl) {
          next.pricelistPdfUrl = url;
          changed = true;
        }
      }

      if (Array.isArray(next.regionPricelists)) {
        for (const item of next.regionPricelists) {
          if (item && typeof item.pdfUrl === 'string') {
            const url = await uploadIfDataUrl(item.pdfUrl, 'pricelists');
            if (url !== item.pdfUrl) {
              item.pdfUrl = url;
              changed = true;
            }
          }
        }
      }

      if (!changed) {
        report.skipped += 1;
        continue;
      }
      if (options.apply) {
        const { error } = await supabase.from('profiles').update({ public_page_config: next }).eq('id', row.id);
        if (error) throw new Error(error.message);
        backup.push({ id: row.id, column: 'public_page_config', original: config });
      }
    } catch (error) {
      report.errors += 1;
      console.error(`[error] profiles.public_page_config id=${row.id}: ${error.message}`);
    }
  }
  return { report, backup };
}

async function migrateGalleryImages(supabase, options) {
  const rows = await fetchAll(supabase, 'galleries', 'images');
  const report = { scanned: rows.length, converted: 0, skipped: 0, bytes: 0, errors: 0 };
  const backup = [];

  for (const row of rows) {
    const images = row.images;
    if (!Array.isArray(images) || images.length === 0) {
      report.skipped += 1;
      continue;
    }
    try {
      let changed = false;
      const next = JSON.parse(JSON.stringify(images));
      for (const img of next) {
        for (const key of ['url', 'thumbnailUrl']) {
          const parsed = parseDataUrl(img?.[key]);
          if (!parsed) continue;
          report.bytes += parsed.buffer.length;
          if (options.apply) {
            img[key] = await uploadAsset(supabase, 'galleries/images', parsed);
          }
          report.converted += 1;
          changed = true;
        }
      }
      if (!changed) {
        report.skipped += 1;
        continue;
      }
      if (options.apply) {
        const { error } = await supabase.from('galleries').update({ images: next }).eq('id', row.id);
        if (error) throw new Error(error.message);
        backup.push({ id: row.id, column: 'images', original: images });
      }
    } catch (error) {
      report.errors += 1;
      console.error(`[error] galleries.images id=${row.id}: ${error.message}`);
    }
  }
  return { report, backup };
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

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const allBackups = [];
  let totalConverted = 0;
  let totalBytes = 0;
  let totalErrors = 0;

  console.log(`${options.apply ? 'APPLY MODE' : 'DRY RUN'} | base64 -> Storage URLs\n`);

  for (const target of TARGETS) {
    const { report, backup } = await migrateColumn(supabase, target, options);
    allBackups.push(...backup);
    totalConverted += report.converted;
    totalBytes += report.bytes;
    totalErrors += report.errors;
    console.log(`${target.table}.${target.column}: ${report.converted} to convert, ${report.skipped} already URL/empty, ${(report.bytes / 1024).toFixed(0)} KB, ${report.errors} error(s)`);
  }

  const jsonResult = await migratePublicPageConfig(supabase, options);
  allBackups.push(...jsonResult.backup);
  totalConverted += jsonResult.report.converted;
  totalBytes += jsonResult.report.bytes;
  totalErrors += jsonResult.report.errors;
  console.log(`profiles.public_page_config: ${jsonResult.report.converted} asset(s) to convert, ${(jsonResult.report.bytes / 1024).toFixed(0)} KB, ${jsonResult.report.errors} error(s)`);

  const galleryResult = await migrateGalleryImages(supabase, options);
  allBackups.push(...galleryResult.backup);
  totalConverted += galleryResult.report.converted;
  totalBytes += galleryResult.report.bytes;
  totalErrors += galleryResult.report.errors;
  console.log(`galleries.images: ${galleryResult.report.converted} asset(s) to convert, ${(galleryResult.report.bytes / 1024).toFixed(0)} KB, ${galleryResult.report.errors} error(s)`);

  if (options.apply && allBackups.length > 0) {
    const destination = path.join(options.backupRoot, runId);
    await mkdir(destination, { recursive: true });
    const file = path.join(destination, 'original-values.json');
    await writeFile(file, JSON.stringify(allBackups, null, 2));
    console.log(`\nBackup written to: ${file}`);
  }

  console.log(`\nSummary: ${totalConverted} value(s), ${(totalBytes / 1024 / 1024).toFixed(2)} MB of base64, ${totalErrors} error(s).`);
  if (!options.apply) console.log('Dry run only. Re-run with --apply to write changes.');
  if (totalErrors > 0) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
