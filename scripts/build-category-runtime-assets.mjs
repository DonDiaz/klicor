import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = path.join(process.cwd(), "public", "commerce-assets", "categories-ai-1254-review");
const OUTPUT_DIR = path.join(process.cwd(), "public", "commerce-assets", "categories-ai-runtime");
const SOURCE_MANIFEST_PATH = path.join(SOURCE_DIR, "manifest.json");
const OUTPUT_MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");
const LOCAL_ASSETS_MODULE_PATH = path.join(process.cwd(), "lib", "commerce-category-local-assets.js");
const TARGET_CATALOG_PATH = path.join(process.cwd(), "lib", "commerce-category-target-catalog.js");

const OUTPUT_SIZE = 192;
const WEBP_QUALITY = 84;

function publicUrlFromPath(filePath) {
  const publicDir = path.join(process.cwd(), "public");
  return `/${path.relative(publicDir, filePath).split(path.sep).join("/")}`;
}

function keyFromFileName(fileName) {
  return `target_${fileName.replace(/^\d+-/, "").replace(/\.(png|webp)$/i, "")}`;
}

async function convertAsset(sourceUrl, key) {
  const sourcePath = path.join(process.cwd(), "public", sourceUrl.replace(/^\//, ""));
  const outputName = `${key.replace(/^target_/, "")}.webp`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  await sharp(sourcePath)
    .resize({
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      fit: "inside",
      withoutEnlargement: false,
      kernel: "lanczos3",
    })
    .webp({
      quality: WEBP_QUALITY,
      effort: 4,
      smartSubsample: true,
    })
    .toFile(outputPath);

  return publicUrlFromPath(outputPath);
}

function targetKeysInCatalogOrder(source) {
  return [...source.matchAll(/target\("([^"]+)"/g)].map((match) => `target_${match[1]}`);
}

async function main() {
  const sourceManifest = JSON.parse(await fs.readFile(SOURCE_MANIFEST_PATH, "utf8"));
  const catalogSource = await fs.readFile(TARGET_CATALOG_PATH, "utf8");
  const targetKeys = targetKeysInCatalogOrder(catalogSource);
  const sourceUrls = new Map();

  for (const category of sourceManifest.categories || []) {
    sourceUrls.set(`target_${category.key}`, category.assetUrl);
  }

  for (const override of sourceManifest.manualOverrides || []) {
    sourceUrls.set(keyFromFileName(override.file), override.assetUrl);
  }

  const pilotDir = path.join(SOURCE_DIR, "pilot-fallback");
  try {
    for (const file of await fs.readdir(pilotDir)) {
      if (!/\.png$/i.test(file)) continue;
      sourceUrls.set(keyFromFileName(file), `/commerce-assets/categories-ai-1254-review/pilot-fallback/${file}`);
    }
  } catch {
    // Pilot fallback is optional; missing required keys are reported below.
  }

  const missing = targetKeys.filter((key) => !sourceUrls.has(key));
  if (missing.length) {
    throw new Error(`Missing source assets: ${missing.join(", ")}`);
  }

  await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const runtimeUrls = new Map();
  for (const key of targetKeys) {
    runtimeUrls.set(key, await convertAsset(sourceUrls.get(key), key));
  }

  const moduleBody = targetKeys.map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(runtimeUrls.get(key))},`).join("\n");
  await fs.writeFile(
    LOCAL_ASSETS_MODULE_PATH,
    `// Generated from public/commerce-assets/categories-ai-runtime/manifest.json\n// Maps Klicor target category keys to optimized runtime WebP category assets.\n// Category names and aliases live in lib/commerce-category-target-catalog.js.\n\nexport const LOCAL_CATEGORY_ASSET_URLS = {\n${moduleBody}\n};\n`,
    "utf8",
  );

  const assets = targetKeys.map((key) => ({
    key,
    sourceUrl: sourceUrls.get(key),
    assetUrl: runtimeUrls.get(key),
  }));

  await fs.writeFile(
    OUTPUT_MANIFEST_PATH,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceDir: publicUrlFromPath(SOURCE_DIR),
        outputDir: publicUrlFromPath(OUTPUT_DIR),
        outputSize: OUTPUT_SIZE,
        webpQuality: WEBP_QUALITY,
        count: assets.length,
        assets,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(JSON.stringify({ outputSize: OUTPUT_SIZE, webpQuality: WEBP_QUALITY, count: assets.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
