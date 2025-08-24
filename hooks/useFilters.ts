import { useMemo } from "react";
import { useAppliedFilters } from "@/store/filters";
import {
  applyFiltersToInstances,
  getFilterOptionsWithCounts,
  createFilterSummary,
} from "@/lib/filter-utils";
import { EC2Instance } from "@/types/ec2";

export function useFilteredInstances(instances: EC2Instance[]) {
  const appliedFilters = useAppliedFilters();

  const filteredInstances = useMemo(() => {
    return applyFiltersToInstances(instances, appliedFilters);
  }, [instances, appliedFilters]);

  const filterSummary = useMemo(() => {
    return createFilterSummary(instances, appliedFilters);
  }, [instances, appliedFilters]);

  const getFilterOptions = (categoryId: string) => {
    return getFilterOptionsWithCounts(instances, appliedFilters, categoryId);
  };

  return {
    filteredInstances,
    filterSummary,
    getFilterOptions,
    hasActiveFilters: appliedFilters.length > 0,
    activeFiltersCount: appliedFilters.reduce(
      (total, filter) => total + filter.values.length,
      0
    ),
  };
}

export function useFilterStats(instances: EC2Instance[]) {
  const appliedFilters = useAppliedFilters();

  return useMemo(() => {
    const totalInstances = instances.length;
    const filteredInstances = applyFiltersToInstances(
      instances,
      appliedFilters
    ).length;

    return {
      totalInstances,
      filteredInstances,
      filterPercentage:
        totalInstances > 0 ? (filteredInstances / totalInstances) * 100 : 0,
      isFiltered: appliedFilters.length > 0,
    };
  }, [instances, appliedFilters]);
}
