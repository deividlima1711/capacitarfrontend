import React, { useState } from 'react';

interface TabelasDetalhadasProps {
  processos: any[];
  tarefas: any[];
}

const TabelasDetalhadas: React.FC<TabelasDetalhadasProps> = ({ processos, tarefas }) => {
  const [abaAtiva, setAbaAtiva] = useState<'processos' | 'tarefas'>('processos');

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      'Pendente': { class: 'status-pendente', icon: '⏳' },
      'Em Andamento': { class: 'status-em-andamento', icon: '🔄' },
      'Concluído': { class: 'status-concluido', icon: '✅' },
      'Atrasado': { class: 'status-atrasado', icon: '⚠️' }
    };
    const info = statusMap[status] || { class: 'status-pendente', icon: '⏳' };
    return <span className={`status-badge ${info.class}`}>{info.icon} {status}</span>;
  };

  const getProgressBar = (progresso: number) => (
    <div className="progress-bar">
      <div 
        className="progress-fill" 
        style={{ width: `${progresso}%` }}
      ></div>
    </div>
  );

  const getResponsavel = (responsavelId: number) => {
    // Busca o nome do responsável na lista de processos
    const found = processos.find((item: any) => item.responsavelId === responsavelId);
    return found && found.responsavel ? found.responsavel : responsavelId;
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <>
      {/* Tabela de Processos */}
      <div className="tabela-container">
        <div className="tabela-header">
          <h3>📋 Detalhes dos Processos</h3>
          <p>Mostrando {processos.length} de {processos.length} registros</p>
        </div>
        <div className="tabela-content">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Setor</th>
                <th>Responsável</th>
                <th>Progresso</th>
                <th>Data Início</th>
                <th>Data Fim</th>
              </tr>
            </thead>
            <tbody>
              {processos.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                    Nenhum processo encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                processos.map((processo, index) => (
                  <tr key={index}>
                    <td>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>
                        {processo.titulo}
                      </div>
                    </td>
                    <td>{getStatusBadge(processo.status)}</td>
                    <td>
                      <span style={{ 
                        color: processo.prioridade === 'Alta' ? '#dc2626' : 
                               processo.prioridade === 'Média' ? '#d97706' : '#059669',
                        fontWeight: '600'
                      }}>
                        {processo.prioridade}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#475569'
                      }}>
                        {processo.setor}
                      </span>
                    </td>
                    <td>{getResponsavel(processo.responsavelId)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getProgressBar(processo.progresso)}
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>
                          {processo.progresso}%
                        </span>
                      </div>
                    </td>
                    <td style={{ color: '#64748b' }}>{formatDate(processo.dataInicio)}</td>
                    <td style={{ color: '#64748b' }}>{formatDate(processo.dataFim)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabela de Tarefas */}
      <div className="tabela-container">
        <div className="tabela-header">
          <h3>✅ Detalhes das Tarefas</h3>
          <p>Mostrando {tarefas.length} de {tarefas.length} registros</p>
        </div>
        <div className="tabela-content">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Setor</th>
                <th>Responsável</th>
                <th>Tempo Estimado</th>
                <th>Tempo Gasto</th>
                <th>Data Início</th>
                <th>Data Fim</th>
              </tr>
            </thead>
            <tbody>
              {tarefas.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                    Nenhuma tarefa encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                tarefas.map((tarefa, index) => (
                  <tr key={index}>
                    <td>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>
                        {tarefa.titulo}
                      </div>
                    </td>
                    <td>{getStatusBadge(tarefa.status)}</td>
                    <td>
                      <span style={{ 
                        color: tarefa.prioridade === 'Alta' ? '#dc2626' : 
                               tarefa.prioridade === 'Média' ? '#d97706' : '#059669',
                        fontWeight: '600'
                      }}>
                        {tarefa.prioridade}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#475569'
                      }}>
                        {tarefa.setor}
                      </span>
                    </td>
                    <td>{getResponsavel(tarefa.responsavelId)}</td>
                    <td>
                      <span style={{ 
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        color: '#1e40af',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {tarefa.tempoEstimado}h
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        background: (tarefa.horasGastas || 0) === 0 ? 
                          'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' :
                          'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                        color: (tarefa.horasGastas || 0) === 0 ? '#6b7280' : '#065f46',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {tarefa.horasGastas || 0}h
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{formatDate(tarefa.dataInicio)}</td>
                    <td style={{ color: '#64748b' }}>{formatDate(tarefa.dataFim)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TabelasDetalhadas;

