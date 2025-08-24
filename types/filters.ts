export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterCategory {
  id: string;
  label: string;
  options: FilterOption[];
  multiSelect?: boolean;
  searchable?: boolean;
}

export interface AppliedFilter {
  categoryId: string;
  values: string[];
}

export interface FilterState {
  appliedFilters: AppliedFilter[];
  isVisible: boolean;
}

export interface FilterConfig {
  categories: FilterCategory[];
  defaultFilters?: AppliedFilter[];
}

// Predefined filter categories
export const FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: "region",
    label: "Region",
    options: [
      { value: "us-east-1", label: "US East (N. Virginia)" },
      { value: "us-west-2", label: "US West (Oregon)" },
      { value: "eu-west-1", label: "Europe (Ireland)" },
      { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
    ],
    multiSelect: true,
    searchable: false,
  },
  {
    id: "instanceType",
    label: "Instance Type",
    options: [
      { value: "t3.micro", label: "t3.micro" },
      { value: "t3.small", label: "t3.small" },
      { value: "t3.medium", label: "t3.medium" },
      { value: "t3.large", label: "t3.large" },
      { value: "r5.xlarge", label: "r5.xlarge" },
      { value: "p3.2xlarge", label: "p3.2xlarge" },
    ],
    multiSelect: true,
    searchable: true,
  },
  {
    id: "state",
    label: "State",
    options: [
      { value: "running", label: "Running" },
      { value: "stopped", label: "Stopped" },
      { value: "terminated", label: "Terminated" },
    ],
    multiSelect: true,
    searchable: false,
  },
  {
    id: "wasteLevel",
    label: "Waste Level",
    options: [
      { value: "good", label: "Good" },
      { value: "warning", label: "Warning" },
      { value: "critical", label: "Critical" },
    ],
    multiSelect: true,
    searchable: false,
  },
  {
    id: "environment",
    label: "Environment",
    options: [
      { value: "production", label: "Production" },
      { value: "staging", label: "Staging" },
      { value: "development", label: "Development" },
    ],
    multiSelect: true,
    searchable: false,
  },
  {
    id: "service",
    label: "Service",
    options: [
      { value: "web-server", label: "Web Server" },
      { value: "database", label: "Database" },
      { value: "ml-training", label: "ML Training" },
      { value: "monitoring", label: "Monitoring" },
    ],
    multiSelect: true,
    searchable: true,
  },
];

// Filter utility functions
export function createFilterOption(
  value: string,
  label: string,
  count?: number
): FilterOption {
  return { value, label, count };
}

export function createFilterCategory(
  id: string,
  label: string,
  options: FilterOption[],
  multiSelect = false,
  searchable = false
): FilterCategory {
  return { id, label, options, multiSelect, searchable };
}

export function isFilterApplied(
  appliedFilters: AppliedFilter[],
  categoryId: string,
  value: string
): boolean {
  const filter = appliedFilters.find((f) => f.categoryId === categoryId);
  return filter ? filter.values.includes(value) : false;
}

export function getFilterValues(
  appliedFilters: AppliedFilter[],
  categoryId: string
): string[] {
  const filter = appliedFilters.find((f) => f.categoryId === categoryId);
  return filter ? filter.values : [];
}

export function hasActiveFilters(appliedFilters: AppliedFilter[]): boolean {
  return appliedFilters.some((filter) => filter.values.length > 0);
}
