"use client";

import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { SimplePriceFeed } from "@/lib/pyth";
import { track } from "@vercel/analytics";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { Input } from "./ui/input";

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

  return <MobileDrawer priceFeedData={priceFeedData} open={open} setOpen={setOpen} />;
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

interface MobileDrawerProps {
  priceFeedData: SimplePriceFeed[];
  open: boolean;
  setOpen: (open: boolean) => void;
}

const MobileDrawer = (props: MobileDrawerProps) => {
  const { priceFeedData, open, setOpen } = props;
  const searchParams = useSearchParams();

  const [currentInput, setCurrentInput] = useState("");

  const filteredItems = useMemo(() => {
    if (currentInput === "") return null;
    return priceFeedData
      .filter(
        (item) =>
          item.symbol.toLowerCase().includes(currentInput.toLowerCase()) ||
          item.description.toLowerCase().includes(currentInput.toLowerCase()) ||
          item.base.toLowerCase().includes(currentInput.toLowerCase())
      )
      .slice(0, 3);
  }, [priceFeedData, currentInput]);

  return (
    <Drawer
      open={open}
      onOpenChange={(change) => {
        setOpen(change);
        setTimeout(() => setCurrentInput(""), 300);
      }}
    >
      <DrawerTrigger asChild>
        <button className="w-min" onClick={() => setOpen(true)}>
          <CardTitle className="underline decoration-dashed">{searchParams.get("ticker" ?? "ERROR")}</CardTitle>
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm flex-grow">
          <DrawerHeader>
            <DrawerTitle className="text-start">Select Ticker</DrawerTitle>
          </DrawerHeader>
          <div className="flex-grow w-full space-y-4">
            <Input placeholder="BTC/USD" onChange={(e) => setCurrentInput(e.target.value)} />
            <div className="space-y-3">
              {filteredItems ? (
                filteredItems.map((priceFeed) => <MobileDrawerTickerItem key={priceFeed.base} {...priceFeed} onClose={() => setOpen(false)} />)
              ) : (
                <>
                  <MobileDrawerTickerItem base="Solana" description="Solana / US Dollar" symbol="SOL/USD" onClose={() => setOpen(false)} />
                  <MobileDrawerTickerItem base="Bitcoin" description="Bitcoin / US Dollar" symbol="BTC/USD" onClose={() => setOpen(false)} />
                  <MobileDrawerTickerItem base="Sui" description="SUI / US Dollar" symbol="SUI/USD" onClose={() => setOpen(false)} />
                </>
              )}
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const MobileDrawerTickerItem = ({ symbol, description, base, onClose }: SimplePriceFeed & { onClose: () => void }) => {
  const router = useRouter();

  function onSelect() {
    router.push(`/?ticker=${symbol}`);
    track("ticker_command_item_selected", { base });
    onClose();
  }

  return (
    <Button onClick={onSelect} variant={"outline"} className="w-full py-2 text-start justify-start items-start h-auto">
      <span className="flex-col gap-px inline-flex items-start justify-start">
        <span className="text-lg">{base}</span>
        <span className="text-sm">{description}</span>
      </span>
    </Button>
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
