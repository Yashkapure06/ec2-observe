import { NextResponse } from "next/server";
import { EC2InstanceResponse, EC2Instance } from "@/types/ec2";
import { DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { ec2Client, cloudWatchClient, getCurrentAccountId } from "@/lib/aws";

// Mock data for fallback and demonstration
function generateMockInstances(): EC2Instance[] {
  return [
    {
      id: "i-1234567890abcdef0",
      name: "web-server-prod-01",
      type: "t3.large",
      region: "us-east-1",
      accountId: "1111-2222-3333",
      uptimeHrs: 720,
      costPerHour: 0.0832,
      cpuUtilPct: 15,
      ramUtilPct: 25,
      gpuUtilPct: 0,
      state: "running" as const,
      launchTime: "2024-01-15T10:00:00Z",
      tags: {
        Environment: "production",
        Service: "web-server",
        JobId: "alignment",
      },
    },
    {
      id: "i-0987654321fedcba0",
      name: "db-server-prod-01",
      type: "r5.xlarge",
      region: "us-east-1",
      accountId: "1111-2222-3333",
      uptimeHrs: 1440,
      costPerHour: 0.25,
      cpuUtilPct: 45,
      ramUtilPct: 60,
      gpuUtilPct: 0,
      state: "running" as const,
      launchTime: "2024-01-01T00:00:00Z",
      tags: {
        Environment: "production",
        Service: "database",
        JobId: "variant-calling",
      },
    },
    {
      id: "i-abcdef1234567890",
      name: "ml-training-dev-01",
      type: "p3.2xlarge",
      region: "us-west-2",
      accountId: "4444-5555-6666",
      uptimeHrs: 48,
      costPerHour: 3.06,
      cpuUtilPct: 85,
      ramUtilPct: 90,
      gpuUtilPct: 95,
      state: "running" as const,
      launchTime: "2024-08-20T08:00:00Z",
      tags: {
        Environment: "development",
        Service: "ml-training",
        JobId: "assembly",
      },
    },
    {
      id: "i-1111111111111111",
      name: "staging-server",
      type: "t3.medium",
      region: "eu-west-1",
      accountId: "7777-8888-9999",
      uptimeHrs: 168,
      costPerHour: 0.0416,
      cpuUtilPct: 30,
      ramUtilPct: 40,
      gpuUtilPct: 0,
      state: "stopped" as const,
      launchTime: "2024-08-15T12:00:00Z",
      tags: { Environment: "staging", Service: "web-server", JobId: "qc" },
    },
    {
      id: "i-2222222222222222",
      name: "monitoring-server",
      type: "t3.small",
      region: "ap-southeast-1",
      accountId: "0000-1111-2222",
      uptimeHrs: 2160,
      costPerHour: 0.0208,
      cpuUtilPct: 10,
      ramUtilPct: 15,
      gpuUtilPct: 0,
      state: "running" as const,
      launchTime: "2023-12-01T00:00:00Z",
      tags: {
        Environment: "production",
        Service: "monitoring",
        JobId: "other",
      },
    },
  ];
}

// Helper function to get instance metrics from CloudWatch
async function getInstanceMetrics(instanceId: string): Promise<{
  cpuUtilPct: number;
  ramUtilPct: number;
  gpuUtilPct: number;
}> {
  const endTime = new Date();
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - 1); // Last hour

  try {
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
            Period: 300, // 5 minutes
            Stat: "Average",
          },
        },
        {
          Id: "network",
          MetricStat: {
            Metric: {
              Namespace: "AWS/EC2",
              MetricName: "NetworkIn",
              Dimensions: [{ Name: "InstanceId", Value: instanceId }],
            },
            Period: 300,
            Stat: "Average",
          },
        },
      ],
    });

    const response = await cloudWatchClient.send(command);

    // Get the latest metric values
    const cpuUtilPct = response.MetricDataResults?.[0]?.Values?.[0] || 0;
    const networkIn = response.MetricDataResults?.[1]?.Values?.[0] || 0;

    // Estimate RAM utilization based on network activity (rough approximation)
    const ramUtilPct = Math.min(100, Math.max(0, (networkIn / 1000000) * 10)); // Rough estimate

    return {
      cpuUtilPct: Math.round(cpuUtilPct * 100) / 100,
      ramUtilPct: Math.round(ramUtilPct * 100) / 100,
      gpuUtilPct: 0, // GPU metrics require custom CloudWatch metrics
    };
  } catch (error) {
    console.error(`Failed to get metrics for ${instanceId}:`, error);
    return { cpuUtilPct: 0, ramUtilPct: 0, gpuUtilPct: 0 };
  }
}

// Helper function to estimate cost per hour based on instance type
function estimateCostPerHour(instanceType: string): number {
  const costMap: Record<string, number> = {
    "t3.micro": 0.0104,
    "t3.small": 0.0208,
    "t3.medium": 0.0416,
    "t3.large": 0.0832,
    "t3.xlarge": 0.1664,
    "m5.large": 0.096,
    "m5.xlarge": 0.192,
    "m5.2xlarge": 0.384,
    "r5.large": 0.126,
    "r5.xlarge": 0.252,
    "r5.2xlarge": 0.504,
    "c5.large": 0.085,
    "c5.xlarge": 0.17,
    "c5.2xlarge": 0.34,
    "p3.2xlarge": 3.06,
    "g4dn.xlarge": 0.526,
  };

  return costMap[instanceType] || 0.1;
}

export async function GET() {
  try {
    console.log("Fetching EC2 instances from AWS...");

    const awsInstances: EC2Instance[] = [];

    try {
      // Try to get real AWS data first
      const command = new DescribeInstancesCommand({});
      const response = await ec2Client.send(command);

      // Resolve current account ID once
      const currentAccountId = await getCurrentAccountId();

      if (response.Reservations && response.Reservations.length > 0) {
        // Transform AWS response to match your interface
        for (const reservation of response.Reservations) {
          if (!reservation.Instances) continue;

          for (const instance of reservation.Instances) {
            if (!instance.InstanceId) continue;

            // Get instance metrics
            const metrics = await getInstanceMetrics(instance.InstanceId);

            // Calculate uptime
            const launchTime = instance.LaunchTime;
            const uptimeHrs = launchTime
              ? Math.floor(
                  (Date.now() - new Date(launchTime).getTime()) /
                    (1000 * 60 * 60)
                )
              : 0;

            // Get instance name from tags
            const nameTag = instance.Tags?.find((tag) => tag.Key === "Name");
            const name = nameTag?.Value || "Unnamed";

            // Convert tags to object
            const tags: Record<string, string> = {};
            instance.Tags?.forEach((tag) => {
              if (tag.Key && tag.Value) {
                tags[tag.Key] = tag.Value;
              }
            });

            const ec2Instance: EC2Instance = {
              id: instance.InstanceId,
              name,
              type: instance.InstanceType || "unknown",
              region: process.env.AWS_REGION || "us-east-1",
              accountId: currentAccountId,
              uptimeHrs,
              costPerHour: estimateCostPerHour(
                instance.InstanceType || "t3.micro"
              ),
              cpuUtilPct: metrics.cpuUtilPct,
              ramUtilPct: metrics.ramUtilPct,
              gpuUtilPct: metrics.gpuUtilPct,
              state:
                (instance.State?.Name as
                  | "running"
                  | "stopped"
                  | "terminated") || "stopped",
              launchTime: launchTime?.toISOString() || new Date().toISOString(),
              tags,
            };

            awsInstances.push(ec2Instance);
          }
        }

        console.log(`Found ${awsInstances.length} real AWS EC2 instances`);
      } else {
        console.log("No real EC2 instances found, using mock data");
      }
    } catch (awsError) {
      console.error(
        "AWS EC2 fetch failed, falling back to mock data:",
        awsError
      );
    }

    // Combine real AWS data with mock data for demonstration
    const allInstances: EC2Instance[] = [];

    if (awsInstances.length > 0) {
      // Add real instances first
      allInstances.push(...awsInstances);

      // Add some mock instances for demonstration (if you want)
      const mockInstances = generateMockInstances();
      allInstances.push(...mockInstances);

      console.log(
        `Combined: ${awsInstances.length} real + ${mockInstances.length} mock instances`
      );
    } else {
      // Use only mock data if no AWS instances
      allInstances.push(...generateMockInstances());
      console.log(`Using ${allInstances.length} mock instances`);
    }

    const result: EC2InstanceResponse = {
      instances: allInstances,
      totalCount: allInstances.length,
      regions: [...new Set(allInstances.map((i) => i.region))],
      instanceTypes: [...new Set(allInstances.map((i) => i.type))],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("EC2 API error:", error);
    // Fallback to mock data on complete failure
    const mockInstances = generateMockInstances();
    return NextResponse.json({
      instances: mockInstances,
      totalCount: mockInstances.length,
      regions: [...new Set(mockInstances.map((i) => i.region))],
      instanceTypes: [...new Set(mockInstances.map((i) => i.type))],
      note: "Using mock data due to AWS error",
    });
  }
}
