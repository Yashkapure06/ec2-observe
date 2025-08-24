"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaType?: "increase" | "decrease" | "neutral";
  icon?: LucideIcon;
  className?: string;
}

export function KpiCard({
  title,
  value,
  delta,
  deltaType = "neutral",
  icon: Icon,
  className,
}: KpiCardProps) {
  const getDeltaIcon = () => {
    if (deltaType === "increase")
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (deltaType === "decrease")
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getDeltaColor = () => {
    if (deltaType === "increase") return "text-green-600";
    if (deltaType === "decrease") return "text-red-600";
    return "text-gray-600";
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {delta !== undefined && (
          <div className="flex items-center space-x-1 text-xs">
            {getDeltaIcon()}
            <span className={cn("font-medium", getDeltaColor())}>
              {delta > 0 ? "+" : ""}
              {delta}%
            </span>
            <span className="text-muted-foreground">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
