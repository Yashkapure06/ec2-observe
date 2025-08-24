"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider as TooltipProviderBase,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipProviderBase>{children}</TooltipProviderBase>;
}

export { Tooltip, TooltipContent, TooltipTrigger };
