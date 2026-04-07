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

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

  return (
    <Sheet open={isVisible} onOpenChange={(open) => { if (open !== isVisible) toggleFilterVisibility() }}>
      <div className={`${className} flex justify-end mb-4`}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center space-x-2 bg-background shadow-sm"
          >
            <Filter className="h-4 w-4" />
            <span>Show Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
      </div>

      <SheetContent side="right" className="w-[340px] sm:w-[500px] overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
          <SheetTitle className="flex items-center space-x-2 text-lg">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">{activeFiltersCount} active</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Active Filters
                </h4>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
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
              <Separator className="mt-6" />
            </div>
          )}

          {/* Filter Categories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Filter Categories
              </h4>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={expandAllCategories}
                  className="h-6 px-2 text-xs text-muted-foreground"
                >
                  Expand All
                </Button>
                <div className="w-px h-3 bg-border mx-1"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={collapseAllCategories}
                  className="h-6 px-2 text-xs text-muted-foreground"
                >
                  Collapse All
                </Button>
              </div>
            </div>

            <div className="border rounded-lg divide-y bg-card shadow-sm">
              {useFilterStore.getState().categories.map((category) => (
                <div key={category.id} className="flex flex-col group">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-sm">
                        {category.label}
                      </span>
                      {appliedFilters.some(
                        (f) => f.categoryId === category.id
                      ) && (
                        <Badge variant="default" className="text-[10px] h-5 px-1.5">
                          {appliedFilters.find(
                            (f) => f.categoryId === category.id
                          )?.values.length || 0}
                        </Badge>
                      )}
                    </div>
                    {expandedCategories.has(category.id) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </button>

                  {expandedCategories.has(category.id) && (
                    <div className="px-4 pb-4 pt-2 bg-muted/20 border-t">
                      <FilterCategoryComponent category={category} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="p-4 border-t bg-muted/10 mt-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Filters apply automatically</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-background">
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
