export interface EC2Instance {
  id: string;
  name: string;
  type: string;
  region: string;
  accountId?: string;
  uptimeHrs: number;
  costPerHour: number;
  cpuUtilPct: number;
  ramUtilPct: number;
  gpuUtilPct: number;
  state: "running" | "stopped" | "terminated";
  launchTime: string;
  tags: Record<string, string>;
}

export interface EC2InstanceResponse {
  instances: EC2Instance[];
  totalCount: number;
  regions: string[];
  instanceTypes: string[];
}

export interface EC2Metrics {
  cpuUtilization: number;
  memoryUtilization: number;
  networkIn: number;
  networkOut: number;
  diskReadOps: number;
  diskWriteOps: number;
}

// New types for Component 4: Server Utilization Timeline Graph
export interface UtilizationDataPoint {
  timestamp: string;
  cpu: number;
  ram: number;
  gpu: number;
  networkIn: number;
  networkOut: number;
  diskRead: number;
  diskWrite: number;
}

export interface InstanceTimelineData {
  instanceId: string;
  instanceName: string;
  period: "1h" | "24h" | "7d";
  dataPoints: UtilizationDataPoint[];
  summary: {
    avgCpu: number;
    avgRam: number;
    avgGpu: number;
    peakCpu: number;
    peakRam: number;
    peakGpu: number;
    idleTime: number; // percentage of time below 10% utilization
    spikyBehavior: boolean; // indicates if usage is irregular
  };
}

export interface TimelineRequest {
  instanceId: string;
  period: "1h" | "24h" | "7d";
}
