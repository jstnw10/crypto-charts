"use client";

import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { SimplePriceFeed } from "@/lib/pyth";
import { track } from "@vercel/analytics";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import { CardTitle } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface TokenCommandProps {
  priceFeedData: Promise<SimplePriceFeed[]>;
}

export function TokenCommand(props: TokenCommandProps) {
  const priceFeedData = use(props.priceFeedData);

  const [open, setOpen] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  console.log(priceFeedData);

  if (isDesktop)
    return (
      <>
        <div className="flex flex-row gap-2 items-center">
          <button className="w-min" onClick={() => setOpen(true)}>
            <CardTitle className="underline decoration-dashed">{searchParams.get("ticker" ?? "ERROR")}</CardTitle>
          </button>
          <span className="hidden md:block">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </span>
        </div>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a ticker to search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <TickerCommandItem base="Solana" description="Solana / US Dollar" symbol="SOL/USD" onClose={() => setOpen(false)} />
              <TickerCommandItem base="Bitcoin" description="Bitcoin / US Dollar" symbol="BTC/USD" onClose={() => setOpen(false)} />
              <TickerCommandItem base="Sui" description="SUI / US Dollar" symbol="SUI/USD" onClose={() => setOpen(false)} />
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="All Price Feeds">
              {priceFeedData.map((priceFeed) => (
                <TickerCommandItem key={priceFeed.symbol} {...priceFeed} onClose={() => setOpen(false)} />
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-min" onClick={() => setOpen(true)}>
          <CardTitle className="underline decoration-dashed">{searchParams.get("ticker" ?? "ERROR")}</CardTitle>
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0" side="bottom" align="start">
        <Command>
          <CommandInput placeholder="Change status..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {priceFeedData.map((status) => (
                <TickerCommandItem key={status.symbol} {...status} onClose={() => setOpen(false)} />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const TickerCommandItem = ({ symbol, description, base, onClose }: SimplePriceFeed & { onClose: () => void }) => {
  const router = useRouter();

  function onSelect() {
    router.push(`/?ticker=${symbol}`);
    track("ticker_command_item_selected", { base });
    onClose();
  }

  return (
    <CommandItem onSelect={onSelect} value={base}>
      <span className="flex-col gap-0.5 inline-flex">
        <span className="text-lg">{base}</span>
        <span className="text-sm">{description}</span>
      </span>
    </CommandItem>
  );
};

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    result.addEventListener("change", onChange);
    setValue(result.matches);

    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}
