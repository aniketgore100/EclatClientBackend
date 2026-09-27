// Read-only access to the storefront's admin-managed facet lookups
// (ProductType, Polish, Stone, PearlColour) — the filter drawer's option
// list is fetched from here, not hardcoded in the frontend.
type FacetRow = { id: string; name: string; slug: string; hex?: string | null; position: number };

type FacetDelegate = {
  findMany: (args: { where: { isActive: boolean }; orderBy: { position: "asc" } }) => Promise<FacetRow[]>;
};

export function createFacetRepository(delegate: FacetDelegate) {
  return {
    findActive(): Promise<FacetRow[]> {
      return delegate.findMany({ where: { isActive: true }, orderBy: { position: "asc" } });
    },
  };
}
