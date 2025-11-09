'use client';

import { JSX, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useAppearance, type Appearance } from '@/hooks/use-appearance';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function AppearanceDropdown() {
  const { appearance, updateAppearance } = useAppearance();
  const [open, setOpen] = useState(false);

  const items: {
    value: Appearance;
    label: string;
    icon: JSX.Element;
  }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: <Sun className="h-4 w-4 text-yellow-400" />,
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: <Moon className="h-4 w-4 text-purple-400" />,
    },
    {
      value: 'system',
      label: 'System',
      icon: <Monitor className="h-4 w-4 text-blue-400" />,
    },
  ];

  const current = items.find((item) => item.value === appearance);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'rounded-full border border-border/50 shadow-sm transition-colors',
                open && 'bg-muted/50',
              )}
              aria-label="Change Theme"
            >
              {current?.icon || <Monitor className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs font-medium">
          Change Theme
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-40 rounded-md shadow-lg">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => updateAppearance(item.value)}
            className={cn(
              'flex items-center gap-2 py-2 cursor-pointer text-sm',
              appearance === item.value
                ? 'text-primary font-semibold bg-muted/40'
                : 'text-muted-foreground hover:bg-muted/20',
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
