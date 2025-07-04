import React from 'react';
import { useRelatorios } from '../../hooks/useRelatorios';
import ResumoCards from './ResumoCards';
import Graficos from './Graficos';
import Filtros from './Filtros';
import TabelasDetalhadas from './TabelasDetalhadas';
import Exportacao from './Exportacao';
import './Relatorios.css';

const Relatorios: React.FC = () => {
  const {
    dadosFiltrados,
    filtros,
    setFiltros,
    limparFiltros,
    metricas,
    dadosGraficos,
    usuarios
  } = useRelatorios();

  // KPIs dinâmicos com base nos dados filtrados
  const totalProcessos = dadosFiltrados.processos.length;
  const concluidos = dadosFiltrados.processos.filter(p => p.status === 'concluido').length;
  const atrasados = dadosFiltrados.processos.filter(p => p.status === 'atrasado').length;
  const totalTarefas = dadosFiltrados.tarefas.length;
  const tarefasConcluidas = dadosFiltrados.tarefas.filter(t => t.status === 'concluido').length;
  const tarefasAtrasadas = dadosFiltrados.tarefas.filter(t => t.status === 'atrasado').length;

  // Taxa de conclusão: processos concluídos / total de processos
  const taxaConclusao = totalProcessos > 0 ? Math.round((concluidos / totalProcessos) * 100) : 0;
  // Tempo médio de execução: média do tempo gasto das tarefas concluídas
  const tarefasConcluidasArr = dadosFiltrados.tarefas.filter(t => t.status === 'concluido' && t.horasGastas && t.horasGastas > 0);
  const tempoMedioExecucao = tarefasConcluidasArr.length > 0 ?
    (tarefasConcluidasArr.reduce((acc, t) => acc + (t.horasGastas || 0), 0) / tarefasConcluidasArr.length).toFixed(1) : '0';
  // Produtividade média: tarefas concluídas / total de tarefas
  const produtividadeMedia = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;

  return (
    <div className="relatorios">
      {/* Header Moderno */}
      <div className="relatorios-header">
        <h1>📊 Relatórios Estratégicos</h1>
        <p>Dashboard executivo com análises de desempenho e produtividade</p>
      </div>

      {/* Filtros Modernos */}
      <Filtros 
        filtros={filtros}
        setFiltros={setFiltros}
        limparFiltros={limparFiltros}
        usuarios={usuarios.map(user => ({
          id: user.id,
          nome: user.nome,
          setor: user.departamento || 'Não informado'
        }))}
      />

      {/* Cards de Resumo */}
      <ResumoCards metricas={metricas} />

      {/* Gráficos Interativos */}
      <Graficos dadosGraficos={dadosGraficos} />

      {/* Exportação */}
      <Exportacao 
        dadosProcessos={dadosFiltrados.processos}
        dadosTarefas={dadosFiltrados.tarefas}
      />

      {/* Tabelas Detalhadas */}
      <TabelasDetalhadas 
        processos={dadosFiltrados.processos}
        tarefas={dadosFiltrados.tarefas}
      />

      {/* KPIs Avançados */}
      <div className="kpis-avancados">
        <h3>🎯 KPIs Avançados</h3>
        
        <div className="kpis-grid">
          <div className="kpi-card">
            <div className="kpi-valor">{taxaConclusao}%</div>
            <div className="kpi-label">Taxa de Conclusão</div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-valor">{tempoMedioExecucao}h</div>
            <div className="kpi-label">Tempo Médio de Execução</div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-valor">{produtividadeMedia}%</div>
            <div className="kpi-label">Produtividade Média</div>
          </div>
        </div>

        <div className="info-expansao">
          <p>
            <span>🚀</span>
            Módulo preparado para expansão com SLA por tarefa, processos por setor, tarefas por prioridade e KPIs personalizáveis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;

