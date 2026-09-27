import { createFacetRepository } from "../repository/facet.repository.js";

export function createFacetService(repository: ReturnType<typeof createFacetRepository>) {
  return {
    list() {
      return repository.findActive();
    },
  };
}
