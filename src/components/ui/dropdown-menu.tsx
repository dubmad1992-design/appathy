"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
  return <DropdownMenuPrimitive.Content className={cn("z-50 min-w-44 rounded-2xl border border-border bg-popover p-2 shadow-xl", className)} {...props} />;
}

export function DropdownMenuItem({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>) {
  return <DropdownMenuPrimitive.Item className={cn("cursor-pointer rounded-xl px-3 py-2 text-sm outline-none hover:bg-muted", className)} {...props} />;
}
