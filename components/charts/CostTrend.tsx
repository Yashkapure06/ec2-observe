"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CostTrendPoint } from "@/types/cost";
import { formatCurrency } from "@/lib/cost";
import { useAnomalyFlag } from "@/hooks/useAnomalyFlag";
import { AlertTriangle, Info, TrendingUp, TrendingDown } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface CostTrendProps {
  data: CostTrendPoint[];
  period: string;
  className?: string;
}

export function CostTrend({ data, period, className }: CostTrendProps) {
  // Ensure data is chronologically sorted (ascending) to render correctly on X axis
  const sortedData = useMemo(() => {
    const copy = [...data];
    copy.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    // Deduplicate same-day points by keeping the last one
    const byDate = new Map<string, (typeof copy)[number]>();
    for (const p of copy) byDate.set(p.date, p);
    return Array.from(byDate.values());
  }, [data]);

  const anomalyFlag = useAnomalyFlag(sortedData, 1.5); // Lower threshold for better detection
  const [selectedAnomaly, setSelectedAnomaly] = useState<CostTrendPoint | null>(
    null
  );

  // Enrich data with anomaly information based on detection results
  const enrichedData = useMemo(() => {
    return sortedData.map((point, index) => ({
      ...point,
      // numeric timestamp for stable X-axis ordering
      ts: new Date(point.date).getTime(),
      isAnomaly: anomalyFlag.anomalyIndices.includes(index),
    }));
  }, [sortedData, anomalyFlag.anomalyIndices]);

  // Calculate anomaly details for detailed view
  const getAnomalyDetails = (anomalyPoint: CostTrendPoint) => {
    const anomalyIndex = sortedData.findIndex(
      (point) => point.date === anomalyPoint.date
    );
    const previousPoint = sortedData[anomalyIndex - 1];
    const nextPoint = sortedData[anomalyIndex + 1];

    let changeFromPrevious = 0;
    let changeFromNext = 0;
    let trend = "spike";

    if (previousPoint) {
      const denom = previousPoint.amount;
      if (denom === 0) {
        // Avoid Infinity% when previous day is zero; treat as 100% spike if current > 0
        changeFromPrevious = anomalyPoint.amount > 0 ? 100 : 0;
      } else {
        changeFromPrevious = ((anomalyPoint.amount - denom) / denom) * 100;
      }
    }

    if (nextPoint) {
      const denom = nextPoint.amount;
      if (denom === 0) {
        changeFromNext = anomalyPoint.amount > 0 ? 100 : 0;
      } else {
        changeFromNext = ((anomalyPoint.amount - denom) / denom) * 100;
      }
    }

    if (changeFromPrevious > 0 && changeFromNext < 0) {
      trend = "spike";
    } else if (changeFromPrevious > 0 && changeFromNext > 0) {
      trend = "trending_up";
    } else if (changeFromPrevious < 0 && changeFromNext < 0) {
      trend = "trending_down";
    }

    return {
      changeFromPrevious: Math.abs(changeFromPrevious),
      changeFromNext: Math.abs(changeFromNext),
      trend,
      date: new Date(anomalyPoint.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: CostTrendPoint }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const isAnomaly = point.isAnomaly;

      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-medium text-sm">
            {label ? new Date(label).toLocaleDateString() : "Unknown Date"}
          </p>
          <p className="text-primary font-semibold text-lg">
            Cost: {formatCurrency(point.amount)}
          </p>
          {isAnomaly && (
            <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <Badge variant="destructive" className="text-xs">
                  Cost Anomaly Detected
                </Badge>
              </div>
              <p className="text-xs text-destructive mt-1">
                Click for detailed analysis
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Separate normal and anomaly data points for different styling
  const normalData = enrichedData.filter((point) => !point.isAnomaly);
  const anomalyData = enrichedData.filter((point) => point.isAnomaly);

  // Debug logging
  // console.log("CostTrend Debug:", {
  //   dataLength: data.length,
  //   enrichedDataLength: enrichedData.length,
  //   anomalyFlag,
  //   anomalyDataLength: anomalyData.length,
  //   anomalyData: anomalyData.map((a) => ({
  //     date: a.date,
  //     amount: a.amount,
  //     isAnomaly: a.isAnomaly,
  //   })),
  //   // Show the first few data points to verify structure
  //   sampleData: sortedData
  //     .slice(0, 3)
  //     .map((d) => ({ date: d.date, amount: d.amount, isAnomaly: d.isAnomaly })),
  // });

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          Cost Trend ({period})
        </CardTitle>
        <div className="flex items-center space-x-2">
          {/* How anomalies are detected - info icon */}
          <Dialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <button
                    aria-label="How anomalies are detected"
                    className="p-1 rounded hover:bg-muted text-muted-foreground"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs text-left">
                <p className="font-medium">How anomalies are detected</p>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  <li>Analyze daily cost values.</li>
                  <li>Compute mean and standard deviation.</li>
                  <li>Flag points with z-score greater than 1.5.</li>
                  <li>
                    Change vs previous day avoids Infinity when previous is 0.
                  </li>
                </ul>
              </TooltipContent>
            </Tooltip>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>How anomalies are detected</DialogTitle>
              </DialogHeader>
              <div className="text-sm space-y-2">
                <p>
                  We apply a statistics-based detector on the daily cost series.
                  Each value is compared to the series mean using the standard
                  deviation (z-score). If the absolute z-score exceeds a
                  configurable threshold (currently 1.5), the point is flagged
                  as an anomaly.
                </p>
                <p>
                  Percent change in the details compares to the adjacent day and
                  safely handles zero baselines to avoid Infinity%.
                </p>
              </div>
            </DialogContent>
          </Dialog>
          {anomalyFlag.isAnomaly && (
            <>
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {anomalyFlag.anomalyIndices.length} Anomalies
              </Badge>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Info className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <span>Cost Anomaly Analysis</span>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {anomalyData.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                        <p className="font-medium">
                          No anomaly details available
                        </p>
                        <p className="text-sm">
                          Anomalies detected but detailed analysis is not
                          available
                        </p>
                        <div className="mt-4 p-3 bg-muted rounded-lg text-left">
                          <p className="text-xs">
                            <strong>Debug Info:</strong>
                          </p>
                          <p className="text-xs">
                            Anomaly Indices:{" "}
                            {JSON.stringify(anomalyFlag.anomalyIndices)}
                          </p>
                          <p className="text-xs">Data Length: {data.length}</p>
                          <p className="text-xs">
                            Z-Score: {anomalyFlag.zScore.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {anomalyData.map((anomaly, index) => {
                          const details = getAnomalyDetails(anomaly);
                          return (
                            <div
                              key={index}
                              className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => setSelectedAnomaly(anomaly)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">
                                  {details.date}
                                </span>
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Anomaly #{index + 1}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    Cost:
                                  </span>
                                  <span className="font-semibold">
                                    {formatCurrency(anomaly.amount)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    Change:
                                  </span>
                                  <span className="text-sm font-medium">
                                    {details.changeFromPrevious > 0 ? "+" : ""}
                                    {details.changeFromPrevious.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-muted-foreground">
                                    Pattern:
                                  </span>
                                  {details.trend === "spike" && (
                                    <TrendingUp className="h-3 w-3 text-orange-500" />
                                  )}
                                  {details.trend === "trending_up" && (
                                    <TrendingUp className="h-3 w-3 text-red-500" />
                                  )}
                                  {details.trend === "trending_down" && (
                                    <TrendingDown className="h-3 w-3 text-blue-500" />
                                  )}
                                  <span className="text-xs capitalize">
                                    {details.trend.replace("_", " ")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedAnomaly && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Detailed Analysis</h4>
                        <div className="text-sm space-y-1">
                          <p>
                            <strong>Date:</strong>{" "}
                            {new Date(
                              selectedAnomaly.date
                            ).toLocaleDateString()}
                          </p>
                          <p>
                            <strong>Cost:</strong>{" "}
                            {formatCurrency(selectedAnomaly.amount)}
                          </p>
                          <p>
                            <strong>Anomaly Type:</strong> Cost spike detected
                          </p>
                          <p>
                            <strong>Recommendation:</strong> Review usage
                            patterns and consider cost optimization strategies
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={enrichedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="ts"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
              className="text-xs"
            />
            <YAxis
              tickFormatter={(value) =>
                formatCurrency(value, "USD").replace("$", "")
              }
              className="text-xs"
            />
            <RechartsTooltip content={<CustomTooltip />} />

            {/* Main cost trend line */}
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false} // Hide default dots, we'll add custom ones
              activeDot={{
                r: 6,
                stroke: "#3b82f6",
                strokeWidth: 2,
                fill: "#3b82f6",
              }}
            />

            {/* Normal data points */}
            <Scatter
              data={normalData}
              fill="#3b82f6"
              shape="circle"
              dataKey="amount"
              xAxisId={0}
              yAxisId={0}
              r={4}
            />

            {/* Anomaly data points - highlighted */}
            <Scatter
              data={anomalyData}
              fill="#ef4444"
              shape="circle"
              dataKey="amount"
              xAxisId={0}
              yAxisId={0}
              r={6}
              stroke="#ef4444"
              strokeWidth={2}
            />

            {/* Reference lines for anomalies */}
            {anomalyData.map((point, index) => {
              const dataIndex = enrichedData.findIndex(
                (p) => p.date === point.date
              );
              return (
                <ReferenceLine
                  key={`anomaly-${index}`}
                  x={dataIndex}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  label={{
                    value: "🚨",
                    position: "top",
                    fontSize: 12,
                  }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>

        {anomalyFlag.isAnomaly && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>
                {anomalyFlag.anomalyIndices.length} cost anomaly detected
                {anomalyFlag.anomalyIndices.length > 1 ? "s" : ""} in the last{" "}
                {period}
              </span>
            </div>
            <p className="text-xs text-destructive/80 mt-1">
              Click on anomaly points or use &quot;View Details&quot; button for
              comprehensive analysis
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
