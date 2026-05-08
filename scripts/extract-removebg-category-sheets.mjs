import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

function readArg(name, fallback) {
  const prefix = `${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

const INPUT_DIR = path.resolve(
  process.cwd(),
  readArg("--input", path.join("public", "commerce-assets", "sin fondo")),
);
const BATCHES_PATH = path.join(process.cwd(), "public", "commerce-assets", "ai-pilot-2026-05-07", "ai-batches.json");
const OUTPUT_DIR = path.resolve(
  process.cwd(),
  readArg("--output", path.join("public", "commerce-assets", "categories-ai-removebg-review")),
);
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");

const OUTPUT_SIZE = Number(readArg("--size", "768"));
const COLUMNS = 4;
const ROWS = 3;

function sheetNumberFromName(fileName) {
  const match = fileName.match(/sheet-(\d{3})/i);
  return match ? Number(match[1]) : 0;
}

function alphaBoundingBox(raw, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = raw[(y * width + x) * 4 + 3];
      if (alpha > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function normalizeCell(inputBuffer, outputPath) {
  const image = sharp(inputBuffer).ensureAlpha();
  const metadata = await image.metadata();
  const raw = await image.raw().toBuffer();
  const bbox = alphaBoundingBox(raw, metadata.width, metadata.height);

  if (!bbox) {
    throw new Error(`No foreground detected for ${outputPath}`);
  }

  const padding = Math.max(6, Math.round(Math.max(bbox.width, bbox.height) * 0.04));
  const left = Math.max(0, bbox.left - padding);
  const top = Math.max(0, bbox.top - padding);
  const width = Math.min(metadata.width - left, bbox.width + padding * 2);
  const height = Math.min(metadata.height - top, bbox.height + padding * 2);

  const resized = await sharp(raw, { raw: { width: metadata.width, height: metadata.height, channels: 4 } })
    .extract({ left, top, width, height })
    .resize({
      width: Math.round(OUTPUT_SIZE * 0.9),
      height: Math.round(OUTPUT_SIZE * 0.9),
      fit: "inside",
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png({ compressionLevel: 6, adaptiveFiltering: true })
    .toFile(outputPath);
}

async function main() {
  const batches = JSON.parse(await fs.readFile(BATCHES_PATH, "utf8"));
  const inputFiles = await fs.readdir(INPUT_DIR);
  const filesBySheet = new Map();

  for (const file of inputFiles.filter((file) => /sheet-\d{3}.+\.png$/i.test(file))) {
    const sheetNumber = sheetNumberFromName(file);
    const current = filesBySheet.get(sheetNumber);

    if (!current || file.length < current.length) {
      filesBySheet.set(sheetNumber, file);
    }
  }

  const files = [...filesBySheet.values()]
    .sort((left, right) => sheetNumberFromName(left) - sheetNumberFromName(right));
  const availableSheetNumbers = new Set(files.map(sheetNumberFromName));
  const manualOverrideFiles = inputFiles
    .filter((file) => /^\d{3}-.+\.(png|webp|jpg|jpeg)$/i.test(file))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  const exported = [];
  const manualOverrides = [];
  const skipped = [];

  await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (let index = 0; index < batches.length; index += 1) {
    const sheetNumber = index + 1;
    if (!availableSheetNumbers.has(sheetNumber)) {
      skipped.push({ sheet: sheetNumber, reason: "Sheet file missing from input directory" });
    }
  }

  for (const file of files) {
    const sheetNumber = sheetNumberFromName(file);
    const batch = batches[sheetNumber - 1];
    if (!batch) {
      skipped.push({ file, reason: "No batch found" });
      continue;
    }

    const sheetPath = path.join(INPUT_DIR, file);
    const metadata = await sharp(sheetPath).metadata();
    const cellWidth = Math.floor(metadata.width / COLUMNS);
    const cellHeight = Math.floor(metadata.height / ROWS);

    for (let index = 0; index < batch.length; index += 1) {
      const item = batch[index];
      const col = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      const left = col * cellWidth;
      const top = row * cellHeight;
      const width = col === COLUMNS - 1 ? metadata.width - left : cellWidth;
      const height = row === ROWS - 1 ? metadata.height - top : cellHeight;
      const outputName = `${String(index + 1).padStart(2, "0")}-${item.key}.png`;
      const outputPath = path.join(OUTPUT_DIR, `sheet-${String(sheetNumber).padStart(3, "0")}`, outputName);

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      const inputBuffer = await sharp(sheetPath).extract({ left, top, width, height }).png().toBuffer();
      await normalizeCell(inputBuffer, outputPath);
      exported.push({
        sheet: sheetNumber,
        key: item.key,
        label: item.label,
        assetUrl: `${pathToPublicUrl(OUTPUT_DIR)}/sheet-${String(sheetNumber).padStart(3, "0")}/${outputName}`,
      });
    }
  }

  for (const file of manualOverrideFiles) {
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, "manual-overrides", file.replace(/\.(webp|jpg|jpeg)$/i, ".png"));
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await normalizeCell(await sharp(inputPath).png().toBuffer(), outputPath);
    manualOverrides.push({
      file,
      assetUrl: `${pathToPublicUrl(OUTPUT_DIR)}/manual-overrides/${path.basename(outputPath)}`,
    });
  }

  await fs.writeFile(
    MANIFEST_PATH,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        inputDir: INPUT_DIR,
        outputDir: OUTPUT_DIR,
        outputSize: OUTPUT_SIZE,
        inputSheets: files.length,
        count: exported.length,
        manualOverrideCount: manualOverrides.length,
        skipped,
        manualOverrides,
        categories: exported,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        inputSheets: files.length,
        exported: exported.length,
        manualOverrides: manualOverrides.length,
        outputDir: OUTPUT_DIR,
        skipped,
      },
      null,
      2,
    ),
  );
}

function pathToPublicUrl(directory) {
  const publicDir = path.join(process.cwd(), "public");
  const relative = path.relative(publicDir, directory).split(path.sep).join("/");
  return `/${relative}`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
