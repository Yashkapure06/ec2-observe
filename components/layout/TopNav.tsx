"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Filter,
  Server,
  DollarSign,
  TrendingUp,
  Settings,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useFilterStore, useActiveFiltersCount } from "@/store/filters";
import { FilterSettingsDialog } from "@/components/dialogs/FilterSettingsDialog";

export function TopNav() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { applyFilter, clearAllFilters, resetToDefaults } = useFilterStore();
  const activeFiltersCount = useActiveFiltersCount();

  const quickFilters = [
    {
      label: "Critical Waste",
      icon: AlertTriangle,
      value: "critical-waste",
      description: "Show instances with critical waste levels",
      action: () => {
        clearAllFilters();
        applyFilter("wasteLevel", "critical");
      },
    },
    {
      label: "Warning Waste",
      icon: TrendingUp,
      value: "warning-waste",
      description: "Show instances with warning waste levels",
      action: () => {
        clearAllFilters();
        applyFilter("wasteLevel", "warning");
      },
    },
    {
      label: "Running Instances",
      icon: Server,
      value: "running-only",
      description: "Show only running instances",
      action: () => {
        clearAllFilters();
        applyFilter("state", "running");
      },
    },
    {
      label: "All High Cost Types",
      icon: DollarSign,
      value: "high-cost-types",
      description: "Show expensive instance types",
      action: () => {
        clearAllFilters();
        applyFilter("instanceType", "r5.xlarge");
        applyFilter("instanceType", "p3.2xlarge");
      },
    },
  ];

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Server className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">EC2 Observer</h1>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">
            Cloud Observability Dashboard
          </Badge>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          {/* Quick Filters */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Filter className="h-4 w-4 mr-2" />
                Quick Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Command>
                <CommandInput placeholder="Search filters..." />
                <CommandList>
                  <CommandEmpty>No filters found.</CommandEmpty>
                  <CommandGroup heading="Quick Filters">
                    {quickFilters.map((filter) => (
                      <CommandItem
                        key={filter.value}
                        onSelect={() => {
                          filter.action();
                          setOpen(false);
                        }}
                        className="flex items-center justify-between p-3 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <filter.icon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{filter.label}</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              {filter.description}
                            </p>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <Separator />
                  <CommandGroup heading="Advanced">
                    <CommandItem
                      onSelect={() => {
                        setSettingsOpen(true);
                        setOpen(false);
                      }}
                      className="flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Filter Settings</span>
                    </CommandItem>
                    {activeFiltersCount > 0 && (
                      <>
                        <CommandItem
                          onSelect={() => {
                            resetToDefaults();
                            setOpen(false);
                          }}
                          className="flex items-center space-x-2"
                        >
                          <Clock className="h-4 w-4" />
                          <span>Reset to Defaults</span>
                        </CommandItem>
                        <CommandItem
                          onSelect={() => {
                            clearAllFilters();
                            setOpen(false);
                          }}
                          className="flex items-center space-x-2 text-destructive"
                        >
                          <Filter className="h-4 w-4" />
                          <span>Clear All Filters</span>
                        </CommandItem>
                      </>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>

      {/* Filter Settings Dialog */}
      <FilterSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}
