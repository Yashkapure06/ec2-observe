"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EC2Instance } from "@/types/ec2";
import { formatCurrency } from "@/lib/cost";

interface RightSizeDialogProps {
  instance: EC2Instance;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function estimateTypeCandidates(currentType: string): string[] {
  const family = currentType.split(".")[0] || "t3";
  const size = (currentType.split(".")[1] || "medium").toLowerCase();
  const order = [
    "nano",
    "micro",
    "small",
    "medium",
    "large",
    "xlarge",
    "2xlarge",
    "4xlarge",
  ];
  const idx = Math.max(0, order.indexOf(size));
  const down1 = order[Math.max(0, idx - 1)];
  const down2 = order[Math.max(0, idx - 2)];
  const altFamily = family.startsWith("r")
    ? "m5"
    : family.startsWith("m")
    ? "t3"
    : "t3";
  return [`${family}.${down1}`, `${family}.${down2}`, `${altFamily}.${down1}`];
}

function hourlyPriceGuess(instanceType: string): number {
  const base: Record<string, number> = {
    "t3.micro": 0.0104,
    "t3.small": 0.0208,
    "t3.medium": 0.0416,
    "t3.large": 0.0832,
    "m5.large": 0.096,
    "m5.xlarge": 0.192,
    "r5.large": 0.126,
    "r5.xlarge": 0.252,
  };
  return base[instanceType] ?? 0.05;
}

export function RightSizeDialog({
  instance,
  open,
  onOpenChange,
}: RightSizeDialogProps) {
  const suggestions = useMemo(() => {
    // Unique, filtered candidates not equal to current type
    const raw = estimateTypeCandidates(instance.type).filter(Boolean);
    const unique = Array.from(new Set(raw)).filter((t) => t !== instance.type);
    return unique.map((t) => {
      const hourly = hourlyPriceGuess(t);
      const monthlySavings = Math.max(
        0,
        (instance.costPerHour - hourly) * 24 * 30
      );
      return { type: t, hourly, monthlySavings };
    });
  }, [instance]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Propose right-size</DialogTitle>
          <DialogDescription>
            Based on recent utilization, consider downsizing this instance to
            reduce cost.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm">
            Current:{" "}
            <Badge variant="outline" className="font-mono">
              {instance.type}
            </Badge>{" "}
            <span className="ml-2 text-muted-foreground">
              {formatCurrency(instance.costPerHour)}/hr
            </span>
          </div>
          {suggestions.map((s, idx) => (
            <div
              key={`${s.type}-${idx}`}
              className="p-3 border rounded-md flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {s.type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(s.hourly)}/hr
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm">Est. monthly savings</div>
                <div className="font-semibold">
                  {formatCurrency(s.monthlySavings)}
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => onOpenChange(false)}>Apply later</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
