import { notFound, withUser } from "@/lib/api";
import { deleteMindMap } from "@/services/mindmaps/mindMapService";

export const DELETE = withUser<{ mapId: string }>(async ({ params, user }) => {
  const { count } = await deleteMindMap(params.mapId, user.id);
  if (count === 0) throw notFound("Mind map not found");
  return { ok: true };
});
