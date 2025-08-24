import { EC2Instance } from "@/types/ec2";
import { AppliedFilter } from "@/types/filters";
import { wasteScore } from "@/lib/waste";

export interface FilterCriteria {
  region?: string[];
  instanceType?: string[];
  state?: string[];
  wasteLevel?: string[];
  environment?: string[];
  service?: string[];
}

export function applyFiltersToInstances(
  instances: EC2Instance[],
  appliedFilters: AppliedFilter[]
): EC2Instance[] {
  if (appliedFilters.length === 0) {
    return instances;
  }

  return instances.filter((instance) => {
    return appliedFilters.every((filter) => {
      const values = filter.values;

      switch (filter.categoryId) {
        case "region":
          return values.includes(instance.region);

        case "instanceType":
          return values.includes(instance.type);

        case "state":
          return values.includes(instance.state);

        case "wasteLevel": {
          const waste = wasteScore({
            cpu: instance.cpuUtilPct,
            ram: instance.ramUtilPct,
            gpu: instance.gpuUtilPct,
            uptimeHrs: instance.uptimeHrs,
            costPerHour: instance.costPerHour,
          });
          return values.includes(waste.level);
        }

        case "environment":
          return values.some(
            (env) =>
              instance.tags.Environment?.toLowerCase() === env.toLowerCase()
          );

        case "service":
          return values.some(
            (service) =>
              instance.tags.Service?.toLowerCase() === service.toLowerCase()
          );

        default:
          return true;
      }
    });
  });
}

export function getFilteredInstanceCount(
  instances: EC2Instance[],
  appliedFilters: AppliedFilter[]
): number {
  return applyFiltersToInstances(instances, appliedFilters).length;
}

export function getFilteredInstancesByCategory(
  instances: EC2Instance[],
  appliedFilters: AppliedFilter[],
  categoryId: string
): EC2Instance[] {
  // Remove the specified category from filters to get base filtered results
  const otherFilters = appliedFilters.filter(
    (f) => f.categoryId !== categoryId
  );
  return applyFiltersToInstances(instances, otherFilters);
}

export function getFilterOptionsWithCounts(
  instances: EC2Instance[],
  appliedFilters: AppliedFilter[],
  categoryId: string
): Array<{ value: string; label: string; count: number }> {
  const baseInstances = getFilteredInstancesByCategory(
    instances,
    appliedFilters,
    categoryId
  );

  switch (categoryId) {
    case "region": {
      const counts = baseInstances.reduce((acc, instance) => {
        acc[instance.region] = (acc[instance.region] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts).map(([value, count]) => ({
        value,
        label: value,
        count,
      }));
    }

    case "instanceType": {
      const counts = baseInstances.reduce((acc, instance) => {
        acc[instance.type] = (acc[instance.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts).map(([value, count]) => ({
        value,
        label: value,
        count,
      }));
    }

    case "state": {
      const counts = baseInstances.reduce((acc, instance) => {
        acc[instance.state] = (acc[instance.state] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts).map(([value, count]) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
        count,
      }));
    }

    case "wasteLevel": {
      const counts = baseInstances.reduce((acc, instance) => {
        const waste = wasteScore({
          cpu: instance.cpuUtilPct,
          ram: instance.ramUtilPct,
          gpu: instance.gpuUtilPct,
          uptimeHrs: instance.uptimeHrs,
          costPerHour: instance.costPerHour,
        });
        acc[waste.level] = (acc[waste.level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts).map(([value, count]) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
        count,
      }));
    }

    case "environment": {
      const counts = baseInstances.reduce((acc, instance) => {
        const env = instance.tags.Environment?.toLowerCase() || "unknown";
        acc[env] = (acc[env] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts).map(([value, count]) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
        count,
      }));
    }

    case "service": {
      const counts = baseInstances.reduce((acc, instance) => {
        const service = instance.tags.Service?.toLowerCase() || "unknown";
        acc[service] = (acc[service] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts).map(([value, count]) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
        count,
      }));
    }

    default:
      return [];
  }
}

export function createFilterSummary(
  instances: EC2Instance[],
  appliedFilters: AppliedFilter[]
): {
  totalInstances: number;
  filteredInstances: number;
  filterBreakdown: Record<string, number>;
} {
  const totalInstances = instances.length;
  const filteredInstances = getFilteredInstanceCount(instances, appliedFilters);

  const filterBreakdown = appliedFilters.reduce((acc, filter) => {
    acc[filter.categoryId] = filter.values.length;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalInstances,
    filteredInstances,
    filterBreakdown,
  };
}
