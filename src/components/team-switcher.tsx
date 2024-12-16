"use client";

import * as React from "react";
import { Command } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Button variant="secondary" className="w-full h-fit flex px-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Command className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Certify</span>
            <span className="truncate text-xs">DApp Certificate Token</span>
          </div>
        </Button>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
