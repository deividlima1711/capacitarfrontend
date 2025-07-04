import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut, Pie, Bar } from 'react-chartjs-2';
import { ChartData } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartWidgetProps {
  title: string;
  type: 'line' | 'doughnut' | 'pie' | 'bar';
  data: ChartData;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ title, type, data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: false,
      },
    },
    scales: type === 'line' || type === 'bar' ? {
      y: {
        beginAtZero: true,
      },
    } : undefined,
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={data} options={options} />;
      case 'doughnut':
        return <Doughnut data={data} options={options} />;
      case 'pie':
        return <Pie data={data} options={options} />;
      case 'bar':
        return <Bar data={data} options={options} />;
      default:
        return null;
    }
  };

  return (
    <div className="widget">
      <div className="widget-header">
        <h3 className="widget-title">{title}</h3>
      </div>
      <div className="widget-content">
        <div className="chart-container">
          {renderChart()}
        </div>
      </div>
    </div>
  );
};

export default ChartWidget;

