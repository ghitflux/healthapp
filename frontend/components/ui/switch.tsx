'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, style, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-border/80 bg-muted transition-[background-color,border-color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/35 data-[state=checked]:border-primary/60 data-[state=checked]:bg-primary/95 data-[state=checked]:shadow-[0_10px_18px_-12px_rgba(37,99,235,0.9)] data-[state=unchecked]:bg-muted dark:data-[state=unchecked]:bg-neutral-800',
      className
    )}
    style={style}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full border border-white/70 bg-white shadow-md ring-0 transition-[transform,background-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] data-[state=checked]:translate-x-[22px] data-[state=checked]:shadow-[0_6px_14px_rgba(15,23,42,0.22)] data-[state=unchecked]:translate-x-[2px] dark:bg-neutral-50'
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
