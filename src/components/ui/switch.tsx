"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full bg-input transition data-[state=checked]:bg-primary", className)} {...props}>
      <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition data-[state=checked]:translate-x-[1.35rem]" />
    </SwitchPrimitive.Root>
  );
}
