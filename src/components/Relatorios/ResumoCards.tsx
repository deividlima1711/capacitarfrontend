import React from 'react';

interface ResumoCardsProps {
  metricas: {
    processosEmAndamento: number;
    processosConcluidos: number;
    processosAtrasados: number;
    tarefasConcluidas: number;
    tarefasAtrasadas: number;
    totalProcessos: number;
    totalTarefas: number;
  };
}

const ResumoCards: React.FC<ResumoCardsProps> = ({ metricas }) => {
  const cards = [
    {
      titulo: 'Processos em Andamento',
      valor: metricas.processosEmAndamento,
      tendencia: '+12%',
      tipo: 'positiva',
      icone: '🚀',
      gradiente: 'primary'
    },
    {
      titulo: 'Processos Concluídos',
      valor: metricas.processosConcluidos,
      tendencia: '+8%',
      tipo: 'positiva',
      icone: '✅',
      gradiente: 'success'
    },
    {
      titulo: 'Processos Atrasados',
      valor: metricas.processosAtrasados,
      tendencia: '-5%',
      tipo: 'negativa',
      icone: '⚠️',
      gradiente: 'warning'
    },
    {
      titulo: 'Tarefas Concluídas',
      valor: metricas.tarefasConcluidas,
      tendencia: '+15%',
      tipo: 'positiva',
      icone: '📋',
      gradiente: 'secondary'
    }
  ];

  return (
    <div className="resumo-cards">
      {cards.map((card, index) => (
        <div key={index} className="resumo-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h3>{card.titulo}</h3>
            <span style={{ fontSize: '1.5rem' }}>{card.icone}</span>
          </div>
          
          <div className="valor">{card.valor}</div>
          
          <div className={`tendencia ${card.tipo}`}>
            <span className="icone">
              {card.tipo === 'positiva' ? '↗️' : '↘️'}
            </span>
            <span>{card.tendencia}</span>
            <span style={{ color: '#64748b', fontWeight: 'normal' }}>vs mês anterior</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResumoCards;

