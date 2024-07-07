"use client";

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Benchmark } from "@/lib/pyth";
import { use, useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface PythChartProps {
  benchmark: Promise<Benchmark>;
}

const chartConfig = {
  close: {
    label: "Close",
    color: "hsl(var(--chart-1))",
  },
  down: {
    color: "hsl(var(--chart-5))",
  },
  up: {
    color: "hsl(var(--chart-2))",
  },
  date: {
    label: "Date",
  },
} satisfies ChartConfig;

export const PythChart = (props: PythChartProps) => {
  const benchmark = use(props.benchmark);

  const formattedData = useMemo(
    () =>
      benchmark.t.map((time, index) => ({
        open: benchmark.o[index],
        high: benchmark.h[index],
        low: benchmark.l[index],
        close: benchmark.c[index],
        volume: benchmark.v[index],
        date: new Date(time * 1000).toISOString(),
      })),
    [benchmark]
  );

  const minValue = useMemo(() => Math.min(...formattedData.map((item) => Math.min(item.open, item.close))), [formattedData]);
  const maxValue = useMemo(() => Math.max(...formattedData.map((item) => Math.max(item.open, item.close))), [formattedData]);

  const percentageChange = useMemo(() => {
    if (formattedData.length === 0) return 0;

    const firstValue = formattedData[0].close;
    const lastValue = formattedData.at(-1)?.close ?? 0;

    return ((lastValue - firstValue) / firstValue) * 100;
  }, [formattedData]);

  const isTrendingUp = percentageChange > 0;

  function calculateYAxisDomain(minValue: number, maxValue: number): [number, number] {
    // Helper function to get the number of digits before the decimal point
    const getDigits = (num: number): number => Math.floor(Math.log10(Math.abs(num))) + 1;

    // Calculate the order of magnitude for rounding
    const digits = Math.max(getDigits(minValue), getDigits(maxValue)) - 1;
    const roundTo = Math.pow(10, digits);

    // Round down the min and up the max
    const roundedMin = Math.floor(minValue / roundTo) * roundTo;
    const roundedMax = Math.ceil(maxValue / roundTo) * roundTo;

    // Calculate the domain bounds and ensure they are integers
    const lowerBound = Math.max(0, Math.floor(roundedMin));
    const upperBound = Math.ceil(roundedMax);

    return [lowerBound, upperBound];
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{
            top: 20,
            right: 30,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="5 5" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickCount={5}
            domain={calculateYAxisDomain(minValue, maxValue)}
            tickFormatter={(value: number) =>
              `${value.toLocaleString("en-US", {
                minimumFractionDigits: value > 10_000 ? 0 : 2,
                maximumFractionDigits: value > 10_000 ? 0 : 2,
                currency: "USD",
                style: "currency",
              })}`
            }
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-[150px]"
                labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
            }
          />
          <Line type="monotone" dataKey="close" stroke={isTrendingUp ? chartConfig.up.color : chartConfig.down.color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
