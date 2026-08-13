import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/session";
import { deleteMindMap } from "@/services/mindmaps/mindMapService";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ mapId: string }> }
) {
  const { mapId } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count } = await deleteMindMap(mapId, user.id);
  if (count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
