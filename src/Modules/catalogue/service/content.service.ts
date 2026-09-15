import { contentRepository } from "../repository/content.repository.js";
import { NotFoundError } from "../../../common/errors.js";
import type { ContentGetPayload } from "../../../generated/prisma/models.js";

const HOME_KEYS = ["home.hero", "home.trust_row", "home.comparison_table"];

export const contentService = {
  async getHome() {
    const rows = await contentRepository.findByKeys(HOME_KEYS);
    const byKey = new Map(rows.map((r: ContentGetPayload<object>) => [r.key, r.json]));
    return {
      hero: byKey.get("home.hero") ?? null,
      trustRow: byKey.get("home.trust_row") ?? null,
      comparisonTable: byKey.get("home.comparison_table") ?? null,
    };
  },

  async getByKey(key: string) {
    const row = await contentRepository.findByKey(key);
    if (!row) throw NotFoundError("Content not found", "CONTENT_NOT_FOUND");
    return row.json;
  },
};
