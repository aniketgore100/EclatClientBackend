import { z } from "zod";
import { prisma } from "../../../config/prisma.js";
import { NotFoundError } from "../../../common/errors.js";

interface SiteDoc {
  home: { seo: { title: string; description: string }; sections: Record<string, unknown>[] };
  chrome: Record<string, unknown> & { productPerks?: string[] };
}

const tokenSchema = z.string().uuid();

// The published content — or the draft, when a valid, unexpired preview token is supplied (the admin's
// Preview button). A malformed or expired token quietly falls back to the live version rather than
// revealing that previews exist.
async function document(previewToken?: string): Promise<{ doc: SiteDoc; preview: boolean }> {
  const row = await prisma.siteContent.findUnique({ where: { id: "site" } });
  if (previewToken && tokenSchema.safeParse(previewToken).success) {
    const t = await prisma.sitePreviewToken.findUnique({ where: { token: previewToken } });
    if (t && t.expiresAt > new Date() && row) return { doc: row.draft as unknown as SiteDoc, preview: true };
  }
  if (!row?.published) throw NotFoundError("The website content hasn't been published yet", "SITE_NOT_PUBLISHED");
  return { doc: row.published as unknown as SiteDoc, preview: false };
}

export const siteService = {
  // Same shape the storefront's /pages/home always returned: { seo, sections[] }.
  async home(previewToken?: string) {
    const { doc, preview } = await document(previewToken);
    return {
      preview,
      page: {
        slug: "home",
        seo: doc.home.seo,
        // Hidden sections are dropped here; the admin's own label and the on/off flag never leave the
        // admin, so each section is exactly the shape the storefront has always been given.
        sections: doc.home.sections.filter((s) => s.enabled !== false).map(({ name: _name, enabled: _enabled, ...section }) => section),
      },
    };
  },

  // Header, footer, announcement bar, newsletter… laid over the storefront's other (not-yet-editable) settings.
  async chrome(previewToken?: string) {
    const { doc, preview } = await document(previewToken);
    const { productPerks, ...rest } = doc.chrome;
    return { preview, chrome: { ...rest, productPage: { perks: productPerks ?? [] } } };
  },
};
