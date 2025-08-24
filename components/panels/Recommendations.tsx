"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Gauge, Clock } from "lucide-react";
import { EC2Instance } from "@/types/ec2";
import { wasteScore } from "@/lib/waste";
import { formatCurrency } from "@/lib/cost";

interface RecommendationsProps {
  instances: EC2Instance[];
}

export function Recommendations({ instances }: RecommendationsProps) {
  const items = instances
    .slice(0, 50)
    .map((i) => ({
      i,
      waste: wasteScore({
        cpu: i.cpuUtilPct,
        ram: i.ramUtilPct,
        gpu: i.gpuUtilPct,
        uptimeHrs: i.uptimeHrs,
        costPerHour: i.costPerHour,
      }),
    }))
    .sort((a, b) => b.waste.score - a.waste.score)
    .slice(0, 6);

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recommendations</span>
          <Badge variant="destructive">Beta</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map(({ i, waste }) => {
          const action =
            waste.level === "critical"
              ? "Stop or downsize"
              : waste.level === "warning"
              ? "Consider right-sizing"
              : "Monitor";
          const estDaily = i.costPerHour * 24;
          return (
            <div key={i.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {waste.level === "critical" ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : waste.level === "warning" ? (
                    <Gauge className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  <span className="font-medium">{i.name}</span>
                  <Badge variant="outline" className="font-mono">
                    {i.type}
                  </Badge>
                </div>
                <Badge className="font-medium">
                  {waste.level.toUpperCase()}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground flex items-center gap-4">
                <span>Action: {action}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Uptime {Math.floor(i.uptimeHrs / 24)}d
                </span>
                <span>Est. daily cost: {formatCurrency(estDaily)}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
