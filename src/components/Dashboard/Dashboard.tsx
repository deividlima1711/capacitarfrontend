import React, { useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import StatCard from './StatCard';
import TaskWidget from './TaskWidget';
import ChartWidget from '../Charts/ChartWidget';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { estatisticas, tarefas, processos, user, updateEstatisticas } = useApp();

  useEffect(() => {
    updateEstatisticas();
  }, [processos, tarefas]); // Removido updateEstatisticas das dependências

  const quickActions = [
    {
      id: 'minhas-tarefas',
      label: 'Minhas Tarefas',
      icon: 'assignment_ind',
      count: tarefas.filter(t => t.responsavelId === user?.id && t.status !== 'concluido').length,
    },
    {
      id: 'processos-ativos',
      label: 'Processos Ativos',
      icon: 'assignment_turned_in',
      count: processos.filter(p => p.status === 'em-andamento').length,
    },
    {
      id: 'tarefas-atrasadas',
      label: 'Tarefas Atrasadas',
      icon: 'assignment_late',
      count: tarefas.filter(t => {
        if (!t.prazo || t.status === 'concluido') return false;
        try {
          const prazo = new Date(t.prazo);
          const hoje = new Date();
          return prazo < hoje;
        } catch (error) {
          return false;
        }
      }).length,
    },
  ];

  const minhasTarefasPendentes = tarefas
    .filter(t => t.responsavelId === user?.id && t.status === 'pendente')
    .slice(0, 5);

  // Dados para gráficos
  const processosStatusData = {
    labels: ['Em Andamento', 'Pendente', 'Concluído', 'Atrasado'],
    datasets: [{
      label: 'Processos',
      data: [
        processos.filter(p => p.status === 'em-andamento').length,
        processos.filter(p => p.status === 'pendente').length,
        processos.filter(p => p.status === 'concluido').length,
        processos.filter(p => p.status === 'atrasado').length,
      ],
      backgroundColor: ['#ffab00', '#4e91f9', '#4ecb71', '#ff5630'],
    }],
  };

  const tarefasStatusData = {
    labels: ['Pendente', 'Em Andamento', 'Concluído'],
    datasets: [{
      label: 'Tarefas',
      data: [
        tarefas.filter(t => t.status === 'pendente').length,
        tarefas.filter(t => t.status === 'em-andamento').length,
        tarefas.filter(t => t.status === 'concluido').length,
      ],
      backgroundColor: ['#ffab00', '#4e91f9', '#4ecb71'],
    }],
  };

  // Dados para gráfico de linha (últimos 30 dias)
  const getLast30DaysData = () => {
    const days = [];
    const data = [];
    const hoje = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(hoje);
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
      
      // Contar tarefas concluídas neste dia
      const tarefasDoDia = tarefas.filter(t => {
        if (!t.dataFim) return false;
        try {
          const dataFim = new Date(t.dataFim);
          return dataFim.toDateString() === date.toDateString();
        } catch (error) {
          return false;
        }
      }).length;
      
      data.push(tarefasDoDia);
    }

    return {
      labels: days,
      datasets: [{
        label: 'Tarefas Concluídas',
        data: data,
        borderColor: '#4ecb71',
        backgroundColor: 'rgba(78, 203, 113, 0.1)',
        tension: 0.4,
      }],
    };
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard de Processos</h1>
      </div>

      {/* Ações Rápidas */}
      <div className="quick-actions">
        {quickActions.map((action) => (
          <button key={action.id} className="quick-action-btn">
            <span className="material-icons quick-action-icon">{action.icon}</span>
            {action.label}
            {action.count > 0 && <span className="quick-action-count">{action.count}</span>}
          </button>
        ))}
      </div>

      {/* Estatísticas */}
      <div className="stats-grid">
        <StatCard
          icon="assignment"
          iconColor="blue"
          value={estatisticas.processosAtivos}
          label="Processos Ativos"
          trend={estatisticas.tendencias.processosAtivos}
          trendDirection="up"
        />
        <StatCard
          icon="check_circle"
          iconColor="yellow"
          value={estatisticas.tarefasPendentes}
          label="Tarefas Pendentes"
          trend={estatisticas.tendencias.tarefasPendentes}
          trendDirection="down"
        />
        <StatCard
          icon="schedule"
          iconColor="green"
          value={estatisticas.tempoMedio}
          label="Tempo Médio Conclusão"
          trend={estatisticas.tendencias.tempoMedio}
          trendDirection="up"
        />
        <StatCard
          icon="error_outline"
          iconColor="red"
          value={estatisticas.processosAtrasados}
          label="Processos Atrasados"
          trend={estatisticas.tendencias.processosAtrasados}
          trendDirection="down"
        />
      </div>

      {/* Widgets */}
      <div className="widgets-grid">
        <ChartWidget
          title="Progresso dos Processos"
          type="doughnut"
          data={processosStatusData}
        />
        <TaskWidget
          title="Minhas Tarefas Pendentes"
          tasks={minhasTarefasPendentes}
        />
      </div>

      {/* Gráficos Adicionais */}
      <div className="widgets-grid">
        <ChartWidget
          title="Tarefas por Status"
          type="pie"
          data={tarefasStatusData}
        />
        <ChartWidget
          title="Tarefas Concluídas (Últimos 30 dias)"
          type="line"
          data={getLast30DaysData()}
        />
      </div>
    </div>
  );
};

export default Dashboard;

