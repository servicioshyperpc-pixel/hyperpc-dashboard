import React from 'react';
import { Card } from '../../../core/components/Card.tsx';

interface SyncDataPoint {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

interface SyncChartProps {
  title?: string;
  data: SyncDataPoint[];
  showValues?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
  gray: 'bg-gray-500',
};

export const SyncChart: React.FC<SyncChartProps> = ({
  title = 'Progreso de Sincronización',
  data,
  showValues = true,
}) => {
  return (
    <Card
      header={
        <h3 className="font-semibold text-gray-900">{title}</h3>
      }
    >
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = Math.min((item.value / item.maxValue) * 100, 100);
          const colorClass = COLOR_MAP[item.color] || 'bg-orange-500';
          
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                {showValues && (
                  <span className="text-sm text-gray-500">
                    {item.value} / {item.maxValue}
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`${colorClass} h-2.5 rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-end mt-0.5">
                <span className="text-xs text-gray-400">{percentage.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
        
        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No hay datos de sincronización</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SyncChart;
