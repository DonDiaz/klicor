import { getAdminSettings } from "../lib/firestore.js";

async function main() {
  const settings = await getAdminSettings();
  console.log("Billing settings ready:", settings);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});