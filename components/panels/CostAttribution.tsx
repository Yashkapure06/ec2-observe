"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CostBreakdown } from "@/types/cost";
import { formatCurrency } from "@/lib/cost";
import {
  BarChart3,
  PieChart as PieChartIcon,
  Table as TableIcon,
  TrendingUp,
  MapPin,
  Server,
  Building2,
  Briefcase,
} from "lucide-react";

interface CostAttributionProps {
  breakdowns: CostBreakdown[];
  dimension: string;
  className?: string;
  dataSource?: "aws" | "instance-based" | "mock";
  isLoading?: boolean;
  onDimensionChange?: (
    dimension: "region" | "instanceType" | "service" | "account" | "job"
  ) => void;
}

const COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
];

const DIMENSION_ICONS = {
  region: MapPin,
  instanceType: Server,
  service: Building2,
  account: Building2,
  job: Briefcase,
};

const DIMENSION_DESCRIPTIONS = {
  region: "Cost breakdown by AWS regions",
  instanceType: "Cost breakdown by EC2 instance types",
  service: "Cost breakdown by AWS services",
  account: "Cost breakdown by AWS accounts",
  job: "Cost breakdown by job/workload tags",
};

export function CostAttribution({
  breakdowns,
  dimension,
  className,
  dataSource = "mock",
  isLoading = false,
  onDimensionChange,
}: CostAttributionProps) {
  const [viewMode, setViewMode] = useState<"table" | "bar" | "pie">("bar");

  // Handle dimension change
  const handleDimensionChange = (newDimension: string) => {
    if (
      onDimensionChange &&
      (newDimension === "region" ||
        newDimension === "instanceType" ||
        newDimension === "service" ||
        newDimension === "account" ||
        newDimension === "job")
    ) {
      onDimensionChange(
        newDimension as
          | "region"
          | "instanceType"
          | "service"
          | "account"
          | "job"
      );
    }
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: CostBreakdown }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-primary font-mono">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-muted-foreground text-sm">
            {payload[0].payload.percentage}% of total cost
          </p>
        </div>
      );
    }
    return null;
  };

  const IconComponent =
    DIMENSION_ICONS[dimension as keyof typeof DIMENSION_ICONS] || TrendingUp;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <IconComponent className="h-5 w-5 text-muted-foreground" />
              <span>Cost Attribution</span>
            </div>
            <div className="flex items-center space-x-1">
              {dataSource === "aws" && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Live AWS Data
                </span>
              )}
              {dataSource === "instance-based" && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Instance-Based
                </span>
              )}
              {dataSource === "mock" && (
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                  Demo Data
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Select
              value={dimension}
              onValueChange={handleDimensionChange}
              disabled={isLoading}
            >
              <SelectTrigger
                className={`w-40 ${isLoading ? "opacity-50" : ""}`}
              >
                <SelectValue />
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-2" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="region">By Region</SelectItem>
                <SelectItem value="instanceType">By Instance Type</SelectItem>
                <SelectItem value="service">By Service</SelectItem>
                <SelectItem value="account">By Account</SelectItem>
                <SelectItem value="job">By Job</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {
            DIMENSION_DESCRIPTIONS[
              dimension as keyof typeof DIMENSION_DESCRIPTIONS
            ]
          }
        </p>
      </CardHeader>
      <CardContent>
        <Tabs
          value={viewMode}
          onValueChange={(value) =>
            setViewMode(value as "table" | "bar" | "pie")
          }
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bar" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Chart</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center space-x-2">
              <TableIcon className="h-4 w-4" />
              <span>Table</span>
            </TabsTrigger>
            <TabsTrigger value="pie" className="flex items-center space-x-2">
              <PieChartIcon className="h-4 w-4" />
              <span>Pie</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bar" className="mt-6">
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading cost data...
                  </p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={breakdowns}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="value"
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      formatCurrency(value, "USD").replace("$", "")
                    }
                    className="text-xs"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="amount"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="Cost"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="table" className="mt-6">
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading cost data...
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {dimension === "region" && "Region"}
                        {dimension === "instanceType" && "Instance Type"}
                        {dimension === "service" && "Service"}
                        {dimension === "account" && "Account ID"}
                        {dimension === "job" && "Job/Workload"}
                      </TableHead>
                      <TableHead className="text-right">Monthly Cost</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breakdowns.map((breakdown, index) => (
                      <TableRow key={`${breakdown.value}-${index}`}>
                        <TableCell className="font-medium">
                          {breakdown.value}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(breakdown.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {breakdown.percentage}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pie" className="mt-6">
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading cost data...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={breakdowns}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }) => `${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {breakdowns.map((breakdown, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {breakdowns.map((breakdown, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-sm">{breakdown.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
