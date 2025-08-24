"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";

interface CostAttributionProps {
  breakdowns: CostBreakdown[];
  dimension: string;
  className?: string;
  dataSource?: "aws" | "instance-based" | "mock";
  onDimensionChange?: (
    dimension: "region" | "instanceType" | "service" | "account" | "job"
  ) => void;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export function CostAttribution({
  breakdowns,
  dimension,
  className,
  dataSource = "mock",
  onDimensionChange,
}: CostAttributionProps) {
  const [viewMode, setViewMode] = useState<"table" | "bar" | "pie">("table");
  const [selectedDimension, setSelectedDimension] = useState(dimension);

  // Handle dimension change
  const handleDimensionChange = (newDimension: string) => {
    setSelectedDimension(newDimension);
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
          <p className="text-primary">{formatCurrency(payload[0].value)}</p>
          <p className="text-muted-foreground">
            {payload[0].payload.percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  // Drilldown state: when viewing Region, allow expanding to Account IDs for that region
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [regionAccounts, setRegionAccounts] = useState<
    Record<string, CostBreakdown[]>
  >({});

  const loadRegionAccounts = async (region: string) => {
    if (regionAccounts[region]) return;
    const res = await fetch(
      `/api/costs?dimension=account&region=${encodeURIComponent(region)}`
    );
    if (res.ok) {
      const data = await res.json();
      setRegionAccounts((prev) => ({
        ...prev,
        [region]: data.breakdowns || [],
      }));
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>Cost Attribution</span>
            <div className="flex items-center space-x-1">
              {dataSource === "aws" && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  AWS Data
                </span>
              )}
              {dataSource === "instance-based" && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Instance-Based
                </span>
              )}
              {dataSource === "mock" && (
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                  Mock Data
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Select
              value={selectedDimension}
              onValueChange={handleDimensionChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="region">Region</SelectItem>
                <SelectItem value="instanceType">Instance Type</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="job">Job</SelectItem>
              </SelectContent>
            </Select>
            {selectedDimension === "instanceType" && (
              <div className="text-xs text-muted-foreground">
                Tip: Click an Account row (from Account dimension) to filter
                instance types by account via the dropdown.
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={viewMode}
          onValueChange={(value) =>
            setViewMode(value as "table" | "bar" | "pie")
          }
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="table" className="flex items-center space-x-2">
              <TableIcon className="h-4 w-4" />
              <span>Table</span>
            </TabsTrigger>
            <TabsTrigger value="bar" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Bar Chart</span>
            </TabsTrigger>
            <TabsTrigger value="pie" className="flex items-center space-x-2">
              <PieChartIcon className="h-4 w-4" />
              <span>Pie Chart</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {selectedDimension.charAt(0).toUpperCase() +
                        selectedDimension.slice(1)}
                    </TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdowns.map((breakdown, index) => (
                    <TableRow
                      key={`${breakdown.value}-${index}`}
                      className={
                        selectedDimension === "region" ||
                        selectedDimension === "account"
                          ? "cursor-pointer"
                          : ""
                      }
                      onClick={async () => {
                        if (selectedDimension === "region") {
                          const region = breakdown.value;
                          setExpandedRegion((prev) =>
                            prev === region ? null : region
                          );
                          await loadRegionAccounts(region);
                        }
                        if (selectedDimension === "account") {
                          if (onDimensionChange)
                            onDimensionChange("instanceType");
                        }
                      }}
                    >
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
                  {selectedDimension === "region" && expandedRegion && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={3}>
                        <div className="text-sm mb-2 font-medium">
                          Accounts in {expandedRegion}
                        </div>
                        <div className="rounded border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Account ID</TableHead>
                                <TableHead className="text-right">
                                  Amount
                                </TableHead>
                                <TableHead className="text-right">
                                  Percentage
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(regionAccounts[expandedRegion] || []).map(
                                (a, idx) => (
                                  <TableRow key={`${a.value}-${idx}`}>
                                    <TableCell className="font-mono">
                                      {a.value}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                      {formatCurrency(a.amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {a.percentage}%
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="bar" className="mt-6">
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
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="pie" className="mt-6">
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
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">{breakdown.value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
