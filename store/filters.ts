import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  FilterState,
  AppliedFilter,
  FilterCategory,
  FILTER_CATEGORIES,
} from "@/types/filters";

// Extended interfaces for advanced settings
interface DefaultFilters {
  state?: string;
  wasteLevel?: string;
  environment?: string;
  service?: string;
}

interface FilterBehavior {
  autoApplyDefaults: boolean;
  defaultPanelVisibility: boolean;
  persistFilters: boolean;
  showFilterCounts: boolean;
  highlightActiveFilters: boolean;
  enableQuickReset: boolean;
  maxVisibleFilters: number;
  filterUpdateDelay: number;
  enableExperimentalFeatures: boolean;
}

interface FilterStore extends FilterState {
  // Actions
  toggleFilterVisibility: () => void;
  applyFilter: (categoryId: string, value: string) => void;
  removeFilter: (categoryId: string, value: string) => void;
  clearCategoryFilters: (categoryId: string) => void;
  clearAllFilters: () => void;
  resetToDefaults: () => void;

  // Settings actions
  setDefaultFilters: (defaults: DefaultFilters) => void;
  setFilterBehavior: (behavior: Partial<FilterBehavior>) => void;

  // Computed values
  getActiveFiltersCount: () => number;
  getFilterValues: (categoryId: string) => string[];
  isFilterApplied: (categoryId: string, value: string) => boolean;

  // Filter categories
  categories: FilterCategory[];

  // Settings state
  defaultFilters: DefaultFilters;
  filterBehavior: FilterBehavior;
}

const defaultAppliedFilters: AppliedFilter[] = [
  // Default to showing all running instances
  { categoryId: "state", values: ["running"] },
];

const defaultFilterSettings: DefaultFilters = {
  state: "running",
  wasteLevel: undefined,
  environment: undefined,
  service: undefined,
};

const defaultBehaviorSettings: FilterBehavior = {
  autoApplyDefaults: true,
  defaultPanelVisibility: true,
  persistFilters: true,
  showFilterCounts: true,
  highlightActiveFilters: true,
  enableQuickReset: true,
  maxVisibleFilters: 5,
  filterUpdateDelay: 300,
  enableExperimentalFeatures: false,
};

export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      // Initial state
      appliedFilters: defaultAppliedFilters,
      isVisible: true,
      categories: FILTER_CATEGORIES,
      defaultFilters: defaultFilterSettings,
      filterBehavior: defaultBehaviorSettings,

      // Actions
      toggleFilterVisibility: () =>
        set((state) => ({ isVisible: !state.isVisible })),

      applyFilter: (categoryId: string, value: string) =>
        set((state) => {
          const existingFilter = state.appliedFilters.find(
            (f) => f.categoryId === categoryId
          );

          if (existingFilter) {
            // Add value if not already present
            if (!existingFilter.values.includes(value)) {
              return {
                appliedFilters: state.appliedFilters.map((f) =>
                  f.categoryId === categoryId
                    ? { ...f, values: [...f.values, value] }
                    : f
                ),
              };
            }
          } else {
            // Create new filter category
            return {
              appliedFilters: [
                ...state.appliedFilters,
                { categoryId, values: [value] },
              ],
            };
          }

          return state;
        }),

      removeFilter: (categoryId: string, value: string) =>
        set((state) => ({
          appliedFilters: state.appliedFilters
            .map((f) =>
              f.categoryId === categoryId
                ? { ...f, values: f.values.filter((v) => v !== value) }
                : f
            )
            .filter((f) => f.values.length > 0), // Remove empty filter categories
        })),

      clearCategoryFilters: (categoryId: string) =>
        set((state) => ({
          appliedFilters: state.appliedFilters.filter(
            (f) => f.categoryId !== categoryId
          ),
        })),

      clearAllFilters: () => set({ appliedFilters: [] }),

      resetToDefaults: () => {
        const state = get();
        if (state.filterBehavior.autoApplyDefaults) {
          // Apply default filters if auto-apply is enabled
          const defaultFilters = state.defaultFilters;
          const newAppliedFilters: AppliedFilter[] = [];

          if (defaultFilters.state) {
            newAppliedFilters.push({
              categoryId: "state",
              values: [defaultFilters.state],
            });
          }
          if (defaultFilters.wasteLevel) {
            newAppliedFilters.push({
              categoryId: "wasteLevel",
              values: [defaultFilters.wasteLevel],
            });
          }
          if (defaultFilters.environment) {
            newAppliedFilters.push({
              categoryId: "environment",
              values: [defaultFilters.environment],
            });
          }
          if (defaultFilters.service) {
            newAppliedFilters.push({
              categoryId: "service",
              values: [defaultFilters.service],
            });
          }

          // If no defaults are set, fall back to running instances
          if (newAppliedFilters.length === 0) {
            newAppliedFilters.push({
              categoryId: "state",
              values: ["running"],
            });
          }

          set({ appliedFilters: newAppliedFilters });
        } else {
          set({ appliedFilters: defaultAppliedFilters });
        }
      },

      // Settings actions
      setDefaultFilters: (defaults: DefaultFilters) =>
        set((state) => ({
          defaultFilters: { ...state.defaultFilters, ...defaults },
        })),

      setFilterBehavior: (behavior: Partial<FilterBehavior>) =>
        set((state) => ({
          filterBehavior: { ...state.filterBehavior, ...behavior },
        })),

      // Computed values
      getActiveFiltersCount: () => {
        const state = get();
        return state.appliedFilters.reduce(
          (total, filter) => total + filter.values.length,
          0
        );
      },

      getFilterValues: (categoryId: string) => {
        const state = get();
        const filter = state.appliedFilters.find(
          (f) => f.categoryId === categoryId
        );
        return filter ? filter.values : [];
      },

      isFilterApplied: (categoryId: string, value: string) => {
        const state = get();
        const filter = state.appliedFilters.find(
          (f) => f.categoryId === categoryId
        );
        return filter ? filter.values.includes(value) : false;
      },
    }),
    {
      name: "ec2-observe-filters",
      partialize: (state) => ({
        appliedFilters: state.appliedFilters,
        isVisible: state.isVisible,
        defaultFilters: state.defaultFilters,
        filterBehavior: state.filterBehavior,
      }),
    }
  )
);

// Selector hooks for better performance
export const useAppliedFilters = () =>
  useFilterStore((state) => state.appliedFilters);
export const useFilterVisibility = () =>
  useFilterStore((state) => state.isVisible);
export const useActiveFiltersCount = () =>
  useFilterStore((state) => state.getActiveFiltersCount());
export const useFilterCategories = () =>
  useFilterStore((state) => state.categories);

// Action hooks
export const useFilterActions = () =>
  useFilterStore((state) => ({
    toggleFilterVisibility: state.toggleFilterVisibility,
    applyFilter: state.applyFilter,
    removeFilter: state.removeFilter,
    clearCategoryFilters: state.clearCategoryFilters,
    clearAllFilters: state.clearAllFilters,
    resetToDefaults: state.resetToDefaults,
    setDefaultFilters: state.setDefaultFilters,
    setFilterBehavior: state.setFilterBehavior,
  }));

// Settings hooks
export const useDefaultFilters = () =>
  useFilterStore((state) => state.defaultFilters);
export const useFilterBehavior = () =>
  useFilterStore((state) => state.filterBehavior);
