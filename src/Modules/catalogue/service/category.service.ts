import { categoryRepository } from "../repository/category.repository.js";
import { NotFoundError } from "../../../common/errors.js";

export const categoryService = {
  list() {
    return categoryRepository.findActive();
  },

  async getBySlug(slug: string) {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) throw NotFoundError("Category not found", "CATEGORY_NOT_FOUND");
    return category;
  },
};
