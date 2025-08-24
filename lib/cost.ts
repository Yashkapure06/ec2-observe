import { CostKPI, CostBreakdown, CostTrendPoint } from "@/types/cost";
import { EC2Instance } from "@/types/ec2";

export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function calculateProjectedMonthly(dailyBurn: number): number {
  return dailyBurn * 30;
}

export function calculateChangePercentage(
  current: number,
  previous: number
): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function generateMockCostTrend(days: number = 7): CostTrendPoint[] {
  const trend: CostTrendPoint[] = [];
  const baseAmount = 1500; // Base daily cost
  const volatility = 0.3; // 30% volatility

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    let amount: number;
    let isAnomaly = false;

    // Create guaranteed anomalies on specific days for testing
    if (i === 3) {
      // 4th day from now
      amount = baseAmount * 3.5; // Major cost spike
      isAnomaly = true;
    } else if (i === 1) {
      // 2nd day from now
      amount = baseAmount * 0.3; // Major cost drop
      isAnomaly = true;
    } else {
      // Add some randomness to simulate real cost fluctuations
      const randomFactor = 1 + (Math.random() - 0.5) * volatility;
      amount = baseAmount * randomFactor;

      // Flag additional anomalies (costs > 2.5x base or < 0.4x base)
      isAnomaly = amount > baseAmount * 2.5 || amount < baseAmount * 0.4;
    }

    trend.push({
      date: date.toISOString().split("T")[0],
      amount: Math.round(amount),
      isAnomaly,
    });
  }

  return trend;
}

export function generateMockCostBreakdown(
  dimension:
    | "region"
    | "instanceType"
    | "service"
    | "account"
    | "job" = "region"
): CostBreakdown[] {
  if (dimension === "region") {
    return [
      {
        dimension: "region",
        value: "us-east-1",
        amount: 45000,
        percentage: 45,
      },
      {
        dimension: "region",
        value: "us-west-2",
        amount: 30000,
        percentage: 30,
      },
      {
        dimension: "region",
        value: "eu-west-1",
        amount: 15000,
        percentage: 15,
      },
      {
        dimension: "region",
        value: "ap-southeast-1",
        amount: 10000,
        percentage: 10,
      },
    ];
  }

  if (dimension === "instanceType") {
    return [
      {
        dimension: "instanceType",
        value: "t3.medium",
        amount: 25000,
        percentage: 35,
      },
      {
        dimension: "instanceType",
        value: "m5.large",
        amount: 20000,
        percentage: 28,
      },
      {
        dimension: "instanceType",
        value: "r5.xlarge",
        amount: 15000,
        percentage: 21,
      },
      {
        dimension: "instanceType",
        value: "c5.2xlarge",
        amount: 10000,
        percentage: 14,
      },
      {
        dimension: "instanceType",
        value: "p3.2xlarge",
        amount: 5000,
        percentage: 2,
      },
    ];
  }

  if (dimension === "service") {
    return [
      { dimension: "service", value: "EC2", amount: 60000, percentage: 60 },
      { dimension: "service", value: "EBS", amount: 20000, percentage: 20 },
      {
        dimension: "service",
        value: "Data Transfer",
        amount: 15000,
        percentage: 15,
      },
      {
        dimension: "service",
        value: "Monitoring",
        amount: 5000,
        percentage: 5,
      },
    ];
  }

  if (dimension === "account") {
    return [
      {
        dimension: "account",
        value: "1111-2222-3333",
        amount: 42000,
        percentage: 42,
      },
      {
        dimension: "account",
        value: "4444-5555-6666",
        amount: 31000,
        percentage: 31,
      },
      {
        dimension: "account",
        value: "7777-8888-9999",
        amount: 19000,
        percentage: 19,
      },
      {
        dimension: "account",
        value: "0000-1111-2222",
        amount: 8000,
        percentage: 8,
      },
    ];
  }

  if (dimension === "job") {
    return [
      { dimension: "job", value: "alignment", amount: 28000, percentage: 28 },
      {
        dimension: "job",
        value: "variant-calling",
        amount: 24000,
        percentage: 24,
      },
      { dimension: "job", value: "assembly", amount: 20000, percentage: 20 },
      { dimension: "job", value: "qc", amount: 15000, percentage: 15 },
      { dimension: "job", value: "other", amount: 13000, percentage: 13 },
    ];
  }

  return [];
}

// Generate realistic cost breakdown based on actual EC2 instances
export function generateInstanceBasedCostBreakdown(
  instances: EC2Instance[],
  dimension:
    | "region"
    | "instanceType"
    | "service"
    | "account"
    | "job" = "region"
): CostBreakdown[] {
  if (!instances || instances.length === 0) {
    return generateMockCostBreakdown(dimension);
  }

  const breakdownMap = new Map<string, number>();

  // Calculate costs based on instance types and regions
  instances.forEach((instance) => {
    let key: string;
    let cost: number;

    if (dimension === "region") {
      key = instance.region || "us-east-1";
      // Base cost varies by region
      const regionMultiplier = getRegionCostMultiplier(key);
      cost = calculateInstanceCost(instance.type) * regionMultiplier;
    } else if (dimension === "instanceType") {
      key = instance.type || "t3.medium";
      cost = calculateInstanceCost(key);
    } else if (dimension === "service") {
      key = "EC2"; // All instances are EC2
      cost = calculateInstanceCost(instance.type);
    } else if (dimension === "account") {
      // Prefer explicit instance.accountId, then tag, else unknown
      const explicitAccount = (instance as { accountId?: string }).accountId;
      const taggedAccount = instance.tags?.["accountId"];
      key = explicitAccount || taggedAccount || "unknown-account";
      cost = calculateInstanceCost(instance.type);
    } else if (dimension === "job") {
      key =
        instance.tags?.["JobId"] ||
        instance.tags?.["Project"] ||
        instance.tags?.["Workflow"] ||
        "Unassigned";
      cost = calculateInstanceCost(instance.type);
    } else {
      return;
    }

    breakdownMap.set(key, (breakdownMap.get(key) || 0) + cost);
  });

  // Convert to array and calculate percentages
  const breakdowns: CostBreakdown[] = Array.from(breakdownMap.entries()).map(
    ([value, amount]) => ({
      dimension,
      value,
      amount: Math.round(amount),
      percentage: 0,
    })
  );

  // Calculate total and percentages
  const totalAmount = breakdowns.reduce((sum, item) => sum + item.amount, 0);
  breakdowns.forEach((item) => {
    item.percentage =
      totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0;
  });

  // Sort by amount (highest first)
  breakdowns.sort((a, b) => b.amount - a.amount);

  return breakdowns;
}

// Calculate instance cost based on type (simplified pricing)
function calculateInstanceCost(instanceType: string): number {
  const baseCosts: { [key: string]: number } = {
    "t3.micro": 8.5,
    "t3.small": 17,
    "t3.medium": 34,
    "t3.large": 68,
    "m5.large": 96,
    "m5.xlarge": 192,
    "m5.2xlarge": 384,
    "r5.large": 126,
    "r5.xlarge": 252,
    "r5.2xlarge": 504,
    "c5.large": 85,
    "c5.xlarge": 170,
    "c5.2xlarge": 340,
    "p3.2xlarge": 3060,
    "g4dn.xlarge": 526,
  };

  // Default to t3.medium if unknown
  return baseCosts[instanceType] || 34;
}

// Get cost multiplier for different regions
function getRegionCostMultiplier(region: string): number {
  const multipliers: { [key: string]: number } = {
    "us-east-1": 1.0, // Base (cheapest)
    "us-west-2": 1.05, // 5% more expensive
    "eu-west-1": 1.12, // 12% more expensive
    "ap-southeast-1": 1.15, // 15% more expensive
    "eu-north-1": 1.08, // 8% more expensive
  };

  return multipliers[region] || 1.0;
}

export function generateMockKPIs(): CostKPI {
  return {
    totalMonthly: 100000,
    dailyBurn: 3333.33,
    projectedMonth: 100000,
    changeFromLastMonth: 5000,
    changePercentage: 5.26,
  };
}
