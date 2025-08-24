export interface CostKPI {
  totalMonthly: number;
  dailyBurn: number;
  projectedMonth: number;
  changeFromLastMonth: number;
  changePercentage: number;
}

export interface CostBreakdown {
  dimension: string;
  value: string;
  amount: number;
  percentage: number;
}

export interface CostBreakdownResponse {
  kpis: CostKPI;
  breakdowns: CostBreakdown[];
  dimension: "region" | "instanceType" | "service" | "account" | "job";
  dataSource?: "aws" | "instance-based" | "mock";
}

export interface CostTrendPoint {
  date: string;
  amount: number;
  isAnomaly: boolean;
}

export interface CostTrendResponse {
  trend: CostTrendPoint[];
  period: "7d" | "30d" | "90d";
  totalAmount: number;
  averageDaily: number;
}

export interface AnomalyFlag {
  isAnomaly: boolean;
  anomalyIndices: number[];
  threshold: number;
  zScore: number;
}
