import { NextResponse } from "next/server";
import { verifyRequest } from "@/lib/auth";
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

function assertCommerceAccess(user) {
  if (!["trial", "active"].includes(user.status)) {
    throw new Error("Tu cuenta no tiene permisos para editar el módulo comercial.");
  }
}

export async function GET(request) {
  try {
    const { user } = await verifyRequest(request);
    assertCommerceAccess(user);

    const { searchParams } = new URL(request.url);
    const view = String(searchParams.get("view") || "structure").trim().toLowerCase();

    if (view === "products") {
      const section = await getCommerceAdminSectionProducts(user.uid, {
        categoryId: String(searchParams.get("categoryId") || "").trim(),
        subcategoryId: String(searchParams.get("subcategoryId") || "").trim(),
      }, user);
      return NextResponse.json({ section });
    }

    const state = await getCommerceAdminStructure(user.uid, user);
    return NextResponse.json({ state });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    const { user } = await verifyRequest(request);
    assertCommerceAccess(user);

    const formData = await request.formData();
    const action = String(formData.get("action") || "").trim();
    const payload = parsePayload(formData);
    const image = formData.get("image");

    let result = null;

    switch (action) {
      case "save_config":
        result = await saveCommerceConfig(user.uid, payload, user);
        break;
      case "create_category":
        result = await createCommerceCategory(user.uid, payload, user);
        break;
      case "update_category":
        result = await updateCommerceCategory(user.uid, payload, user);
        break;
      case "delete_category":
        result = await deleteCommerceCategory(user.uid, payload.categoryId, user);
        break;
      case "move_category":
        result = await moveCommerceCategory(user.uid, payload.categoryId, payload.direction, user);
        break;
      case "create_subcategory":
        result = await createCommerceSubcategory(user.uid, payload, user);
        break;
      case "update_subcategory":
        result = await updateCommerceSubcategory(user.uid, payload, user);
        break;
      case "delete_subcategory":
        result = await deleteCommerceSubcategory(user.uid, payload.subcategoryId, user);
        break;
      case "move_subcategory":
        result = await moveCommerceSubcategory(user.uid, payload.subcategoryId, payload.direction, user);
        break;
      case "save_product":
        result = await saveCommerceProduct(user.uid, payload, {
          image: image?.size ? image : null,
        }, user);
        break;
      case "delete_product":
        result = await deleteCommerceProduct(user.uid, payload.productId, user);
        break;
      case "move_product":
        result = await moveCommerceProduct(user.uid, payload.productId, payload.direction, user);
        break;
      case "toggle_product_visibility":
        result = await toggleCommerceProductVisibility(user.uid, payload.productId, payload.visible, user);
        break;
      default:
        throw new Error("Acción comercial no soportada.");
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
