"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFilterStore } from "@/store/filters";
import { Settings, Save, RotateCcw, Eye, Filter, Info } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface FilterSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilterSettingsDialog({
  open,
  onOpenChange,
}: FilterSettingsDialogProps) {
  const NONE = "__none__";
  const {
    defaultFilters,
    setDefaultFilters,
    filterBehavior,
    setFilterBehavior,
    resetToDefaults,
    clearAllFilters,
    toggleFilterVisibility,
  } = useFilterStore();

  const [localDefaults, setLocalDefaults] = useState(defaultFilters);
  const [localBehavior, setLocalBehavior] = useState(filterBehavior);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if there are unsaved changes
  const checkForChanges = () => {
    const defaultsChanged =
      JSON.stringify(localDefaults) !== JSON.stringify(defaultFilters);
    const behaviorChanged =
      JSON.stringify(localBehavior) !== JSON.stringify(filterBehavior);
    setHasChanges(defaultsChanged || behaviorChanged);
  };

  // Update local state and check for changes
  const updateLocalDefaults = (updates: Partial<typeof defaultFilters>) => {
    const newDefaults = { ...localDefaults, ...updates };
    setLocalDefaults(newDefaults);
    setTimeout(() => checkForChanges(), 0);
  };

  const updateLocalBehavior = (updates: Partial<typeof filterBehavior>) => {
    const newBehavior = { ...localBehavior, ...updates };
    setLocalBehavior(newBehavior);
    setTimeout(() => checkForChanges(), 0);
  };

  // Save settings
  const handleSave = () => {
    setDefaultFilters(localDefaults);
    setFilterBehavior(localBehavior);
    setHasChanges(false);
    onOpenChange(false);
  };

  // Reset to current defaults
  const handleReset = () => {
    setLocalDefaults(defaultFilters);
    setLocalBehavior(filterBehavior);
    setHasChanges(false);
  };

  // Apply current defaults
  const handleApplyDefaults = () => {
    resetToDefaults();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Filter Settings</span>
          </DialogTitle>
          <DialogDescription>
            Configure default filters and quick actions for the filtering
            system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Default Filters Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Default Filters</span>
                <Badge variant="outline">Auto-apply on page load</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instance State Default */}
                <div className="space-y-2">
                  <Label htmlFor="defaultState">Default Instance State</Label>
                  <Select
                    value={localDefaults.state ?? NONE}
                    onValueChange={(v) =>
                      updateLocalDefaults({ state: v === NONE ? undefined : v })
                    }
                  >
                    <SelectTrigger id="defaultState" className="w-full">
                      <SelectValue placeholder="No default (show all)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>
                        No default (show all)
                      </SelectItem>
                      <SelectItem value="running">Running only</SelectItem>
                      <SelectItem value="stopped">Stopped only</SelectItem>
                      <SelectItem value="terminated">
                        Terminated only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Waste Level Default */}
                <div className="space-y-2">
                  <Label htmlFor="defaultWasteLevel">Default Waste Level</Label>
                  <Select
                    value={localDefaults.wasteLevel ?? NONE}
                    onValueChange={(v) =>
                      updateLocalDefaults({
                        wasteLevel: v === NONE ? undefined : v,
                      })
                    }
                  >
                    <SelectTrigger id="defaultWasteLevel" className="w-full">
                      <SelectValue placeholder="No default (show all)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>
                        No default (show all)
                      </SelectItem>
                      <SelectItem value="good">Good (0-39)</SelectItem>
                      <SelectItem value="warning">Warning (40-69)</SelectItem>
                      <SelectItem value="critical">
                        Critical (70-100)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Environment Default */}
                <div className="space-y-2">
                  <Label htmlFor="defaultEnvironment">
                    Default Environment
                  </Label>
                  <Select
                    value={localDefaults.environment ?? NONE}
                    onValueChange={(v) =>
                      updateLocalDefaults({
                        environment: v === NONE ? undefined : v,
                      })
                    }
                  >
                    <SelectTrigger id="defaultEnvironment" className="w-full">
                      <SelectValue placeholder="No default (show all)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>
                        No default (show all)
                      </SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Service Default */}
                <div className="space-y-2">
                  <Label htmlFor="defaultService">Default Service</Label>
                  <Select
                    value={localDefaults.service ?? NONE}
                    onValueChange={(v) =>
                      updateLocalDefaults({
                        service: v === NONE ? undefined : v,
                      })
                    }
                  >
                    <SelectTrigger id="defaultService" className="w-full">
                      <SelectValue placeholder="No default (show all)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>
                        No default (show all)
                      </SelectItem>
                      <SelectItem value="web">Web Services</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="ml">Machine Learning</SelectItem>
                      <SelectItem value="monitoring">Monitoring</SelectItem>
                      <SelectItem value="batch">Batch Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autoApplyDefaults"
                  checked={localBehavior.autoApplyDefaults}
                  onCheckedChange={(checked) =>
                    updateLocalBehavior({ autoApplyDefaults: checked })
                  }
                />
                <Label htmlFor="autoApplyDefaults">
                  Automatically apply default filters when page loads
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RotateCcw className="h-4 w-4" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyDefaults}
                  className="flex items-center space-x-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Apply Current Defaults</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFilterVisibility()}
                  className="flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Toggle Filter Panel</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="flex items-center space-x-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Clear All Filters</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Badge
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <Info className="h-3 w-3" />
                <span>Unsaved changes</span>
              </Badge>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Changes
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
