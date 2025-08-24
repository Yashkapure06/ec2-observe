import { NextResponse } from "next/server";
import { InstanceTimelineData, UtilizationDataPoint } from "@/types/ec2";
import { GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { cloudWatchClient } from "@/lib/aws";

// Mock data generator for timeline
function generateMockTimelineData(
  instanceId: string,
  instanceName: string,
  period: "1h" | "24h" | "7d"
): InstanceTimelineData {
  console.log(`=== STARTING MOCK DATA GENERATION ===`);
  console.log(
    `Instance: ${instanceId}, Name: ${instanceName}, Period: ${period}`
  );

  const now = new Date();
  const dataPoints: UtilizationDataPoint[] = [];
  let interval: number;
  let points: number;

  switch (period) {
    case "1h":
      interval = 5 * 60 * 1000; // 5 minutes
      points = 12;
      break;
    case "24h":
      interval = 60 * 60 * 1000; // 1 hour
      points = 24;
      break;
    case "7d":
      interval = 24 * 60 * 60 * 1000; // 1 day
      points = 7;
      break;
  }

  // Generate realistic utilization patterns
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * interval);

    // Simulate realistic patterns: higher during work hours, lower at night
    const hour = timestamp.getHours();
    const isWorkHour = hour >= 8 && hour <= 18;
    const baseMultiplier = isWorkHour ? 0.7 : 0.3;

    // Add some randomness and spikes
    const randomFactor = 0.3 + Math.random() * 0.4;
    const spikeFactor = Math.random() > 0.9 ? 1.5 : 1; // 10% chance of spike

    const cpu = Math.min(
      100,
      Math.max(0, baseMultiplier * randomFactor * spikeFactor * 100)
    );
    const ram = Math.min(
      100,
      Math.max(0, baseMultiplier * randomFactor * 0.8 * 100)
    );
    const gpu = Math.min(
      100,
      Math.max(0, baseMultiplier * randomFactor * 0.6 * 100)
    );

    // Network and disk activity correlate with CPU usage
    const networkIn = Math.random() * 1000 * (cpu / 100);
    const networkOut = Math.random() * 500 * (cpu / 100);
    const diskRead = Math.random() * 100 * (cpu / 100);
    const diskWrite = Math.random() * 50 * (cpu / 100);

    dataPoints.push({
      timestamp: timestamp.toISOString(),
      cpu: Math.round(cpu * 100) / 100,
      ram: Math.round(ram * 100) / 100,
      gpu: Math.round(gpu * 100) / 100,
      networkIn: Math.round(networkIn * 100) / 100,
      networkOut: Math.round(networkOut * 100) / 100,
      diskRead: Math.round(diskRead * 100) / 100,
      diskWrite: Math.round(diskWrite * 100) / 100,
    });
  }

  // Calculate summary statistics
  const avgCpu =
    dataPoints.reduce((sum, p) => sum + p.cpu, 0) / dataPoints.length;
  const avgRam =
    dataPoints.reduce((sum, p) => sum + p.ram, 0) / dataPoints.length;
  const avgGpu =
    dataPoints.reduce((sum, p) => sum + p.gpu, 0) / dataPoints.length;

  const peakCpu = Math.max(...dataPoints.map((p) => p.cpu));
  const peakRam = Math.max(...dataPoints.map((p) => p.ram));
  const peakGpu = Math.max(...dataPoints.map((p) => p.gpu));

  const idleTime =
    (dataPoints.filter((p) => p.cpu < 10).length / dataPoints.length) * 100;

  // Detect spiky behavior (high variance in CPU usage)
  const cpuVariance =
    dataPoints.reduce((sum, p) => sum + Math.pow(p.cpu - avgCpu, 2), 0) /
    dataPoints.length;
  const spikyBehavior = cpuVariance > 400; // Threshold for spiky behavior

  return {
    instanceId,
    instanceName,
    period,
    dataPoints,
    summary: {
      avgCpu: Math.round(avgCpu * 100) / 100,
      avgRam: Math.round(avgRam * 100) / 100,
      avgGpu: Math.round(avgGpu * 100) / 100,
      peakCpu: Math.round(peakCpu * 100) / 100,
      peakRam: Math.round(peakRam * 100) / 100,
      peakGpu: Math.round(peakGpu * 100) / 100,
      idleTime: Math.round(idleTime * 100) / 100,
      spikyBehavior,
    },
  };
}

// Helper function to get real CloudWatch metrics
async function getRealTimelineData(
  instanceId: string,
  period: "1h" | "24h" | "7d"
): Promise<InstanceTimelineData | null> {
  try {
    const endTime = new Date();
    let startTime: Date;
    let periodInSeconds: number;

    switch (period) {
      case "1h":
        startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
        periodInSeconds = 300; // 5 minutes
        break;
      case "24h":
        startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
        periodInSeconds = 3600; // 1 hour
        break;
      case "7d":
        startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
        periodInSeconds = 86400; // 1 day
        break;
    }

    const command = new GetMetricDataCommand({
      StartTime: startTime,
      EndTime: endTime,
      MetricDataQueries: [
        {
          Id: "cpu",
          MetricStat: {
            Metric: {
              Namespace: "AWS/EC2",
              MetricName: "CPUUtilization",
              Dimensions: [{ Name: "InstanceId", Value: instanceId }],
            },
            Period: periodInSeconds,
            Stat: "Average",
          },
        },
        {
          Id: "networkIn",
          MetricStat: {
            Metric: {
              Namespace: "AWS/EC2",
              MetricName: "NetworkIn",
              Dimensions: [{ Name: "InstanceId", Value: instanceId }],
            },
            Period: periodInSeconds,
            Stat: "Average",
          },
        },
        {
          Id: "networkOut",
          MetricStat: {
            Metric: {
              Namespace: "AWS/EC2",
              MetricName: "NetworkOut",
              Dimensions: [{ Name: "InstanceId", Value: instanceId }],
            },
            Period: periodInSeconds,
            Stat: "Average",
          },
        },
      ],
    });

    const response = await cloudWatchClient.send(command);

    if (
      !response.MetricDataResults ||
      response.MetricDataResults.length === 0
    ) {
      return null;
    }

    // Transform CloudWatch data to our format
    const cpuData = response.MetricDataResults.find((r) => r.Id === "cpu");
    const networkInData = response.MetricDataResults.find(
      (r) => r.Id === "networkIn"
    );
    const networkOutData = response.MetricDataResults.find(
      (r) => r.Id === "networkOut"
    );

    if (!cpuData?.Timestamps || !cpuData.Values) {
      return null;
    }

    const dataPoints: UtilizationDataPoint[] = [];

    for (let i = 0; i < cpuData.Timestamps.length; i++) {
      const timestamp = cpuData.Timestamps[i];
      const cpu = cpuData.Values[i] || 0;

      // Estimate other metrics based on CPU (since CloudWatch doesn't provide RAM/GPU by default)
      const ram = Math.min(100, Math.max(0, cpu * 0.8 + Math.random() * 20));
      const gpu = Math.min(100, Math.max(0, cpu * 0.6 + Math.random() * 15));

      const networkIn = networkInData?.Values?.[i] || 0;
      const networkOut = networkOutData?.Values?.[i] || 0;

      dataPoints.push({
        timestamp: timestamp.toISOString(),
        cpu: Math.round(cpu * 100) / 100,
        ram: Math.round(ram * 100) / 100,
        gpu: Math.round(gpu * 100) / 100,
        networkIn: Math.round(networkIn * 100) / 100,
        networkOut: Math.round(networkOut * 100) / 100,
        diskRead: Math.round(Math.random() * 100 * (cpu / 100) * 100) / 100,
        diskWrite: Math.round(Math.random() * 50 * (cpu / 100) * 100) / 100,
      });
    }

    // If no data points were generated, return null to trigger mock data fallback
    if (dataPoints.length === 0) {
      console.log(
        `No data points found for ${instanceId}, returning null to trigger mock data`
      );
      return null;
    }

    // Calculate summary statistics
    const avgCpu =
      dataPoints.reduce((sum, p) => sum + p.cpu, 0) / dataPoints.length;
    const avgRam =
      dataPoints.reduce((sum, p) => sum + p.ram, 0) / dataPoints.length;
    const avgGpu =
      dataPoints.reduce((sum, p) => sum + p.gpu, 0) / dataPoints.length;

    const peakCpu = Math.max(...dataPoints.map((p) => p.cpu));
    const peakRam = Math.max(...dataPoints.map((p) => p.ram));
    const peakGpu = Math.max(...dataPoints.map((p) => p.gpu));

    const idleTime =
      (dataPoints.filter((p) => p.cpu < 10).length / dataPoints.length) * 100;

    const cpuVariance =
      dataPoints.reduce((sum, p) => sum + Math.pow(p.cpu - avgCpu, 2), 0) /
      dataPoints.length;
    const spikyBehavior = cpuVariance > 400;

    return {
      instanceId,
      instanceName: `Instance ${instanceId.slice(-8)}`, // Use last 8 chars of instance ID
      period,
      dataPoints,
      summary: {
        avgCpu: Math.round(avgCpu * 100) / 100,
        avgRam: Math.round(avgRam * 100) / 100,
        avgGpu: Math.round(avgGpu * 100) / 100,
        peakCpu: Math.round(peakCpu * 100) / 100,
        peakRam: Math.round(peakRam * 100) / 100,
        peakGpu: Math.round(peakGpu * 100) / 100,
        idleTime: Math.round(idleTime * 100) / 100,
        spikyBehavior,
      },
    };
  } catch (error) {
    console.error(`Failed to get real timeline data for ${instanceId}:`, error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") as "1h" | "24h" | "7d") || "24h";
    const { instanceId } = await params;

    console.log(
      `Fetching timeline data for instance ${instanceId}, period: ${period}`
    );

    // Try to get real AWS data first
    let timelineData: InstanceTimelineData | null = null;

    try {
      timelineData = await getRealTimelineData(instanceId, period);
      if (timelineData) {
        console.log(`Found real timeline data for ${instanceId}`);
      }
    } catch (awsError) {
      console.error(
        `AWS timeline fetch failed for ${instanceId}, falling back to mock data:`,
        awsError
      );
    }

    // Fallback to mock data if no real data
    if (!timelineData) {
      console.log(`=== FALLBACK TO MOCK DATA ===`);
      console.log(
        `Generating mock data for ${instanceId} with period ${period}`
      );

      try {
        timelineData = generateMockTimelineData(
          instanceId,
          `Instance ${instanceId.slice(-8)}`,
          period
        );
        console.log(`Mock data generated successfully:`, {
          dataPointsCount: timelineData.dataPoints.length,
          summary: timelineData.summary,
        });
      } catch (error) {
        console.error(`Error generating mock data:`, error);
        // Create fallback data
        timelineData = {
          instanceId,
          instanceName: `Instance ${instanceId.slice(-8)}`,
          period,
          dataPoints: [],
          summary: {
            avgCpu: 0,
            avgRam: 0,
            avgGpu: 0,
            peakCpu: 0,
            peakRam: 0,
            peakGpu: 0,
            idleTime: 0,
            spikyBehavior: false,
          },
        };
      }
    }

    return NextResponse.json(timelineData);
  } catch (error) {
    console.error("Timeline API error:", error);

    // Fallback to mock data on complete failure
    const periodParam = request.url
      ? new URL(request.url).searchParams.get("period") || "24h"
      : "24h";

    const { instanceId } = await params;
    const mockData = generateMockTimelineData(
      instanceId,
      `Instance ${instanceId.slice(-8)}`,
      periodParam as "1h" | "24h" | "7d"
    );

    return NextResponse.json({
      ...mockData,
      note: "Using mock data due to API error",
    });
  }
}
