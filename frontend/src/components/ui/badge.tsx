"use client";
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border-2 px-2 py-0.5 text-xs font-semibold whitespace-nowrap transition-all duration-100 " +
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 " +
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 " +
  "[&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-black dark:border-zinc-900 shadow-[2px_2px_0px_0px_var(--color-neo-dark)] [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground border-zinc-600 shadow-[2px_2px_0px_0px_var(--color-neo-dark)] [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white border-black dark:border-zinc-900 shadow-[2px_2px_0px_0px_var(--color-neo-dark)] focus-visible:ring-destructive/20 dark:bg-destructive/60 [a&]:hover:bg-destructive/90",
        outline:
          "border-zinc-600 text-foreground shadow-[2px_2px_0px_0px_var(--color-neo-dark)] [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost:
          "border-transparent shadow-none [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "border-transparent shadow-none text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
