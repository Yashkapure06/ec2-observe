"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useFilterStore, useAppliedFilters } from "@/store/filters";
import { FILTER_CATEGORIES } from "@/types/filters";

export function FilterChips() {
  const appliedFilters = useAppliedFilters();
  const { removeFilter } = useFilterStore();
  const categories = FILTER_CATEGORIES;

  if (appliedFilters.length === 0) {
    return null;
  }

  const getCategoryLabel = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.label || categoryId;
  };

  const getOptionLabel = (categoryId: string, value: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.options.find((opt) => opt.value === value)?.label || value;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {appliedFilters.map((filter) =>
        filter.values.map((value) => (
          <Badge
            key={`${filter.categoryId}-${value}`}
            variant="secondary"
            className="flex items-center space-x-1 px-2 py-1 text-xs"
          >
            <span className="font-medium text-muted-foreground">
              {getCategoryLabel(filter.categoryId)}:
            </span>
            <span>{getOptionLabel(filter.categoryId, value)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFilter(filter.categoryId, value)}
              className="h-4 w-4 p-0 ml-1 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))
      )}
    </div>
  );
}
