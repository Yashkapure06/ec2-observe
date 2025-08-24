"use client";

import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { FilterCategory as FilterCategoryType } from "@/types/filters";
import { useFilterStore } from "@/store/filters";

interface FilterCategoryComponentProps {
  category: FilterCategoryType;
}

export function FilterCategoryComponent({
  category,
}: FilterCategoryComponentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { applyFilter, removeFilter, getFilterValues, isFilterApplied } =
    useFilterStore();

  const selectedValues = getFilterValues(category.id);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!category.searchable || !searchTerm) {
      return category.options;
    }

    return category.options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [category.options, category.searchable, searchTerm]);

  const handleToggleFilter = (value: string) => {
    if (isFilterApplied(category.id, value)) {
      removeFilter(category.id, value);
    } else {
      applyFilter(category.id, value);
    }
  };

  const clearSearch = () => setSearchTerm("");

  return (
    <div className="space-y-3">
      {/* Search Input for searchable categories */}
      {category.searchable && (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${category.label.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-8 h-8 text-sm"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Filter Options */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {filteredOptions.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No {category.label.toLowerCase()} found
          </div>
        ) : (
          filteredOptions.map((option) => {
            const isSelected = isFilterApplied(category.id, option.value);

            return (
              <div
                key={option.value}
                className="flex items-center space-x-2 hover:bg-muted/50 rounded-md p-2 transition-colors"
              >
                <Checkbox
                  id={`${category.id}-${option.value}`}
                  checked={isSelected}
                  onCheckedChange={() => handleToggleFilter(option.value)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label
                  htmlFor={`${category.id}-${option.value}`}
                  className="flex-1 text-sm cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{option.label}</span>
                    {option.count !== undefined && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {option.count}
                      </Badge>
                    )}
                  </div>
                </label>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Count */}
      {selectedValues.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {selectedValues.length} of {category.options.length} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              selectedValues.forEach((value) =>
                removeFilter(category.id, value)
              )
            }
            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
