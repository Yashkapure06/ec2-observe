"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, BarChart3, Loader2 } from "lucide-react";
import { EC2Instance } from "@/types/ec2";
import { ServerTimeline } from "@/components/charts/ServerTimeline";
import { TimelineSelector } from "@/components/charts/TimelineSelector";

interface InstanceTimelineModalProps {
  instance: EC2Instance;
  trigger?: React.ReactNode;
}

// API function to fetch timeline data
const fetchInstanceTimeline = async (
  instanceId: string,
  period: "1h" | "24h" | "7d"
) => {
  const response = await fetch(
    `/api/ec2/${instanceId}/timeline?period=${period}`
  );
  if (!response.ok) throw new Error("Failed to fetch timeline data");
  return response.json();
};

export function InstanceTimelineModal({
  instance,
  trigger,
}: InstanceTimelineModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"1h" | "24h" | "7d">(
    "24h"
  );

  const {
    data: timelineData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["instance-timeline", instance.id, selectedPeriod],
    queryFn: () => fetchInstanceTimeline(instance.id, selectedPeriod),
    enabled: isOpen, // Only fetch when modal is open
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset to default period when closing
      setSelectedPeriod("24h");
    }
  };

  const getInstanceStatusColor = (state: string) => {
    switch (state) {
      case "running":
        return "bg-green-100 text-green-800 border-green-200";
      case "stopped":
        return "bg-red-100 text-red-800 border-red-200";
      case "terminated":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center space-x-2">
      <BarChart3 className="h-4 w-4" />
      <span>View Timeline</span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Server className="h-5 w-5" />
            <div>
              <div className="text-lg font-semibold">{instance.name}</div>
              <div className="text-sm text-muted-foreground font-normal">
                {instance.id} • {instance.type} • {instance.region}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instance Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {instance.cpuUtilPct}%
              </div>
              <div className="text-xs text-muted-foreground">CPU</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {instance.ramUtilPct}%
              </div>
              <div className="text-xs text-muted-foreground">RAM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {instance.gpuUtilPct}%
              </div>
              <div className="text-xs text-muted-foreground">GPU</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {instance.uptimeHrs}h
              </div>
              <div className="text-xs text-muted-foreground">Uptime</div>
            </div>
          </div>

          {/* Instance Tags and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className={`font-medium ${getInstanceStatusColor(
                  instance.state
                )}`}
              >
                {instance.state.charAt(0).toUpperCase() +
                  instance.state.slice(1)}
              </Badge>
              {Object.entries(instance.tags)
                .slice(0, 3)
                .map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {value}
                  </Badge>
                ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Launched: {new Date(instance.launchTime).toLocaleDateString()}
            </div>
          </div>

          {/* Timeline Selector */}
          <div className="border-t pt-4">
            <TimelineSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
          </div>

          {/* Timeline Chart */}
          <div className="border-t pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Loading timeline data...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Failed to load timeline data
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : timelineData &&
              timelineData.summary &&
              timelineData.dataPoints ? (
              <ServerTimeline data={timelineData} />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    No timeline data available
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-xs text-muted-foreground">
              Timeline data updates every 5 minutes
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  // Here you could add actions like:
                  // - Export timeline data
                  // - Set up alerts
                  // - Optimize instance
                  console.log(
                    "Action button clicked for instance:",
                    instance.id
                  );
                }}
              >
                Take Action
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
