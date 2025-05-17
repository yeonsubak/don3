'use client';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import type { ControllerRenderProps, FieldValue, FieldValues } from 'react-hook-form';
import { useIsMobile } from '../hooks/use-mobile';
import { Button } from '../ui/button';
import {
  loadEmojiData,
  type Emoji,
  type EmojiCategoryValue,
  type EmojisByCategory,
} from './emoji-picker-helper';

interface EmojiPickerProps {
  onChange?: (emoji: string) => void;
  className?: string;
  field?: ControllerRenderProps<FieldValue<FieldValues>>;
}

export function EmojiPicker({ onChange, className, field }: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [emojiData, setEmojiData] = React.useState<EmojisByCategory>();
  const [loading, setLoading] = React.useState(true);
  const [currentCategory, setCurrentCategory] = React.useState<string>('😀');
  const [allEmojis, setAllEmojis] = React.useState<Emoji[]>([]);
  const [categoryPages, setCategoryPages] = React.useState<Record<string, number>>({});

  const EMOJIS_PER_PAGE = 24; // 6 columns × 4 rows

  const isMobile = useIsMobile();

  // Load emoji data
  React.useEffect(() => {
    async function loadData() {
      try {
        const data: EmojisByCategory | undefined = await loadEmojiData(['Component']);

        if (!data) {
          throw new Error('Failed to load emoji data');
        }
        setEmojiData(data);

        const categories = Object.keys(data.emojis);

        // Initialize page numbers for each category
        const initialPages: Record<string, number> = {};
        categories.forEach((category) => {
          initialPages[category] = 0;
        });
        setCategoryPages(initialPages);

        // Create a flat list of all emojis for search
        const flatEmojis: Emoji[] = [];
        Object.values(data.emojis).forEach((emojisInCategory) => {
          flatEmojis.push(...emojisInCategory);
        });

        setAllEmojis(flatEmojis);
        setLoading(false);
      } catch (error) {
        console.error('Error loading emoji data:', error);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter emojis based on search query
  const filteredEmojis = React.useMemo(() => {
    if (!searchQuery) return [];

    return allEmojis.filter(
      (emoji) =>
        emoji.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emoji.emoji.includes(searchQuery),
    );
  }, [allEmojis, searchQuery]);

  // Get current page emojis for a category
  const getCurrentPageEmojis = (category: string): Emoji[] => {
    const _category = category as EmojiCategoryValue;
    if (!emojiData?.emojis[_category]) return [];

    const currentPage = categoryPages[category] || 0;
    const startIndex = currentPage * EMOJIS_PER_PAGE;
    const endIndex = startIndex + EMOJIS_PER_PAGE;

    return emojiData.emojis[_category].slice(startIndex, endIndex);
  };

  // Calculate total pages for a category
  const getTotalPages = (category: string): number => {
    const _category = category as EmojiCategoryValue;
    if (!emojiData?.emojis[_category]) return 0;
    return Math.ceil(emojiData.emojis[_category].length / EMOJIS_PER_PAGE);
  };

  // Handle page navigation
  const handleNextPage = (category: string) => {
    const totalPages = getTotalPages(category);
    const currentPage = categoryPages[category] || 0;

    if (currentPage < totalPages - 1) {
      setCategoryPages({
        ...categoryPages,
        [category]: currentPage + 1,
      });
    }
  };

  const handlePrevPage = (category: string) => {
    const currentPage = categoryPages[category] || 0;

    if (currentPage > 0) {
      setCategoryPages({
        ...categoryPages,
        [category]: currentPage - 1,
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn('aspect-square', className)} asChild>
        <Button
          variant="outline"
          role="combobox"
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex items-center justify-center rounded-md border p-2 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {field?.value ? (
            <span className="emoji text-xl leading-none">{field.value}</span>
          ) : (
            <ChevronsUpDown className="h-5 w-5 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-0"
        align="start"
        onOpenAutoFocus={(e) => isMobile && e.preventDefault()}
      >
        <Command>
          <CommandInput
            placeholder="Search emojis..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-fit min-h-[350px]">
            {loading ? (
              <div className="flex items-center justify-center p-4">Loading emojis...</div>
            ) : searchQuery ? (
              <>
                {filteredEmojis.length === 0 ? (
                  <CommandEmpty>No emojis found.</CommandEmpty>
                ) : (
                  <CommandGroup>
                    <div className="grid grid-cols-6 items-center gap-1 p-2">
                      {filteredEmojis.slice(0, 24).map((emoji) => (
                        <div
                          key={emoji.emoji}
                          role="button"
                          title={emoji.name}
                          onClick={() => {
                            if (field) {
                              field.onChange(emoji.emoji);
                            } else {
                              onChange?.(emoji.emoji);
                            }
                            setOpen(false);
                          }}
                          className={cn(
                            'flex h-12 w-12 cursor-pointer items-center justify-center rounded',
                            'hover:bg-accent hover:text-accent-foreground',
                            field?.value === emoji.emoji && 'bg-primary/10',
                            'relative text-2xl',
                          )}
                        >
                          <span className="emoji">{emoji.emoji}</span>
                          {field?.value === emoji.emoji && (
                            <Check className="text-primary absolute top-0 right-0 h-3 w-3" />
                          )}
                        </div>
                      ))}
                    </div>
                    {filteredEmojis.length > 24 && (
                      <div className="text-muted-foreground flex items-center justify-center p-2 text-sm">
                        Showing first 24 results. Refine your search for more specific results.
                      </div>
                    )}
                  </CommandGroup>
                )}
              </>
            ) : (
              <Tabs
                defaultValue={currentCategory}
                onValueChange={setCurrentCategory}
                className="w-full"
              >
                <TabsList className="flex h-auto w-full justify-between overflow-x-auto px-1 py-1 select-none">
                  {Object.keys(emojiData?.emojis ?? {}).map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="flex h-10 w-10 items-center justify-center px-1 py-1 text-2xl"
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.keys(emojiData?.emojis ?? {}).map((category) => (
                  <TabsContent
                    id={`tab-content-${category}`}
                    key={category}
                    value={category}
                    className="m-0 h-full select-none"
                  >
                    <CommandGroup id="emoji-list" className="h-[220px]">
                      <div className="grid grid-cols-6 gap-1 p-2">
                        {getCurrentPageEmojis(category).map((emoji) => (
                          <div
                            key={emoji.emoji}
                            role="button"
                            title={emoji.name}
                            onClick={() => {
                              if (field) {
                                field.onChange(emoji.emoji);
                              } else {
                                onChange?.(emoji.emoji);
                              }
                              setOpen(false);
                            }}
                            className={cn(
                              'flex h-12 w-12 cursor-pointer items-center justify-center rounded',
                              'hover:bg-accent hover:text-accent-foreground',
                              field?.value === emoji.emoji && 'bg-primary/10',
                              'relative text-2xl',
                            )}
                          >
                            {emoji.emoji}
                            {field?.value === emoji.emoji && (
                              <Check className="text-primary absolute top-0 right-0 h-3 w-3" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CommandGroup>
                    <CommandGroup id="emoji-pagenation">
                      <div className="flex items-center justify-between border-t p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Previous page"
                          className="hover:bg-accent disabled:opacity-50"
                          onClick={() => handlePrevPage(category)}
                          disabled={categoryPages[category] === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-muted-foreground text-xs">
                          Page {(categoryPages[category] || 0) + 1} of {getTotalPages(category)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Next page"
                          className="hover:bg-accent disabled:opacity-50"
                          onClick={() => handleNextPage(category)}
                          disabled={(categoryPages[category] || 0) >= getTotalPages(category) - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CommandGroup>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
