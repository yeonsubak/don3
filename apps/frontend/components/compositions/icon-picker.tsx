'use client';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { DynamicIcon, iconNames, type IconName } from 'lucide-react/dynamic';
import * as React from 'react';
import type {
  ControllerRenderProps,
  FieldValue,
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';
import { useIsMobile } from '../hooks/use-mobile';
import { Button } from '../ui/button';

interface IconPickerProps {
  onChange?: (icon: IconName) => void;
  className?: string;
  field?: ControllerRenderProps<FieldValue<FieldValues>>;
  zForm?: UseFormReturn<FieldValue<FieldValues>>;
}

export function IconPicker({ onChange, className, field }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(0);
  const ICONS_PER_PAGE = 24; // 8 columns x 3 rows
  const totalPages = Math.ceil(iconNames.length / ICONS_PER_PAGE);

  const isMobile = useIsMobile();

  // Get current page icons
  const [currentPageIcons, setCurrentPageIcons] = React.useState<IconName[]>([]);

  React.useEffect(() => {
    try {
      const startIdx = currentPage * ICONS_PER_PAGE;
      const endIdx = Math.min(startIdx + ICONS_PER_PAGE - 1, iconNames.length - 1);
      if (startIdx <= endIdx) {
        const icons = iconNames.slice(startIdx, endIdx);
        setCurrentPageIcons(icons);
      }
    } catch (e) {
      console.error('Error fetching icons:', e);
      setCurrentPageIcons([]);
    }
  }, [currentPage]);

  // Filter icons based on search query
  const filteredIcons = React.useMemo(() => {
    if (!searchQuery) return currentPageIcons;

    return currentPageIcons.filter((iconName) =>
      iconName.toString().toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [currentPageIcons, searchQuery]);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset page when search query changes
  React.useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn('aspect-square', className)} asChild>
        <Button
          variant="outline"
          role="combobox"
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-10 items-center justify-center rounded-md border focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {field?.value ? (
            <DynamicIcon name={field.value} className="h-5 w-5" />
          ) : (
            <ChevronsUpDown className="h-5 w-5 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[360px] p-0"
        align="start"
        onOpenAutoFocus={(e) => isMobile && e.preventDefault()}
      >
        <Command>
          <CommandInput
            placeholder="Search icons..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {filteredIcons.length === 0 ? (
              <CommandEmpty>No icons found.</CommandEmpty>
            ) : (
              <CommandGroup>
                <div className="grid grid-cols-8 gap-2 p-2">
                  {filteredIcons.map((iconName) => (
                    <div
                      key={iconName}
                      role="button"
                      onClick={() => {
                        if (field) {
                          field.onChange(iconName);
                        } else {
                          onChange?.(iconName);
                        }
                        setOpen(false);
                      }}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-md border',
                        'hover:bg-accent hover:text-accent-foreground cursor-pointer',
                        field?.value === iconName && 'border-primary bg-primary/10',
                        'relative',
                      )}
                      title={iconName}
                    >
                      <DynamicIcon name={iconName} className="h-5 w-5" />
                      {field?.value === iconName && (
                        <Check className="text-primary absolute top-1 right-1 h-3 w-3" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t p-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className="hover:bg-accent cursor-pointer rounded-md p-1 disabled:opacity-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-muted-foreground text-xs">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1}
                    className="hover:bg-accent cursor-pointer rounded-md p-1 disabled:opacity-50"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
