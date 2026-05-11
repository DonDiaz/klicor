import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { formatApiError } from "@/lib/api-errors";
import { createServerTiming } from "@/lib/server-timing";
import { assertModuleAccess } from "@/lib/plans";
import {
  createCommerceCategory,
  createCommerceSubcategory,
  deleteCommerceCategory,
  deleteCommerceProduct,
  deleteCommerceSubcategory,
  getCommerceAdminSectionProducts,
  getCommerceAdminStructure,
  moveCommerceCategory,
  moveCommerceProduct,
  moveCommerceSubcategory,
  saveCommerceConfig,
  saveCommerceProduct,
  toggleCommerceProductVisibility,
  updateCommerceCategory,
  updateCommerceSubcategory,
} from "@/lib/commerce-firestore";

function parsePayload(formData) {
  const raw = formData.get("payload");
  if (typeof raw !== "string" || !raw.trim()) return {};
  return JSON.parse(raw);
}

export async function GET(request) {
  const timing = createServerTiming();
  try {
    const { user } = await timing.measure("auth", () => verifyRequest(request), "verify");
    assertModuleAccess(user, "commerce");

    const { searchParams } = new URL(request.url);
    const view = String(searchParams.get("view") || "structure").trim().toLowerCase();

    if (view === "products") {
      const section = await timing.measure("products", () => getCommerceAdminSectionProducts(user.uid, {
        categoryId: String(searchParams.get("categoryId") || "").trim(),
        subcategoryId: String(searchParams.get("subcategoryId") || "").trim(),
      }, user), "section");
      const payload = { section };
      return NextResponse.json(payload, {
        headers: timing.headers(payload),
      });
    }

    const state = await timing.measure("structure", () => getCommerceAdminStructure(user.uid, user), "commerce-admin");
    const payload = { state };
    return NextResponse.json(payload, {
      headers: timing.headers(payload),
    });
  } catch (error) {
    const payload = { error: formatApiError(error, "No pudimos cargar el modulo comercial.") };
    return NextResponse.json(payload, {
      status: 400,
      headers: timing.headers(payload),
    });
  }
}

export async function POST(request) {
  const timing = createServerTiming();
  try {
    const { user } = await timing.measure("auth", () => verifyRequest(request), "verify");
    assertModuleAccess(user, "commerce");

    const formData = await timing.measure("formdata", () => request.formData(), "parse");
    const action = String(formData.get("action") || "").trim();
    const payload = parsePayload(formData);
    const image = formData.get("image");
    const images = formData.getAll("images").filter((item) => item && typeof item === "object" && "size" in item && item.size);

    let result = null;

    switch (action) {
      case "save_config":
        result = await timing.measure("mutation", () => saveCommerceConfig(user.uid, payload, user), action);
        break;
      case "create_category":
        result = await timing.measure("mutation", () => createCommerceCategory(user.uid, payload, user), action);
        break;
      case "update_category":
        result = await timing.measure("mutation", () => updateCommerceCategory(user.uid, payload, user), action);
        break;
      case "delete_category":
        result = await timing.measure("mutation", () => deleteCommerceCategory(user.uid, payload.categoryId, user), action);
        break;
      case "move_category":
        result = await timing.measure("mutation", () => moveCommerceCategory(user.uid, payload.categoryId, payload.direction, user), action);
        break;
      case "create_subcategory":
        result = await timing.measure("mutation", () => createCommerceSubcategory(user.uid, payload, user), action);
        break;
      case "update_subcategory":
        result = await timing.measure("mutation", () => updateCommerceSubcategory(user.uid, payload, user), action);
        break;
      case "delete_subcategory":
        result = await timing.measure("mutation", () => deleteCommerceSubcategory(user.uid, payload.subcategoryId, user), action);
        break;
      case "move_subcategory":
        result = await timing.measure("mutation", () => moveCommerceSubcategory(user.uid, payload.subcategoryId, payload.direction, user), action);
        break;
      case "save_product":
        result = await timing.measure("mutation", () => saveCommerceProduct(user.uid, payload, {
          images: images.length ? images : (image?.size ? [image] : []),
        }, user), action);
        break;
      case "delete_product":
        result = await timing.measure("mutation", () => deleteCommerceProduct(user.uid, payload.productId, user), action);
        break;
      case "move_product":
        result = await timing.measure("mutation", () => moveCommerceProduct(user.uid, payload.productId, payload.direction, user), action);
        break;
      case "toggle_product_visibility":
        result = await timing.measure("mutation", () => toggleCommerceProductVisibility(user.uid, payload.productId, payload.visible, user), action);
        break;
      default:
        throw new Error("Acción comercial no soportada.");
    }

    const payloadResponse = { ok: true, result };
    return NextResponse.json(payloadResponse, {
      headers: timing.headers(payloadResponse),
    });
  } catch (error) {
    const payloadResponse = { error: formatApiError(error, "No pudimos guardar los cambios del modulo comercial.") };
    return NextResponse.json(payloadResponse, {
      status: 400,
      headers: timing.headers(payloadResponse),
    });
  }
}
