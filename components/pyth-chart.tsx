"use client";

import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Benchmark } from "@/lib/pyth";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { Triangle } from "lucide-react";
import { ComponentProps, use, useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { CategoricalChartState } from "recharts/types/chart/types";
import { Dot, Props } from "recharts/types/shape/Dot";

type TooltipDataAtomData = {
  tooltipVisible: boolean;
  value: number | null;
  type: string;
};

const tooltipDataAtom = atom<TooltipDataAtomData>({
  tooltipVisible: false,
  value: null,
  type: "undefined",
});

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

function calculateYAxisDomain(minValue: number, maxValue: number): [number, number] {
  // Ensure minValue is always smaller than maxValue
  if (minValue > maxValue) {
    [minValue, maxValue] = [maxValue, minValue];
  }

  // Find the appropriate scale
  const range = maxValue - minValue;
  const scale = Math.pow(10, Math.floor(Math.log10(range)));

  // Calculate nice round numbers for min and max
  const niceMin = Math.floor(minValue / scale) * scale;
  const niceMax = Math.ceil(maxValue / scale) * scale;

  return [niceMin, niceMax];
}

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

  const setTooltipData = useSetAtom(tooltipDataAtom);

  const handleMouseEnter = () => setTooltipData({ tooltipVisible: true, value: null, type: "mouse enter" });
  const handleMouseLeave = () => setTooltipData({ tooltipVisible: false, value: null, type: "mouse leave" });

  const handleMouseMove = (coords: CategoricalChartState) => {
    if (coords.activePayload && coords.isTooltipActive) {
      setTooltipData((before) => {
        return { tooltipVisible: before.tooltipVisible, value: (coords.activePayload!.at(0).value ?? 0) as number, type: "mouse move" };
      });
    }
  };

  const gradientOffset = useMemo(() => {
    return 100 - ((formattedData[0].close - minValue) / (maxValue - minValue)) * 100;
  }, [formattedData]);

  return (
    <>
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[400px] w-full"
        onMouseEnter={handleMouseEnter}
        onTouchStart={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchEnd={handleMouseLeave}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{
              top: 0,
              right: 0,
              left: 0,
              bottom: 0,
            }}
            onMouseMove={(e) => handleMouseMove(e)}
          >
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              className="translate-y-4"
              tick={({ x, y, payload }) => <XAxisTick x={x} y={y} payload={payload} />}
              tickCount={20}
              interval={Math.floor(formattedData.length / 5)}
            />
            <YAxis
              axisLine={false}
              allowDataOverflow
              mirror
              tickLine={false}
              scale={"linear"}
              domain={calculateYAxisDomain(minValue, maxValue)}
              tick={({ x, y, payload }) => <YAxisTick x={x} y={y} payload={payload} />}
            />
            <ChartTooltipAtomWrapper />
            <defs>
              <linearGradient id="splitColor" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset={`${gradientOffset}%`} stopColor={chartConfig.up.color} />
                <stop offset={`${gradientOffset}%`} stopColor={chartConfig.down.color} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="5 5" vertical={false} />
            <Line
              type="monotone"
              dataKey="close"
              stroke={"url(#splitColor)"}
              strokeWidth={2}
              dot={false}
              activeDot={(props: ComponentProps<typeof Dot>) => {
                const actualProps = props as Props & { value: number };
                return (
                  <circle cx={props.cx} cy={props.cy} r={4} strokeWidth={0} fill={actualProps.value >= formattedData[0].close ? chartConfig.up.color : chartConfig.down.color} />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <div className="absolute md:right-4 md:top-4 right-0 top-0">
        <LastPriceAtomWrapper firstValue={benchmark.c[0]} value={benchmark.c.at(-1) ?? 0} />
      </div>
    </>
  );
};

const ChartTooltipAtomWrapper = (props: ComponentProps<typeof ChartTooltip>) => {
  const { active, cursor, ...rest } = props;
  const { tooltipVisible: isTooltipVisible } = useAtomValue(tooltipDataAtom);

  return (
    <ChartTooltip
      active={isTooltipVisible}
      //this doesnt work anyways
      cursor={{ stroke: "#29BDAD", strokeDasharray: "5 5" }}
      {...rest}
      content={<></>}
    />
  );
};

//What the fuck?
ChartTooltipAtomWrapper.displayName = ChartTooltip.displayName;
ChartTooltipAtomWrapper.defaultProps = {
  ...ChartTooltip.defaultProps,
  active: false,
  cursor: { stroke: "#29BDAD", strokeDasharray: "5 5" },
};

interface AxisTickProps {
  x: number;
  y: number;
  payload: { value: number };
}

const XAxisTick = (props: AxisTickProps) => {
  const { x, y, payload } = props;
  const { tooltipVisible: isTooltipVisible } = useAtomValue(tooltipDataAtom);
  return (
    <motion.g
      animate={isTooltipVisible ? "hover" : "initial"}
      initial="initial"
      variants={{
        initial: { opacity: 0 },
        hover: { opacity: x < 50 ? 0 : 1 },
      }}
      transition={{ duration: 0.3 }}
      className={"pointer-events-none select-none"}
    >
      <text className="" x={x} y={y} dy={0} textAnchor="center" fontFamily="var(--font-mono)">
        {new Date(payload.value).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </text>
    </motion.g>
  );
};

const YAxisTick = (props: AxisTickProps) => {
  const { x, y, payload } = props;
  const { tooltipVisible: isTooltipVisible } = useAtomValue(tooltipDataAtom);
  return (
    <motion.g
      animate={isTooltipVisible ? "hover" : "initial"}
      initial="initial"
      variants={{
        initial: { opacity: 0 },
        hover: { opacity: 1 },
      }}
      transition={{ duration: 0.3 }}
      className={"pointer-events-none select-none"}
    >
      <text x={x} y={y} dy={2} textAnchor="start" fontFamily="var(--font-mono)">
        {payload.value.toLocaleString("en-US", {
          minimumFractionDigits: payload.value > 10_000 ? 0 : 2,
          maximumFractionDigits: payload.value > 10_000 ? 0 : 2,
          currency: "USD",
          style: "currency",
        })}
      </text>
    </motion.g>
  );
};

interface LastPriceProps {
  firstValue: number;
  value: number;
}

const LastPriceAtomWrapper = (props: LastPriceProps) => {
  const { firstValue, value } = props;

  const { value: tooltipValue, tooltipVisible } = useAtomValue(tooltipDataAtom);

  return <LastPrice firstValue={firstValue} value={tooltipVisible ? tooltipValue ?? value : value} />;
};

const LastPrice = (props: LastPriceProps) => {
  const { firstValue, value } = props;

  const percentageChange = useMemo(() => {
    return ((value - firstValue) / firstValue) * 100;
  }, [firstValue, value]);

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
      {value.toLocaleString("en-US", { style: "currency", currency: "USD" }) ?? "Loading..."}
    </span>
  );
};
