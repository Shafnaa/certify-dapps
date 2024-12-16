"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAccount, useConnect } from "wagmi";
import { Button } from "./ui/button";

export function NavUser() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {connectors.map((connector) => (
          <Button
            variant="secondary"
            className="w-full h-fit flex justify-between px-2 py-2 border border-input"
            onClick={() => {
              connect({ connector });
            }}
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src="/avatars/default.jpg" alt={account.address} />
              <AvatarFallback className="rounded-lg">CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{account.address ?? "Click to connect!"}</span>
              <span className="truncate text-xs">{account.status}</span>
            </div>
          </Button>
        ))}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
