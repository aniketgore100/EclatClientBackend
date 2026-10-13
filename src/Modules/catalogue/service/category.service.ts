import { categoryRepository } from "../repository/category.repository.js";
import { NotFoundError } from "../../../common/errors.js";
import type { CategoryGetPayload } from "../../../generated/prisma/models.js";

function toCategory(c: CategoryGetPayload<object>) {
  return {
    slug: c.slug,
    name: c.name,
    description: c.description ?? "",
    image: c.image ? { url: c.image, alt: c.name } : null,
  };
}

export const categoryService = {
  async list() {
    return (await categoryRepository.findActive()).map(toCategory);
  },

  async getBySlug(slug: string) {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) throw NotFoundError("Category not found", "CATEGORY_NOT_FOUND");
    return toCategory(category);
  },
};
