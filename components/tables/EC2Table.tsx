"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EC2Instance } from "@/types/ec2";
import { wasteScore, getWasteScoreColor } from "@/lib/waste";
import { formatCurrency } from "@/lib/cost";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Server,
  Cpu,
  HardDrive,
  Monitor,
  Clock,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { InstanceTimelineModal } from "@/components/panels/InstanceTimelineModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { RightSizeDialog } from "@/components/dialogs/RightSizeDialog";
import { toast } from "sonner";

function ActionsCell({ instance }: { instance: EC2Instance }) {
  const [rsOpen, setRsOpen] = useState(false);

  const isDummyInstance = (instanceId: string): boolean => {
    const dummyIds = [
      "i-1234567890abcdef0",
      "i-0987654321fedcba0",
      "i-abcdef1234567890",
      "i-1111111111111111",
      "i-2222222222222222",
    ];
    return dummyIds.includes(instanceId);
  };

  const isDummy = isDummyInstance(instance.id);

  if (isDummy) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block cursor-help">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 opacity-50 pointer-events-none"
              disabled
            >
              <BarChart3 className="h-4 w-4" />
              <span>Timeline</span>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Timeline works only for real AWS data</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <InstanceTimelineModal
        instance={instance}
        trigger={
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Timeline</span>
          </Button>
        }
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() =>
              toast("Propose right-size", {
                description:
                  "Sizing recommendation is a placeholder in this build.",
              })
            }
          >
            Propose right-size
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              toast("Create stop schedule", {
                description: "Scheduler dialog is a placeholder in this build.",
              })
            }
          >
            Create stop schedule
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={async () => {
              try {
                if (navigator.clipboard) {
                  await navigator.clipboard.writeText(instance.id);
                }
                toast("Instance ID copied", { description: instance.id });
              } catch {
                toast("Copy failed", {
                  description: "Clipboard not available",
                });
              }
            }}
          >
            Copy Instance ID
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RightSizeDialog
        instance={instance}
        open={rsOpen}
        onOpenChange={setRsOpen}
      />
    </div>
  );
}
import { useFilteredInstances } from "@/hooks/useFilters";

interface EC2TableProps {
  instances: EC2Instance[];
  className?: string;
}

export function EC2Table({ instances, className }: EC2TableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Apply filters to instances
  const { filteredInstances, filterSummary } = useFilteredInstances(instances);

  const columns: ColumnDef<EC2Instance>[] = useMemo(
    () => [
      {
        id: "resource",
        header: "Resource",
        cell: ({ row }) => {
          const { name, id, region } = row.original;
          return (
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">{name}</span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center space-x-2">
                <span className="font-mono">{id}</span>
                <span>•</span>
                <span>{region}</span>
              </div>
            </div>
          );
        },
      },
      {
        id: "configuration",
        header: "Configuration",
        cell: ({ row }) => {
          const { type, state, accountId } = row.original;
          
          const getStateColor = (s: string) => {
            switch (s) {
              case "running":
                return "bg-green-100 text-green-800 border-green-200";
              case "stopped":
                return "bg-red-100 text-red-800 border-red-200";
              case "terminated":
                return "bg-gray-100 text-gray-800 border-gray-200";
              case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
              case "shutting-down":
                return "bg-orange-100 text-orange-800 border-orange-200";
              default:
                return "bg-gray-100 text-gray-800 border-gray-200";
            }
          };

          return (
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="font-mono bg-background">
                  {type}
                </Badge>
                <Badge variant="outline" className={`font-medium ${getStateColor(state)}`}>
                  {state.charAt(0).toUpperCase() + state.slice(1)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Account: <span className="font-mono">{accountId || "-"}</span>
              </div>
            </div>
          );
        },
      },
      {
        id: "utilization",
        header: "Utilization",
        cell: ({ row }) => {
          const cpu = row.original.cpuUtilPct;
          const ram = row.original.ramUtilPct;
          const gpu = row.original.gpuUtilPct;
          
          const getMetricColor = (val: number) => {
            if (val > 80) return "text-red-500";
            if (val < 10) return "text-yellow-500";
            return "text-green-500";
          };

          return (
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground mb-1">CPU</span>
                <span className={`font-semibold ${getMetricColor(cpu)}`}>{cpu}%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground mb-1">RAM</span>
                <span className={`font-semibold ${getMetricColor(ram)}`}>{ram}%</span>
              </div>
              {gpu > 0 && (
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1">GPU</span>
                  <span className={`font-semibold ${getMetricColor(gpu)}`}>{gpu}%</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "impact",
        header: "Cost Impact",
        cell: ({ row }) => {
          const cost = row.original.costPerHour;
          const hours = row.original.uptimeHrs;
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          
          // Determine if we should show projected monthly cost or just per hour
          const projectedMonthly = cost * 730;

          return (
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-1 font-semibold text-foreground">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{formatCurrency(cost)}/hr</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Up: {days > 0 ? `${days}d ` : ""}{remainingHours}h</span>
                <span>•</span>
                <span>~{formatCurrency(projectedMonthly)}/mo</span>
              </div>
            </div>
          );
        },
      },
      {
        id: "wasteScore",
        header: "Waste Score",
        cell: ({ row }) => {
          const instance = row.original;
          const waste = wasteScore({
            cpu: instance.cpuUtilPct,
            ram: instance.ramUtilPct,
            gpu: instance.gpuUtilPct,
            uptimeHrs: instance.uptimeHrs,
            costPerHour: instance.costPerHour,
          });

          return (
            <Tooltip>
              <TooltipTrigger>
                <div className="flex flex-col items-start gap-1">
                  <Badge className={getWasteScoreColor(waste.level)}>
                    {waste.level.charAt(0).toUpperCase() + waste.level.slice(1)}
                  </Badge>
                  {waste.score > 0 && <span className="text-xs text-muted-foreground font-medium pl-1">Score: {waste.score}/100</span>}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <p className="font-medium">Waste Score: {waste.score}/100</p>
                  <ul className="mt-2 space-y-1">
                    {waste.reasons.map((reason, index) => (
                      <li key={index} className="text-sm border-b border-border/40 pb-1 last:border-0">
                        • {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const instance = row.original;
          return <ActionsCell instance={instance} />;
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredInstances,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>EC2 Instances</span>
            {filterSummary.filteredInstances < filterSummary.totalInstances ? (
              <span className="text-sm text-muted-foreground">
                ({filterSummary.filteredInstances} of{" "}
                {filterSummary.totalInstances})
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                ({filterSummary.totalInstances})
              </span>
            )}
          </div>
          <Input
            placeholder="Search instances..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No instances found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
