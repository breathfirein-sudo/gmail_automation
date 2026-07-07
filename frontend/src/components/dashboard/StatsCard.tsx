import { ReactNode } from 'react';
import clsx from 'clsx';

interface StatsCardProps {
  id: string;
  title: string;
  value: string | number;
  icon: ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'teal' | 'red';
  delta?: string;
}

const colorMap = {
  blue:   { bg: 'bg-blue-500/10',   ring: 'ring-blue-500/20',   icon: 'text-blue-400',   value: 'text-blue-300' },
  green:  { bg: 'bg-green-500/10',  ring: 'ring-green-500/20',  icon: 'text-green-400',  value: 'text-green-300' },
  yellow: { bg: 'bg-yellow-500/10', ring: 'ring-yellow-500/20', icon: 'text-yellow-400', value: 'text-yellow-300' },
  orange: { bg: 'bg-orange-500/10', ring: 'ring-orange-500/20', icon: 'text-orange-400', value: 'text-orange-300' },
  purple: { bg: 'bg-purple-500/10', ring: 'ring-purple-500/20', icon: 'text-purple-400', value: 'text-purple-300' },
  teal:   { bg: 'bg-teal-500/10',   ring: 'ring-teal-500/20',   icon: 'text-teal-400',   value: 'text-teal-300' },
  red:    { bg: 'bg-red-500/10',    ring: 'ring-red-500/20',    icon: 'text-red-400',    value: 'text-red-300' },
};

export default function StatsCard({ id, title, value, icon, color, delta }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div id={id} className="card-hover flex flex-col gap-3 p-5 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#8b949e] uppercase tracking-wider">{title}</p>
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center ring-1', c.bg, c.ring)}>
          <span className={c.icon}>{icon}</span>
        </div>
      </div>
      <div>
        <p className={clsx('text-2xl font-bold', c.value)}>{value}</p>
        {delta && <p className="text-xs text-[#6e7681] mt-1">{delta}</p>}
      </div>
    </div>
  );
}
