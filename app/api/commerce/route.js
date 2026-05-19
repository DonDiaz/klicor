import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import { formatApiError } from "@/lib/api-errors";
import { createServerTiming } from "@/lib/server-timing";
import { assertModuleAccess } from "@/lib/plans";
import { assertAgencyCanEditBusiness, recordAgencyEdit } from "@/lib/agency";
import { writeAuditLog } from "@/lib/audit-log";
import { checkDurableRateLimit, durableRateLimitResponse } from "@/lib/durable-rate-limit";
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
    const { searchParams } = new URL(request.url);
    const targetUid = String(searchParams.get("targetUid") || "").trim();
    const agencyAccess = targetUid ? await timing.measure("agency", () => assertAgencyCanEditBusiness(user, targetUid, "commerce"), "agency") : null;
    const effectiveUser = agencyAccess?.business || user;
    assertModuleAccess(effectiveUser, "commerce");
    const view = String(searchParams.get("view") || "structure").trim().toLowerCase();

    if (view === "products") {
      const section = await timing.measure("products", () => getCommerceAdminSectionProducts(effectiveUser.uid, {
        categoryId: String(searchParams.get("categoryId") || "").trim(),
        subcategoryId: String(searchParams.get("subcategoryId") || "").trim(),
      }, effectiveUser), "section");
      const payload = { section };
      return NextResponse.json(payload, {
        headers: timing.headers(payload),
      });
    }

    const state = await timing.measure("structure", () => getCommerceAdminStructure(effectiveUser.uid, effectiveUser), "commerce-admin");
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
    const { user } = await timing.measure("auth", () => verifyRequest(request, { checkRevoked: true }), "verify");
    const formData = await timing.measure("formdata", () => request.formData(), "parse");
    const targetUid = String(formData.get("targetUid") || "").trim();
    const agencyAccess = targetUid ? await timing.measure("agency", () => assertAgencyCanEditBusiness(user, targetUid, "commerce"), "agency") : null;
    const effectiveUser = agencyAccess?.business || user;
    assertModuleAccess(effectiveUser, "commerce");
    const action = String(formData.get("action") || "").trim();
    const payload = parsePayload(formData);
    const image = formData.get("image");
    const images = formData.getAll("images").filter((item) => item && typeof item === "object" && "size" in item && item.size);
    if (image?.size || images.length) {
      const uploadRate = await timing.measure(
        "upload-rate",
        () => checkDurableRateLimit(request, {
          key: `commerce-upload:${effectiveUser.uid}`,
          limit: 80,
          windowMs: 60 * 60_000,
        }),
        "upload-rate",
      );
      if (uploadRate.limited) {
        return durableRateLimitResponse(uploadRate, "Demasiadas subidas de imagen. Intenta de nuevo mas tarde.");
      }
    }

    let result = null;

    switch (action) {
      case "save_config":
        result = await timing.measure("mutation", () => saveCommerceConfig(effectiveUser.uid, payload, effectiveUser), action);
        break;
      case "create_category":
        result = await timing.measure("mutation", () => createCommerceCategory(effectiveUser.uid, payload, effectiveUser), action);
        break;
      case "update_category":
        result = await timing.measure("mutation", () => updateCommerceCategory(effectiveUser.uid, payload, effectiveUser), action);
        break;
      case "delete_category":
        result = await timing.measure("mutation", () => deleteCommerceCategory(effectiveUser.uid, payload.categoryId, effectiveUser), action);
        break;
      case "move_category":
        result = await timing.measure("mutation", () => moveCommerceCategory(effectiveUser.uid, payload.categoryId, payload.direction, effectiveUser), action);
        break;
      case "create_subcategory":
        result = await timing.measure("mutation", () => createCommerceSubcategory(effectiveUser.uid, payload, effectiveUser), action);
        break;
      case "update_subcategory":
        result = await timing.measure("mutation", () => updateCommerceSubcategory(effectiveUser.uid, payload, effectiveUser), action);
        break;
      case "delete_subcategory":
        result = await timing.measure("mutation", () => deleteCommerceSubcategory(effectiveUser.uid, payload.subcategoryId, effectiveUser), action);
        break;
      case "move_subcategory":
        result = await timing.measure("mutation", () => moveCommerceSubcategory(effectiveUser.uid, payload.subcategoryId, payload.direction, effectiveUser), action);
        break;
      case "save_product":
        result = await timing.measure("mutation", () => saveCommerceProduct(effectiveUser.uid, payload, {
          images: images.length ? images : (image?.size ? [image] : []),
        }, effectiveUser), action);
        break;
      case "delete_product":
        result = await timing.measure("mutation", () => deleteCommerceProduct(effectiveUser.uid, payload.productId, effectiveUser), action);
        break;
      case "move_product":
        result = await timing.measure("mutation", () => moveCommerceProduct(effectiveUser.uid, payload.productId, payload.direction, effectiveUser), action);
        break;
      case "toggle_product_visibility":
        result = await timing.measure("mutation", () => toggleCommerceProductVisibility(effectiveUser.uid, payload.productId, payload.visible, effectiveUser), action);
        break;
      default:
        throw new Error("Acción comercial no soportada.");
    }

    if (agencyAccess) {
      await timing.measure("agency-trace", () => recordAgencyEdit(agencyAccess, `commerce:${action}`), "agency-trace");
    }
    if (["save_config", "delete_category", "delete_subcategory", "delete_product", "toggle_product_visibility"].includes(action)) {
      writeAuditLog({
        request,
        actor: user,
        role: agencyAccess ? "agency" : user.role || "owner",
        action: `commerce.${action}`,
        targetUid: effectiveUser.uid,
        status: "success",
        metadata: { agencyMode: Boolean(agencyAccess) },
      }).catch((error) => console.error("[audit-log]", error?.message || error));
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
