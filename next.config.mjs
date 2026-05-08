import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const firebaseStorageBucket = process.env.FIREBASE_STORAGE_BUCKET || "";

const storageImagePatterns = firebaseStorageBucket
  ? [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: `/v0/b/${firebaseStorageBucket}/o/**`,
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: `/${firebaseStorageBucket}/**`,
      },
    ]
  : [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ];

const nextConfig = {
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["@loskir/styled-qr-code-node", "skia-canvas"],
  images: {
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1440, 1920],
    imageSizes: [32, 48, 56, 64, 70, 96, 128, 192, 256, 384],
    qualities: [60, 75, 85],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "loremflickr.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      ...storageImagePatterns,
    ],
  },
};

export default nextConfig;
