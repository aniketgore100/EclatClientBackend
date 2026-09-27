import { homepageRepository, type HomepageSectionRow } from "../repository/homepage.repository.js";
import { productRepository } from "../repository/product.repository.js";
import { toCard } from "./product.service.js";
import { extractProductIds } from "../homepage/section-utils.js";

function toSectionDto(row: HomepageSectionRow, draft: boolean) {
  return {
    id: row.id,
    type: row.type,
    key: row.key,
    name: row.name,
    order: draft ? row.order : row.publishedOrder,
    content: draft ? row.content : row.publishedContent,
    settings: draft ? row.settings : row.publishedSettings,
  };
}

async function resolveProducts(sections: { content: unknown }[]) {
  const ids = new Set<string>();
  for (const section of sections) extractProductIds(section.content, ids);
  if (!ids.size) return {};

  const cards = await productRepository.findByIds(Array.from(ids));
  const byId: Record<string, ReturnType<typeof toCard>> = {};
  for (const card of cards) byId[card.id] = toCard(card);
  return byId;
}

export const homepageService = {
  // The public homepage — if nothing has ever been published (fresh install)
  // or the admin has explicitly unpublished, `isLive` is false and the
  // frontend falls back to its original, pre-CMS hardcoded markup instead of
  // showing a blank page.
  async getPublished() {
    const statusRow = await homepageRepository.getStatus();
    const isLive = Boolean((statusRow?.json as { isLive?: boolean } | undefined)?.isLive);
    if (!isLive) return { isLive: false, sections: [], products: {} };

    const rows = await homepageRepository.findPublishedSections();
    const sections = rows.map((row) => toSectionDto(row, false));
    const products = await resolveProducts(sections);
    return { isLive: true, sections, products };
  },

  // Draft preview — a valid, unexpired token (issued by the admin) shows the
  // in-progress draft; an invalid/expired one quietly falls back to the
  // normal published homepage rather than erroring on a stale link.
  async getPreview(token: string) {
    const validToken = await homepageRepository.findValidPreviewToken(token);
    if (!validToken) return this.getPublished();

    const rows = await homepageRepository.findDraftSections();
    const sections = rows.map((row) => toSectionDto(row, true));
    const products = await resolveProducts(sections);
    return { isLive: true, preview: true, sections, products };
  },
};
