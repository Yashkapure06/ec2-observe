"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Calendar } from "lucide-react";

interface TimelineSelectorProps {
  selectedPeriod: "1h" | "24h" | "7d";
  onPeriodChange: (period: "1h" | "24h" | "7d") => void;
  className?: string;
}

export function TimelineSelector({
  selectedPeriod,
  onPeriodChange,
  className,
}: TimelineSelectorProps) {
  const periods = [
    {
      value: "1h" as const,
      label: "1 Hour",
      description: "5-min intervals",
      icon: Clock,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    {
      value: "24h" as const,
      label: "24 Hours",
      description: "Hourly intervals",
      icon: TrendingUp,
      color:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    },
    {
      value: "7d" as const,
      label: "7 Days",
      description: "Daily intervals",
      icon: Calendar,
      color:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    },
  ];

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Time Period</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {periods.map((period) => {
          const Icon = period.icon;
          const isSelected = selectedPeriod === period.value;

          return (
            <Button
              key={period.value}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange(period.value)}
              className={`h-auto p-3 flex flex-col items-center space-y-2 ${
                isSelected ? "ring-2 ring-primary ring-offset-2" : ""
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  isSelected
                    ? "text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              />
              <div className="text-center">
                <div
                  className={`text-xs font-medium ${
                    isSelected ? "text-primary-foreground" : ""
                  }`}
                >
                  {period.label}
                </div>
                <div
                  className={`text-xs ${
                    isSelected
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {period.description}
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Data granularity adjusts based on selected period</span>
        <Badge variant="outline" className="text-xs">
          {selectedPeriod === "1h" && "High Detail"}
          {selectedPeriod === "24h" && "Medium Detail"}
          {selectedPeriod === "7d" && "Overview"}
        </Badge>
      </div>
    </div>
  );
}
