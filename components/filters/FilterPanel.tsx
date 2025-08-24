"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Filter,
  X,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import {
  useFilterStore,
  useAppliedFilters,
  useActiveFiltersCount,
} from "@/store/filters";

import { FilterCategoryComponent } from "./FilterCategory";
import { FilterChips } from "./FilterChips";

interface FilterPanelProps {
  className?: string;
}

export function FilterPanel({ className }: FilterPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const { isVisible, toggleFilterVisibility } = useFilterStore();
  const appliedFilters = useAppliedFilters();
  const activeFiltersCount = useActiveFiltersCount();
  const { clearAllFilters, resetToDefaults } = useFilterStore();

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const expandAllCategories = () => {
    setExpandedCategories(
      new Set([
        "region",
        "instanceType",
        "state",
        "wasteLevel",
        "environment",
        "service",
      ])
    );
  };

  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
  };

  if (!isVisible) {
    return (
      <div className={`${className} flex justify-center`}>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFilterVisibility}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Show Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} active</Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAllCategories}
              className="h-8 px-2 text-xs"
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAllCategories}
              className="h-8 px-2 text-xs"
            >
              Collapse All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFilterVisibility}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                Active Filters
              </h4>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                >
                  Clear All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToDefaults}
                  className="h-7 px-2 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
            <FilterChips />
          </div>
        )}

        <Separator />

        {/* Filter Categories */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Filter Categories
          </h4>

          {useFilterStore.getState().categories.map((category) => (
            <div key={category.id} className="border rounded-lg">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">
                      {category.label}
                    </span>
                    {appliedFilters.some(
                      (f) => f.categoryId === category.id
                    ) && (
                      <Badge variant="secondary" className="text-xs">
                        {appliedFilters.find(
                          (f) => f.categoryId === category.id
                        )?.values.length || 0}
                      </Badge>
                    )}
                  </div>
                  {expandedCategories.has(category.id) ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedCategories.has(category.id) && (
                <div className="px-3 pb-3">
                  <FilterCategoryComponent category={category} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Filters are automatically applied across all components</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
