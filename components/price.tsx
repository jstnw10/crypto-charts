"use client";

import { Benchmark } from "@/lib/pyth";
import { cn } from "@/lib/utils";
import { Triangle } from "lucide-react";
import { use, useMemo } from "react";

interface LastPriceProps {
  benchmark: Promise<Benchmark>;
}

export const LastPrice = (props: LastPriceProps) => {
  const benchmark = use(props.benchmark);

  const percentageChange = useMemo(() => {
    const firstValue = benchmark.c[0];
    const lastValue = benchmark.c.at(-1) ?? 0;

    return ((lastValue - firstValue) / firstValue) * 100;
  }, [benchmark]);

  const isTrendingUp = percentageChange > 0;

  return (
    <span className="font-mono text-sm md:text-lg inline-flex flex-row items-center gap-2">
      <span>
        <Triangle
          className={cn("size-3", {
            "fill-chart-2 stroke-chart-2": isTrendingUp,
            "fill-chart-5 stroke-chart-5 rotate-180": !isTrendingUp,
          })}
        />
      </span>
      <span className={cn({ "text-chart-2": isTrendingUp, "text-chart-5": !isTrendingUp })}>{percentageChange.toFixed(2)}%</span>
      <span>|</span>
      {benchmark.c.at(-1)?.toLocaleString("en-US", { style: "currency", currency: "USD" }) ?? "Loading..."}
    </span>
  );
};
