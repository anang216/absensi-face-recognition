import type { LucideIcon } from 'lucide-react';
import { icons } from '@/lib/icon-list';
import { LayoutGrid } from 'lucide-react';

const iconMap = icons.reduce((acc, curr) => {
  acc[curr.name] = curr.icon;
  return acc;
}, {} as Record<string, LucideIcon>);

export function iconMapper(name?: string): LucideIcon {
  if (!name) return LayoutGrid;

  const formatted = name.charAt(0).toUpperCase() + name.slice(1); // e.g. user → User
  return iconMap[formatted] || LayoutGrid;
}
