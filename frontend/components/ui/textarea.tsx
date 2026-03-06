import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, style, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs ring-offset-background transition-[border-color,box-shadow,background-color,color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] outline-none placeholder:text-muted-foreground hover:border-primary-300 hover:bg-background focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 supports-[backdrop-filter]:bg-background/96 dark:bg-neutral-900',
        className
      )}
      style={{
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        borderColor: 'hsl(var(--input))',
        ...style,
      }}
      {...props}
    />
  );
}

export { Textarea };
