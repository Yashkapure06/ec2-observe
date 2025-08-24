import { NextResponse } from "next/server";
import { CostBreakdownResponse, CostKPI, CostBreakdown } from "@/types/cost";
import type { EC2Instance } from "@/types/ec2";
import { GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { costExplorerClient } from "@/lib/aws";
import {
  generateMockKPIs,
  generateMockCostBreakdown,
  generateInstanceBasedCostBreakdown,
} from "@/lib/cost";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dimension = searchParams.get("dimension") || "region";
    const regionFilter = searchParams.get("region");
    const instanceTypeFilter = searchParams.get("instanceType");
    const accountFilter = searchParams.get("account");
    const jobTagKey = searchParams.get("jobTag") || "JobId";

    console.log(`Fetching cost data for dimension: ${dimension}`);

    let awsCosts: CostBreakdown[] = [];
    let awsKPIs: CostKPI | null = null;
    let ec2Instances: EC2Instance[] = [];

    try {
      // Try to get real AWS cost data first
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      // Also try to fetch EC2 instances for instance-based cost calculation
      try {
        const ec2Response = await fetch(
          `${
            process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
          }/api/ec2`
        );
        if (ec2Response.ok) {
          const ec2Data = await ec2Response.json();
          ec2Instances = ec2Data.instances || [];
          console.log(
            `Fetched ${ec2Instances.length} EC2 instances for cost calculation`
          );
        }
      } catch (ec2Error) {
        console.log(
          "Could not fetch EC2 instances, will use mock data:",
          ec2Error
        );
      }

      console.log(`Date range: ${startDateStr} to ${endDateStr}`);

      // Map UI dimension to AWS Cost Explorer GroupBy key
      const awsGroupKey =
        dimension === "account"
          ? "LINKED_ACCOUNT"
          : dimension === "job"
          ? `TAG.${jobTagKey}`
          : dimension.toUpperCase();

      const command = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: startDateStr,
          End: endDateStr,
        },
        Granularity: "MONTHLY",
        Metrics: ["UnblendedCost"],
        GroupBy: [
          { Type: dimension === "job" ? "TAG" : "DIMENSION", Key: awsGroupKey },
        ],
        ...(dimension === "account" && regionFilter
          ? {
              Filter: {
                Dimensions: { Key: "REGION", Values: [regionFilter] },
              },
            }
          : {}),
        ...(dimension === "instanceType" && accountFilter
          ? {
              Filter: {
                Dimensions: {
                  Key: "LINKED_ACCOUNT",
                  Values: accountFilter.split(","),
                },
              },
            }
          : {}),
      });

      const response = await costExplorerClient.send(command);

      if (response.ResultsByTime && response.ResultsByTime.length > 0) {
        const costResult = response.ResultsByTime[0];
        const groups = costResult.Groups || [];

        // Transform AWS cost data
        awsCosts = groups.map((group) => {
          const value = group.Keys?.[0] || "Unknown";
          const amount = parseFloat(
            group.Metrics?.UnblendedCost?.Amount || "0"
          );

          return {
            dimension: dimension,
            value,
            amount,
            percentage: 0,
          };
        });

        // Calculate total and percentages
        const totalAmount = awsCosts.reduce(
          (sum, item) => sum + item.amount,
          0
        );

        awsCosts.forEach((item) => {
          item.percentage =
            totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0;
        });

        // Sort by amount (highest first)
        awsCosts.sort((a, b) => b.amount - a.amount);

        // Calculate KPIs
        const daysInMonth = new Date(
          endDate.getFullYear(),
          endDate.getMonth() + 1,
          0
        ).getDate();
        const dailyBurn = totalAmount / daysInMonth;
        const projectedMonth = dailyBurn * 30;

        awsKPIs = {
          totalMonthly: totalAmount,
          dailyBurn: Math.round(dailyBurn * 100) / 100,
          projectedMonth: Math.round(projectedMonth * 100) / 100,
          changeFromLastMonth: 0,
          changePercentage: 0,
        };

        console.log(
          `Found ${awsCosts.length} real AWS cost breakdowns, total: $${totalAmount}`
        );
      } else {
        console.log("No real AWS cost data found, using mock data");
      }
    } catch (awsError) {
      console.error(
        "AWS Cost Explorer fetch failed, falling back to mock data:",
        awsError
      );
    }

    // Combine real AWS data with instance-based or mock data
    let allBreakdowns: CostBreakdown[] = [];
    let finalKPIs: CostKPI;

    if (awsCosts.length > 0 && awsKPIs) {
      // Use real AWS data as primary
      allBreakdowns = awsCosts;
      finalKPIs = awsKPIs;

      // Add some instance-based data for demonstration (optional)
      if (ec2Instances.length > 0) {
        let filteredInstances = ec2Instances;
        if (regionFilter) {
          const regions = regionFilter.split(",");
          filteredInstances = filteredInstances.filter((i) =>
            regions.includes(i.region)
          );
        }
        if (instanceTypeFilter) {
          const types = instanceTypeFilter.split(",");
          filteredInstances = filteredInstances.filter((i) =>
            types.includes(i.type)
          );
        }
        if (accountFilter) {
          const accounts = accountFilter.split(",");
          filteredInstances = filteredInstances.filter((i) =>
            accounts.includes(
              (i as EC2Instance).accountId || i.tags?.["accountId"]
            )
          );
        }
        const instanceBreakdowns = generateInstanceBasedCostBreakdown(
          filteredInstances,
          dimension as "region" | "instanceType" | "service" | "account" | "job"
        );
        allBreakdowns.push(...instanceBreakdowns);
        console.log(
          `Combined: ${awsCosts.length} real + ${instanceBreakdowns.length} instance-based cost breakdowns`
        );
      } else {
        const mockBreakdowns = generateMockCostBreakdown(
          dimension as "region" | "instanceType" | "service" | "account" | "job"
        );
        allBreakdowns.push(...mockBreakdowns);
        console.log(
          `Combined: ${awsCosts.length} real + ${mockBreakdowns.length} mock cost breakdowns`
        );
      }
    } else {
      // Use instance-based data if available, otherwise mock data
      if (ec2Instances.length > 0) {
        allBreakdowns = generateInstanceBasedCostBreakdown(
          ec2Instances,
          dimension as "region" | "instanceType" | "service" | "account" | "job"
        );
        finalKPIs = generateMockKPIs();
        console.log(
          `Using ${allBreakdowns.length} instance-based cost breakdowns`
        );
      } else {
        allBreakdowns = generateMockCostBreakdown(
          dimension as "region" | "instanceType" | "service" | "account" | "job"
        );
        finalKPIs = generateMockKPIs();
        console.log(`Using ${allBreakdowns.length} mock cost breakdowns`);
      }
    }

    // Determine data source for the response
    let dataSource: "aws" | "instance-based" | "mock" = "mock";
    if (awsCosts.length > 0 && awsKPIs) {
      dataSource = "aws";
    } else if (ec2Instances.length > 0) {
      dataSource = "instance-based";
    }

    const result: CostBreakdownResponse = {
      kpis: finalKPIs,
      breakdowns: allBreakdowns,
      dimension: dimension as
        | "region"
        | "instanceType"
        | "service"
        | "account"
        | "job",
      dataSource,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Costs API error:", error);

    // Try to get EC2 instances for instance-based fallback
    let fallbackBreakdowns: CostBreakdown[] = [];
    try {
      const ec2Response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/ec2`
      );
      if (ec2Response.ok) {
        const ec2Data = await ec2Response.json();
        const instances = ec2Data.instances || [];
        if (instances.length > 0) {
          fallbackBreakdowns = generateInstanceBasedCostBreakdown(
            instances,
            "region" as "region" | "instanceType" | "service"
          );
          console.log(
            `Using ${fallbackBreakdowns.length} instance-based breakdowns as fallback`
          );
        }
      }
    } catch {
      console.log(
        "Could not fetch EC2 instances for fallback, using mock data"
      );
    }

    // Fallback to mock data if no instance data available
    if (fallbackBreakdowns.length === 0) {
      fallbackBreakdowns = generateMockCostBreakdown("region");
    }

    return NextResponse.json({
      kpis: generateMockKPIs(),
      breakdowns: fallbackBreakdowns,
      dimension: "region" as "region" | "instanceType" | "service",
      note: "Using fallback data due to AWS error",
    });
  }
}
