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
        accessorKey: "id",
        header: "Instance ID",
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.getValue("id")}</div>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.getValue("name")}</span>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono">
            {row.getValue("type")}
          </Badge>
        ),
      },
      {
        accessorKey: "region",
        header: "Region",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.getValue("region")}</Badge>
        ),
      },
      {
        accessorKey: "accountId",
        header: "Account ID",
        cell: ({ row }) => (
          <div className="font-mono text-sm">
            {row.getValue("accountId") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "state",
        header: "State",
        cell: ({ row }) => {
          const state = row.getValue("state") as string;
          const getStateColor = (state: string) => {
            switch (state) {
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
            <Badge
              variant="outline"
              className={`font-medium ${getStateColor(state)}`}
            >
              {state.charAt(0).toUpperCase() + state.slice(1)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "cpuUtilPct",
        header: "CPU",
        cell: ({ row }) => {
          const value = row.getValue("cpuUtilPct") as number;
          return (
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <div className="w-20">
                <Progress value={value} className="h-2" />
              </div>
              <span className="text-sm font-medium w-12">{value}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: "ramUtilPct",
        header: "RAM",
        cell: ({ row }) => {
          const value = row.getValue("ramUtilPct") as number;
          return (
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <div className="w-20">
                <Progress value={value} className="h-2" />
              </div>
              <span className="text-sm font-medium w-12">{value}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: "gpuUtilPct",
        header: "GPU",
        cell: ({ row }) => {
          const value = row.getValue("gpuUtilPct") as number;
          return (
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <div className="w-20">
                <Progress value={value} className="h-2" />
              </div>
              <span className="text-sm font-medium w-12">{value}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: "uptimeHrs",
        header: "Uptime",
        cell: ({ row }) => {
          const hours = row.getValue("uptimeHrs") as number;
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          return (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {days > 0 ? `${days}d ` : ""}
                {remainingHours}h
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "costPerHour",
        header: "Cost/hr",
        cell: ({ row }) => {
          const cost = row.getValue("costPerHour") as number;
          return (
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatCurrency(cost)}</span>
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
                <Badge className={getWasteScoreColor(waste.level)}>
                  {waste.level.charAt(0).toUpperCase() + waste.level.slice(1)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <p className="font-medium">Waste Score: {waste.score}/100</p>
                  <ul className="mt-2 space-y-1">
                    {waste.reasons.map((reason, index) => (
                      <li key={index} className="text-sm">
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
