"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";

export function Avatar({ ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>) {
  return <AvatarPrimitive.Root className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-primary/10" {...props} />;
}

export function AvatarFallback({ ...props }: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>) {
  return <AvatarPrimitive.Fallback className="text-sm font-semibold text-primary" {...props} />;
}
