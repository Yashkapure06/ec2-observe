"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KpiCard } from "@/components/kpis/KpiCard";
import { CostTrend } from "@/components/charts/CostTrend";
import { CostAttribution } from "@/components/panels/CostAttribution";
import { EC2Table } from "@/components/tables/EC2Table";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DollarSign, TrendingUp, Server } from "lucide-react";
import { formatCurrency } from "@/lib/cost";
import { TopNav } from "@/components/layout/TopNav";
import { FilterPanel } from "@/components/filters";
import { useAppliedFilters } from "@/store/filters";
import { Recommendations } from "@/components/panels/Recommendations";

// API functions
const fetchEC2Instances = async () => {
  const response = await fetch("/api/ec2");
  if (!response.ok) throw new Error("Failed to fetch EC2 instances");
  return response.json();
};

const fetchMetrics = async () => {
  const response = await fetch("/api/metrics?period=7d");
  if (!response.ok) throw new Error("Failed to fetch metrics");
  return response.json();
};

export default function DashboardPage() {
  const [costDimension, setCostDimension] = useState<
    "region" | "instanceType" | "service" | "account" | "job"
  >("region");

  const { data: ec2Data, isLoading: ec2Loading } = useQuery({
    queryKey: ["ec2", "instances"],
    queryFn: fetchEC2Instances,
  });

  const appliedFilters = useAppliedFilters();
  const filterParams = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const f of appliedFilters) {
      map[f.categoryId] = f.values;
    }
    const regions = (map["region"] || []).join(",");
    const instanceTypes = (map["instanceType"] || []).join(",");
    const qsParts = [
      `dimension=${costDimension}`,
      regions ? `region=${encodeURIComponent(regions)}` : "",
      instanceTypes ? `instanceType=${encodeURIComponent(instanceTypes)}` : "",
    ].filter(Boolean);
    return qsParts.join("&");
  }, [appliedFilters, costDimension]);

  const { data: costData, isLoading: costLoading } = useQuery({
    queryKey: ["costs", "breakdown", costDimension, filterParams],
    queryFn: () =>
      fetch(`/api/costs?${filterParams}`).then((res) => res.json()),
  });

  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ["metrics", "trend", "7d"],
    queryFn: fetchMetrics,
  });

  // Only show full page loading for initial load, not for dimension changes
  if (ec2Loading || metricsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-muted animate-pulse rounded-lg" />
              <div className="h-80 bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="h-96 bg-muted animate-pulse rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  const kpis = costData?.kpis || {};
  const instances = ec2Data?.instances || [];
  const costBreakdowns = costData?.breakdowns || [];
  const costTrend = metricsData?.trend || [];

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <KpiCard
                    title="Total Monthly Cost"
                    value={formatCurrency(kpis.totalMonthly || 0)}
                    delta={kpis.changePercentage}
                    deltaType={
                      kpis.changePercentage > 0 ? "increase" : "decrease"
                    }
                    icon={DollarSign}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total AWS costs for the current month</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <KpiCard
                    title="Daily Burn Rate"
                    value={formatCurrency(kpis.dailyBurn || 0)}
                    icon={TrendingUp}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Average daily cost based on current usage</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <KpiCard
                    title="Projected Monthly"
                    value={formatCurrency(kpis.projectedMonth || 0)}
                    icon={TrendingUp}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Projected monthly cost based on current daily burn rate</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <KpiCard
                    title="Active Instances"
                    value={instances.length}
                    icon={Server}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Number of currently running EC2 instances</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CostTrend data={costTrend} period="7d" />
            <CostAttribution
              breakdowns={costBreakdowns}
              dimension={costDimension}
              dataSource={costData?.dataSource || "mock"}
              isLoading={costLoading}
              onDimensionChange={setCostDimension}
            />
          </div>

          {/* Filter Panel and EC2 Table Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <FilterPanel />
            </div>
            <div className="lg:col-span-3">
              <EC2Table instances={instances} />
            </div>
          </div>

          {/* Recommendations */}
          <Recommendations instances={instances} />

          {/* Submission Notes */}
          {/* <div className="mt-8 p-4 border rounded-lg bg-muted/50 text-sm space-y-2">
            <div className="font-medium">Submission notes</div>

            <div>
              <strong>UX tradeoff</strong>: Optimized for information density
              (table + inline drilldowns) over minimalism so power users can
              scan many instances at once.
            </div>
            <div>
              <strong>Assumption about users</strong>: Bioinformaticians are
              technically fluent but time‑constrained; they prefer fast, precise
              controls (filters, timelines, anomaly details) over wizard‑style
              flows.
            </div>
            <div>
              <strong>Feature not built</strong>: Real‑time WebSocket updates.
              Chosen to keep MVP simple and reliable; polling + React Query
              caching is sufficient. The API/UI are structured to add WebSockets
              later.
            </div>
          </div> */}
        </div>
      </main>
    </div>
  );
}
