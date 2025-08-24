import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export const queryKeys = {
  ec2: {
    all: ["ec2"] as const,
    instances: () => [...queryKeys.ec2.all, "instances"] as const,
    instance: (id: string) => [...queryKeys.ec2.instances(), id] as const,
  },
  costs: {
    all: ["costs"] as const,
    kpis: () => [...queryKeys.costs.all, "kpis"] as const,
    breakdown: (dimension: string) =>
      [...queryKeys.costs.all, "breakdown", dimension] as const,
    trend: (period: string) =>
      [...queryKeys.costs.all, "trend", period] as const,
  },
  metrics: {
    all: ["metrics"] as const,
    ec2: (instanceId: string) =>
      [...queryKeys.metrics.all, "ec2", instanceId] as const,
  },
};
