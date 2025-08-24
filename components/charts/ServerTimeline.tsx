"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstanceTimelineData, UtilizationDataPoint } from "@/types/ec2";
import {
  Clock,
  Cpu,
  HardDrive,
  Monitor,
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react";

interface ServerTimelineProps {
  data: InstanceTimelineData;
  className?: string;
}

export function ServerTimeline({ data, className }: ServerTimelineProps) {
  // All hooks must be called at the top level, before any conditional logic
  const [selectedMetric, setSelectedMetric] = useState<"cpu" | "ram" | "gpu">(
    "cpu"
  );
  const [showIdleAreas, setShowIdleAreas] = useState(true);
  const [showSpikes, setShowSpikes] = useState(true);

  // Move useMemo to the top, before any early returns
  const chartData = useMemo(() => {
    // Safety check - ensure data is properly loaded
    if (!data || !data.summary || !data.dataPoints) {
      return [];
    }

    // Validate data points have the required properties
    const validDataPoints = data.dataPoints.filter(
      (point) =>
        point.cpu !== null &&
        point.cpu !== undefined &&
        point.ram !== null &&
        point.ram !== undefined &&
        point.gpu !== null &&
        point.gpu !== undefined &&
        !isNaN(point.cpu) &&
        !isNaN(point.ram) &&
        !isNaN(point.gpu)
    );

    if (validDataPoints.length === 0) {
      return [];
    }

    // Format timestamp for display
    const formatTimestamp = (timestamp: string, period: string) => {
      const date = new Date(timestamp);
      switch (period) {
        case "1h":
          return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        case "24h":
          return date.toLocaleTimeString([], { hour: "2-digit" });
        case "7d":
          return date.toLocaleDateString([], {
            month: "short",
            day: "numeric",
          });
        default:
          return date.toLocaleString();
      }
    };

    console.log("Raw data points:", data.dataPoints);
    const processed = validDataPoints.map((point) => ({
      ...point,
      formattedTime: formatTimestamp(point.timestamp, data.period),
      isIdle: point.cpu < 1, // Lower threshold for very low utilization
      isSpike: point.cpu > 50, // Lower threshold for spikes in low-utilization scenarios
    }));
    console.log("Processed chart data:", processed);
    return processed;
  }, [data]);

  // Now we can have conditional returns after all hooks are called
  if (!data || !data.summary || !data.dataPoints) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              No timeline data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Invalid data format</p>
            <pre className="text-xs mt-2 text-left">
              {JSON.stringify(data.dataPoints.slice(0, 2), null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Custom tooltip component
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload: UtilizationDataPoint & {
        formattedTime: string;
        isIdle: boolean;
        isSpike: boolean;
      };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg min-w-[200px]">
          <p className="font-medium text-sm">{data.formattedTime}</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CPU:</span>
              <span className="font-medium">{data.cpu}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">RAM:</span>
              <span className="font-medium">{data.ram}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GPU:</span>
              <span className="font-medium">{data.gpu}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network In:</span>
              <span className="font-medium">{data.networkIn} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network Out:</span>
              <span className="font-medium">{data.networkOut} MB</span>
            </div>
          </div>
          {data.isIdle && (
            <Badge variant="secondary" className="mt-2">
              <Clock className="h-3 w-3 mr-1" />
              Idle
            </Badge>
          )}
          {data.isSpike && (
            <Badge variant="destructive" className="mt-2">
              <Zap className="h-3 w-3 mr-1" />
              Spike
            </Badge>
          )}
        </div>
      );
    }
    return null;
  };

  // Get metric color and icon
  const getMetricConfig = (metric: "cpu" | "ram" | "gpu") => {
    switch (metric) {
      case "cpu":
        return {
          color: "#3b82f6", // Blue
          icon: Cpu,
          label: "CPU Utilization",
        };
      case "ram":
        return {
          color: "#10b981", // Green
          icon: HardDrive,
          label: "RAM Utilization",
        };
      case "gpu":
        return {
          color: "#f59e0b", // Amber
          icon: Monitor,
          label: "GPU Utilization",
        };
    }
  };

  const metricConfig = getMetricConfig(selectedMetric);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              {data.instanceName} - Utilization Timeline
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {data.period} view • {data.dataPoints.length} data points
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              {data.summary?.spikyBehavior ? "Spiky" : "Stable"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {(data.summary?.idleTime ?? 0).toFixed(1)}% idle
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Metric Selection Tabs */}
        <Tabs
          value={selectedMetric}
          onValueChange={(value) =>
            setSelectedMetric(value as "cpu" | "ram" | "gpu")
          }
        >
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="cpu" className="flex items-center space-x-2">
              <Cpu className="h-4 w-4" />
              <span>CPU</span>
            </TabsTrigger>
            <TabsTrigger value="ram" className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4" />
              <span>RAM</span>
            </TabsTrigger>
            <TabsTrigger value="gpu" className="flex items-center space-x-2">
              <Monitor className="h-4 w-4" />
              <span>GPU</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Chart */}
        <div className="mb-6">
          <div className="mb-2 text-xs text-muted-foreground">
            Debug: {chartData.length} data points, selected metric:{" "}
            {selectedMetric}
          </div>

          {/* Simple test chart to verify data */}
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Raw Data Test</h4>
            <div className="text-xs space-y-1">
              {chartData.slice(0, 5).map((point, index) => (
                <div key={index}>
                  {point.formattedTime}: CPU={point.cpu}%, RAM={point.ram}%,
                  GPU={point.gpu}%
                </div>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="formattedTime"
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                className="text-xs"
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Main metric line */}
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={metricConfig.color}
                strokeWidth={3}
                dot={{ fill: metricConfig.color, strokeWidth: 2, r: 4 }}
                activeDot={{
                  r: 6,
                  stroke: metricConfig.color,
                  strokeWidth: 2,
                }}
                connectNulls={false}
              />

              {/* Fallback: Always show CPU line for debugging */}
              <Line
                type="monotone"
                dataKey="cpu"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />

              {/* Idle areas highlighting */}
              {showIdleAreas &&
                chartData.map((point, index) =>
                  point.isIdle ? (
                    <ReferenceArea
                      key={`idle-${index}`}
                      x={index}
                      fill="rgba(34, 197, 94, 0.1)"
                      stroke="rgba(34, 197, 94, 0.3)"
                      strokeDasharray="3 3"
                    />
                  ) : null
                )}

              {/* Spike indicators */}
              {showSpikes &&
                chartData.map((point, index) =>
                  point.isSpike ? (
                    <ReferenceLine
                      key={`spike-${index}`}
                      x={index}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      strokeWidth={2}
                    />
                  ) : null
                )}

              {/* Threshold lines */}
              <ReferenceLine
                y={50}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{ value: "High (50%)", position: "insideRight" }}
              />
              <ReferenceLine
                y={1}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{ value: "Idle (1%)", position: "insideRight" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {data.summary?.avgCpu ?? 0}%
            </div>
            <div className="text-xs text-muted-foreground">Avg CPU</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-success">
              {data.summary?.avgRam ?? 0}%
            </div>
            <div className="text-xs text-muted-foreground">Avg RAM</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-warning">
              {data.summary?.avgGpu ?? 0}%
            </div>
            <div className="text-xs text-muted-foreground">Avg GPU</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-muted-foreground">
              {(data.summary?.idleTime ?? 0).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Idle Time</div>
          </div>
        </div>

        {/* Peak Values */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-lg font-semibold text-primary">
              {data.summary?.peakCpu ?? 0}%
            </div>
            <div className="text-xs text-muted-foreground">Peak CPU</div>
          </div>
          <div className="text-center p-3 bg-success/10 rounded-lg border border-success/20">
            <div className="text-lg font-semibold text-success">
              {data.summary?.peakRam ?? 0}%
            </div>
            <div className="text-xs text-muted-foreground">Peak RAM</div>
          </div>
          <div className="text-center p-3 bg-warning/10 rounded-lg border border-warning/20">
            <div className="text-lg font-semibold text-warning">
              {data.summary?.peakGpu ?? 0}%
            </div>
            <div className="text-xs text-muted-foreground">Peak GPU</div>
          </div>
        </div>

        {/* Behavior Analysis */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Behavior Analysis</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Idle Patterns</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {(data.summary?.idleTime ?? 0) > 80
                  ? "Very high idle time suggests this instance may be underutilized or could be stopped."
                  : (data.summary?.idleTime ?? 0) > 50
                  ? "High idle time suggests potential for resource optimization or scheduling adjustments."
                  : (data.summary?.idleTime ?? 0) > 20
                  ? "Moderate idle time indicates some optimization opportunities."
                  : "Low idle time shows efficient resource utilization."}
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Usage Patterns</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {data.summary?.spikyBehavior
                  ? "Irregular usage patterns detected. Consider workload distribution or resource scaling."
                  : "Stable usage patterns indicate predictable resource requirements."}
              </p>
            </div>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showIdleAreas}
                onChange={(e) => setShowIdleAreas(e.target.checked)}
                className="rounded"
              />
              <span>Show Idle Areas</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showSpikes}
                onChange={(e) => setShowSpikes(e.target.checked)}
                className="rounded"
              />
              <span>Show Spikes</span>
            </label>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
