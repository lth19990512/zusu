/**
 * Process full-court NBA images into half-court images for the shot chart.
 *
 * Usage:  node scripts/process-courts.mjs [inputDir]
 * Default inputDir: ~/Desktop/nba_court
 *
 * Steps per image:
 *   1. Crop the RIGHT half (one basket end)
 *   2. Rotate 90° counter-clockwise (basket → bottom)
 *   3. Resize to 500×470 to match SVG viewBox
 *   4. Save as public/courts/{TEAM_ABBR}.png
 */

import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";

// ---------------------------------------------------------------------------
// Filename → team abbreviation mapping
// Add entries as you collect more court images.
// ---------------------------------------------------------------------------
const FILE_TO_TEAM = {
  "hawks":      "ATL",
  "hawk":       "ATL",
  "celtics":    "BOS",
  "celtic":     "BOS",
  "nets":       "BKN",
  "hornets":    "CHA",
  "bulls":      "CHI",
  "cavaliers":  "CLE",
  "mavericks":  "DAL",
  "nuggets":    "DEN",
  "pistons":    "DET",
  "warriors":   "GSW",
  "rockets":    "HOU",
  "pacers":     "IND",
  "clippers":   "LAC",
  "lakers":     "LAL",
  "grizzlies":  "MEM",
  "grizzles":   "MEM",
  "heat":       "MIA",
  "bucks":      "MIL",
  "timberwolves":"MIN",
  "pelicans":   "NOP",
  "knicks":     "NYK",
  "thunder":    "OKC",
  "magic":      "ORL",
  "sixers":     "PHI",
  "76ers":      "PHI",
  "7sixer":     "PHI",
  "7sixers":    "PHI",
  "suns":       "PHX",
  "blazers":    "POR",
  "trailblazers":"POR",
  "kings":      "SAC",
  "spurs":      "SAS",
  "raptors":    "TOR",
  "jazz":       "UTA",
  "wizards":    "WAS",
  "wolves":     "MIN",
};

function guessTeam(filename) {
  // Remove extension, _court, -court, numbers, etc.
  const base = filename
    .replace(extname(filename), "")
    .toLowerCase()
    .replace(/[_-]?court/g, "")
    .replace(/[_-]/g, "")
    .trim();

  // Direct match
  if (FILE_TO_TEAM[base]) return FILE_TO_TEAM[base];

  // Partial match
  for (const [key, abbr] of Object.entries(FILE_TO_TEAM)) {
    if (base.includes(key) || key.includes(base)) return abbr;
  }

  return null;
}

async function processImage(inputPath, outputPath) {
  // Step 1: normalize EXIF rotation → buffer
  const normalized = await sharp(inputPath).rotate().toBuffer();
  const meta = await sharp(normalized).metadata();

  // Step 2: crop edges to remove team names, arena text, and borders.
  // In landscape images: left/right = baselines (team names live here), top/bottom = sidelines.
  const cropPctX = 0.09;  // 9% from left & right (baselines — team name text areas)
  const cropPctY = 0.08;  // 8% from top & bottom (sidelines — arena name, logos)
  const cx = Math.round(meta.width * cropPctX);
  const cy = Math.round(meta.height * cropPctY);
  const innerW = meta.width - cx * 2;
  const innerH = meta.height - cy * 2;

  const courtOnly = await sharp(normalized)
    .extract({ left: cx, top: cy, width: innerW, height: innerH })
    .toBuffer();

  // Step 3: get dimensions, crop right half (one basket end)
  const { width, height } = await sharp(courtOnly).metadata();
  const halfW = Math.floor(width / 2);

  const cropped = await sharp(courtOnly)
    .extract({ left: halfW, top: 0, width: width - halfW, height })
    .toBuffer();

  // Step 4: rotate 90° CW (basket → bottom) and resize to SVG viewBox
  await sharp(cropped)
    .rotate(90)
    .resize(460, 440, { fit: "fill" })
    .png()
    .toFile(outputPath);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const inputDir = process.argv[2] || join(process.env.USERPROFILE || process.env.HOME, "Desktop", "nba_court");
const outputDir = join(process.cwd(), "public", "courts");

await mkdir(outputDir, { recursive: true });

const files = await readdir(inputDir);
let processed = 0;
let skipped = 0;

for (const file of files) {
  const ext = extname(file).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) continue;

  const team = guessTeam(file);
  if (!team) {
    console.log(`⚠  Skipped ${file} — can't determine team. Add mapping to FILE_TO_TEAM.`);
    skipped++;
    continue;
  }

  const inputPath = join(inputDir, file);
  const outputPath = join(outputDir, `${team}.png`);

  try {
    await processImage(inputPath, outputPath);
    console.log(`✓  ${file} → ${team}.png`);
    processed++;
  } catch (err) {
    console.error(`✗  ${file}: ${err.message}`);
    skipped++;
  }
}

console.log(`\nDone: ${processed} processed, ${skipped} skipped.`);
console.log(`Output: ${outputDir}`);
