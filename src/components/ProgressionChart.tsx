'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartDataPoint {
  label: string;
  rank?: number;
  points?: number;
}

interface RankChartProps {
  data: ChartDataPoint[];
}

interface PointsChartProps {
  data: ChartDataPoint[];
}

export function RankChart({ data }: RankChartProps) {
  const maxRank = Math.max(...data.map((d) => d.rank ?? 1), 1);

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.08)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: '#999999', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            reversed
            domain={[1, maxRank]}
            tick={{ fill: '#999999', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#262626',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#F2F2F2',
            }}
            formatter={(value) => [`Rang ${value}`, '']}
            labelStyle={{ display: 'none' }}
          />
          <Line
            type="monotone"
            dataKey="rank"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ fill: '#8B5CF6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-center text-muted-foreground">
        Axe inversé — 1er en haut
      </p>
    </div>
  );
}

export function PointsChart({ data }: PointsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.08)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fill: '#999999', fontSize: 10 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#999999', fontSize: 10 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#262626',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#F2F2F2',
          }}
          formatter={(value) => [`${Number(value).toFixed(2)} pts moy.`, '']}
          labelStyle={{ display: 'none' }}
        />
        <Bar dataKey="points" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
