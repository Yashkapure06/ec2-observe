export interface WasteScoreInput {
  cpu: number;
  ram: number;
  gpu: number;
  uptimeHrs: number;
  costPerHour: number;
}

export interface WasteScoreResult {
  level: "good" | "warning" | "critical";
  score: number;
  reasons: string[];
}

export function wasteScore(input: WasteScoreInput): WasteScoreResult {
  const { cpu, ram, gpu, uptimeHrs, costPerHour } = input;

  // Calculate average utilization across all resources
  const avgUtilization = (cpu + ram + gpu) / 3;

  // Base score calculation (0-100, lower is better)
  let score = 0;
  const reasons: string[] = [];

  // Utilization scoring (40% weight)
  if (avgUtilization < 20) {
    score += 40;
    reasons.push("Very low resource utilization (<20%)");
  } else if (avgUtilization < 50) {
    score += 20;
    reasons.push("Low resource utilization (20-50%)");
  }

  // Uptime scoring (30% weight)
  if (uptimeHrs > 720) {
    // 30 days
    score += 30;
    reasons.push("Long-running instance (>30 days)");
  } else if (uptimeHrs > 168) {
    // 7 days
    score += 15;
    reasons.push("Medium uptime (7-30 days)");
  }

  // Cost scoring (30% weight)
  const dailyCost = costPerHour * 24;
  if (dailyCost > 100) {
    score += 30;
    reasons.push("High daily cost (>$100/day)");
  } else if (dailyCost > 50) {
    score += 15;
    reasons.push("Medium daily cost ($50-100/day)");
  }

  // Determine level based on score
  let level: "good" | "warning" | "critical";
  if (score >= 70) {
    level = "critical";
  } else if (score >= 40) {
    level = "warning";
  } else {
    level = "good";
  }

  return {
    level,
    score: Math.min(100, Math.max(0, score)),
    reasons,
  };
}

export function getWasteScoreColor(
  level: "good" | "warning" | "critical"
): string {
  switch (level) {
    case "good":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "warning":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}
