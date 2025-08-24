import { NextResponse } from "next/server";
import { CostTrendResponse, CostTrendPoint } from "@/types/cost";
import { GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { costExplorerClient } from "@/lib/aws";
import { generateMockCostTrend } from "@/lib/cost";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";

    console.log(`Fetching cost trend data for period: ${period}`);

    // Calculate days at the top level so it's available throughout
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    let awsTrend: CostTrendPoint[] = [];

    try {
      // Try to get real AWS cost trend data first
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      console.log(`Date range: ${startDateStr} to ${endDateStr}`);

      const command = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: startDateStr,
          End: endDateStr,
        },
        Granularity: "DAILY",
        Metrics: ["UnblendedCost"],
      });

      const response = await costExplorerClient.send(command);

      if (response.ResultsByTime && response.ResultsByTime.length > 0) {
        // Transform AWS cost trend data
        awsTrend = response.ResultsByTime.map((result) => {
          const date = result.TimePeriod?.Start || "";
          const amount = parseFloat(result.Total?.UnblendedCost?.Amount || "0");

          // Simple anomaly detection: flag costs > 2x average
          const isAnomaly = false; // You can implement more sophisticated detection

          return {
            date: date.split("T")[0], // Extract just the date part
            amount: Math.round(amount * 100) / 100,
            isAnomaly,
          };
        });

        console.log(`Found ${awsTrend.length} days of real AWS cost data`);
      } else {
        console.log("No real AWS cost trend data found, using mock data");
      }
    } catch (awsError) {
      console.error(
        "AWS Cost Explorer trend fetch failed, falling back to mock data:",
        awsError
      );
    }

    // Combine real AWS data with mock data while avoiding duplicate dates.
    // If both sources provide the same day, prefer the non-zero amount and
    // take the maximum when both are non-zero. Also merge anomaly flags.
    let combined: CostTrendPoint[] = [];
    if (awsTrend.length > 0) {
      combined = [...awsTrend, ...generateMockCostTrend(days)];
      console.log(
        `Combined candidate points: ${combined.length} (real + mock)`
      );
    } else {
      combined = generateMockCostTrend(days);
      console.log(`Using ${combined.length} mock cost trend points`);
    }

    // Merge by date
    const mergedByDate = new Map<string, CostTrendPoint>();
    for (const p of combined) {
      const existing = mergedByDate.get(p.date);
      if (!existing) {
        mergedByDate.set(p.date, p);
      } else {
        const pickAmount =
          existing.amount === 0
            ? p.amount
            : p.amount === 0
            ? existing.amount
            : Math.max(existing.amount, p.amount);
        mergedByDate.set(p.date, {
          date: p.date,
          amount: Math.round(pickAmount * 100) / 100,
          isAnomaly: existing.isAnomaly || p.isAnomaly,
        });
      }
    }

    // Convert back to array, keep only the requested window, and sort ascending by date
    let allTrend: CostTrendPoint[] = Array.from(mergedByDate.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );
    if (allTrend.length > days) {
      allTrend = allTrend.slice(allTrend.length - days);
    }

    // Calculate totals
    const totalAmount = allTrend.reduce((sum, point) => sum + point.amount, 0);
    const averageDaily =
      allTrend.length > 0 ? totalAmount / allTrend.length : 0;

    const result: CostTrendResponse = {
      trend: allTrend,
      period: period as "7d" | "30d" | "90d",
      totalAmount: Math.round(totalAmount * 100) / 100,
      averageDaily: Math.round(averageDaily * 100) / 100,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Metrics API error:", error);
    // Fallback to mock data on complete failure
    const periodParam = request.url
      ? new URL(request.url).searchParams.get("period") || "7d"
      : "7d";
    const days = periodParam === "7d" ? 7 : periodParam === "30d" ? 30 : 90;
    const mockTrend = generateMockCostTrend(days);
    const totalAmount = mockTrend.reduce((sum, point) => sum + point.amount, 0);
    const averageDaily = totalAmount / mockTrend.length;

    return NextResponse.json({
      trend: mockTrend,
      period: periodParam as "7d" | "30d" | "90d",
      totalAmount: Math.round(totalAmount * 100) / 100,
      averageDaily: Math.round(averageDaily * 100) / 100,
      note: "Using mock data due to AWS error",
    });
  }
}
