import { wishlistRepository } from "../repository/wishlist.repository.js";
import { AppError, NotFoundError } from "../../../common/errors.js";
import { MAX_WISHLIST } from "../dto/wishlist.dto.js";

const list = async (customerId: string) => ({ slugs: await wishlistRepository.slugs(customerId) });

export const wishlistService = {
  list,

  // Idempotent: saving something already saved is a no-op, not an error.
  async add(customerId: string, slug: string) {
    const [product] = await wishlistRepository.findActiveProducts([slug]);
    if (!product) throw NotFoundError("Product not found", "PRODUCT_NOT_FOUND");
    if ((await wishlistRepository.count(customerId)) >= MAX_WISHLIST) {
      const already = (await wishlistRepository.slugs(customerId)).includes(slug);
      if (!already) throw new AppError(409, "WISHLIST_FULL", `Your wishlist can hold up to ${MAX_WISHLIST} pieces`);
    }
    await wishlistRepository.addMany(customerId, [product.id]);
    return list(customerId);
  },

  async remove(customerId: string, slug: string) {
    await wishlistRepository.removeBySlug(customerId, slug);
    return list(customerId);
  },

  // Guest wishlist → account at login. Unknown or hidden products are ignored; the rest are
  // unioned with what's already saved, up to the cap.
  async merge(customerId: string, slugs: string[]) {
    const products = await wishlistRepository.findActiveProducts([...new Set(slugs)]);
    const room = Math.max(0, MAX_WISHLIST - (await wishlistRepository.count(customerId)));
    await wishlistRepository.addMany(customerId, products.slice(0, room).map((p) => p.id));
    return list(customerId);
  },
};
