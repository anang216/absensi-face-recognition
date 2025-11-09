import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { icons } from '@/lib/icon-list';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  const customFilter = (input: string, value: string): number => {
    const i = input.toLowerCase();
    const v = value.toLowerCase();
    if (v.startsWith(i)) return 2;
    if (v.includes(i)) return 1;
    return 0;
  };

  const selected = icons.find((i) => i.name === value);
  const SelectedIcon = selected?.icon;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div>
            <Input
              value={value}
              onClick={() => setOpen(true)}
              readOnly
              placeholder="Pilih icon (Lucide)"
              className="cursor-pointer"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]">
          <Command filter={customFilter}>
            <CommandInput placeholder="Cari icon..." />
            <CommandList>
              <CommandEmpty>Icon tidak ditemukan</CommandEmpty>
              <CommandGroup>
                {icons.map(({ name, icon: Icon }) => (
                  <CommandItem
                    key={name}
                    value={name}
                    onSelect={() => {
                      onChange(name);
                      setOpen(false);
                    }}
                  >
                    <Icon className="mr-2 size-4" />
                    {name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {SelectedIcon && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SelectedIcon className="size-4" />
          {value}
        </div>
      )}
    </div>
  );
}
