import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface GraficoCardProps {
  titulo: string;
  children: React.ReactNode;
  className?: string;
}

const GraficoCard: React.FC<GraficoCardProps> = ({ titulo, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{titulo}</h3>
      <div className="h-80">
        {children}
      </div>
    </div>
  );
};

interface GraficosProps {
  dadosGraficos: {
    statusDistribuicao: any;
    tarefasPorUsuario: any;
    evolucaoMensal: any;
  };
}

const Graficos: React.FC<GraficosProps> = ({ dadosGraficos }) => {
  const opcoesComuns = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const opcoesPizza = {
    ...opcoesComuns,
    plugins: {
      ...opcoesComuns.plugins,
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  const opcoesBarras = {
    ...opcoesComuns,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const opcoesLinha = {
    ...opcoesComuns,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    },
    elements: {
      point: {
        radius: 6,
        hoverRadius: 8
      }
    }
  };

  const isStatusEmpty = dadosGraficos.statusDistribuicao.datasets[0].data.every((v: number) => v === 0);
  const isTarefasEmpty = dadosGraficos.tarefasPorUsuario.datasets[0].data.every((v: number) => v === 0);
  const isEvolucaoEmpty = dadosGraficos.evolucaoMensal.datasets[0].data.every((v: number) => v === 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      <GraficoCard titulo="Distribuição de Status dos Processos">
        {isStatusEmpty ? (
          <div style={{textAlign:'center',color:'#888',padding:'2rem'}}>Sem dados para exibir.</div>
        ) : (
          <Pie data={dadosGraficos.statusDistribuicao} options={opcoesPizza} />
        )}
      </GraficoCard>

      <GraficoCard titulo="Volume de Tarefas por Usuário">
        {isTarefasEmpty ? (
          <div style={{textAlign:'center',color:'#888',padding:'2rem'}}>Sem dados para exibir.</div>
        ) : (
          <Bar data={dadosGraficos.tarefasPorUsuario} options={opcoesBarras} />
        )}
      </GraficoCard>

      <GraficoCard titulo="Evolução Mensal de Processos Concluídos" className="lg:col-span-2 xl:col-span-1">
        {isEvolucaoEmpty ? (
          <div style={{textAlign:'center',color:'#888',padding:'2rem'}}>Sem dados para exibir.</div>
        ) : (
          <Line data={dadosGraficos.evolucaoMensal} options={opcoesLinha} />
        )}
      </GraficoCard>
    </div>
  );
};

export default Graficos;

