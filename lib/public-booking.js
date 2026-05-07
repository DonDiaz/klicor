import { unstable_cache } from "next/cache";
import { getUserByUsername } from "@/lib/firestore";
import { getPublicBookingBootstrap } from "@/lib/booking-firestore";
import { sanitizeSlug } from "@/lib/utils";

export async function getPublicBookingBootstrapByUsername(username) {
  const slug = sanitizeSlug(username);
  if (!slug || slug.length > 30) return null;

  return unstable_cache(
    async () => {
      const owner = await getUserByUsername(slug);
      if (!owner) return null;
      return getPublicBookingBootstrap(owner);
    },
    ["public-booking-bootstrap", slug],
    {
      tags: [`public-booking:${slug}`],
      revalidate: 300,
    },
  )();
}
