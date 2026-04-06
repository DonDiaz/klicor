import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
import {
  createCommerceCategory,
  createCommerceSubcategory,
  deleteCommerceCategory,
  deleteCommerceProduct,
  deleteCommerceSubcategory,
  getCommerceAdminState,
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
  try {
    const { user } = await verifyRequest(request);
    if (!["trial", "active"].includes(user.status)) {
      throw new Error("Tu cuenta no tiene permisos para editar el módulo comercial.");
    }
    const state = await getCommerceAdminState(user.uid, user);
    return NextResponse.json({ state });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    const { user } = await verifyRequest(request);
    if (!["trial", "active"].includes(user.status)) {
      throw new Error("Tu cuenta no tiene permisos para editar el módulo comercial.");
    }
    const formData = await request.formData();
    const action = String(formData.get("action") || "").trim();
    const payload = parsePayload(formData);
    const image = formData.get("image");

    let state = null;

    switch (action) {
      case "save_config":
        state = await saveCommerceConfig(user.uid, payload, user);
        break;
      case "create_category":
        state = await createCommerceCategory(user.uid, payload, user);
        break;
      case "update_category":
        state = await updateCommerceCategory(user.uid, payload, user);
        break;
      case "delete_category":
        state = await deleteCommerceCategory(user.uid, payload.categoryId, user);
        break;
      case "move_category":
        state = await moveCommerceCategory(user.uid, payload.categoryId, payload.direction, user);
        break;
      case "create_subcategory":
        state = await createCommerceSubcategory(user.uid, payload, user);
        break;
      case "update_subcategory":
        state = await updateCommerceSubcategory(user.uid, payload, user);
        break;
      case "delete_subcategory":
        state = await deleteCommerceSubcategory(user.uid, payload.subcategoryId, user);
        break;
      case "move_subcategory":
        state = await moveCommerceSubcategory(user.uid, payload.subcategoryId, payload.direction, user);
        break;
      case "save_product":
        state = await saveCommerceProduct(user.uid, payload, {
          image: image?.size ? image : null,
        }, user);
        break;
      case "delete_product":
        state = await deleteCommerceProduct(user.uid, payload.productId, user);
        break;
      case "move_product":
        state = await moveCommerceProduct(user.uid, payload.productId, payload.direction, user);
        break;
      case "toggle_product_visibility":
        state = await toggleCommerceProductVisibility(user.uid, payload.productId, payload.visible, user);
        break;
      default:
        throw new Error("Acción comercial no soportada.");
    }

    return NextResponse.json({ state });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
