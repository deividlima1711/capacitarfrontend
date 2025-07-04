import React from 'react';
import { Processo, Tarefa } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface TableViewProps {
  processos: Processo[];
  tarefas: Tarefa[];
  onEdit: (processo: Processo) => void;
  onDelete: (id: string) => void;
  onDetails: (processo: Processo) => void;
  onStatusChange: (processo: Processo, novoStatus: string) => void;
}

const TableView: React.FC<TableViewProps> = ({ processos, tarefas, onEdit, onDelete, onDetails, onStatusChange }) => {
  const { usuarios } = useApp();

  const getResponsavelNome = (responsavelId: number) => {
    const usuario = usuarios.find(u => u.id === responsavelId);
    return usuario?.nome || 'Não atribuído';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não definida';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pendente': { class: 'pendente', label: 'Pendente' },
      'em-andamento': { class: 'in-progress', label: 'Em Andamento' },
      'concluido': { class: 'completed', label: 'Concluído' },
      'atrasado': { class: 'delayed', label: 'Atrasado' },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pendente;
    return <span className={`chip-status ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  const getPriorityBadge = (prioridade: string) => {
    const priorityMap = {
      'baixa': { class: 'low', label: 'Baixa' },
      'media': { class: 'medium', label: 'Média' },
      'alta': { class: 'high', label: 'Alta' },
      'critica': { class: 'critical', label: 'Crítica' },
    };

    const priorityInfo = priorityMap[prioridade as keyof typeof priorityMap] || priorityMap.media;
    return <span className={`priority-badge ${priorityInfo.class}`}>{priorityInfo.label}</span>;
  };

  const calcularProgresso = (processoId: string): number => {
    const tarefasDoProcesso = tarefas.filter(t => t.processoId === processoId);
    if (tarefasDoProcesso.length === 0) return 0;
    const concluidas = tarefasDoProcesso.filter(t => t.status === 'concluido').length;
    return Math.round((concluidas / tarefasDoProcesso.length) * 100);
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Processos ({processos.length})</h2>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Status</th>
              <th>Prioridade</th>
              <th>Responsável</th>
              <th>Progresso</th>
              <th>Prazo</th>
              <th>Categoria</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {processos.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-empty">
                  <div className="empty-state">
                    <span className="material-icons">assignment</span>
                    <p>Nenhum processo encontrado</p>
                    <small>Clique em "Novo Processo" para começar</small>
                  </div>
                </td>
              </tr>
            ) : (
              processos.map((processo) => {
                const progresso = calcularProgresso(processo.id);
                const tarefasDoProcesso = tarefas.filter(t => t.processoId === processo.id);
                const tarefasConcluidas = tarefasDoProcesso.filter(t => t.status === 'concluido');

                // Calcula o status visual dinamicamente
                let statusCalculado = processo.status;
                if (progresso === 100) {
                  statusCalculado = 'concluido';
                } else if (progresso > 0) {
                  statusCalculado = 'em-andamento';
                } else {
                  statusCalculado = 'pendente';
                }

                return (
                  <tr key={processo.id}>
                    <td>
                      <div className="processo-title">
                        <strong>{processo.titulo}</strong>
                        {processo.descricao && (
                          <small>{processo.descricao.substring(0, 50)}...</small>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(statusCalculado)}</td>
                    <td>{getPriorityBadge(processo.prioridade)}</td>
                    <td>
                      <div className="user-avatar small">
                        <img 
                          src="https://cdn-icons-png.flaticon.com/512/9131/9131546.png" 
                          alt="Avatar" 
                        />
                        <span>{getResponsavelNome(processo.responsavelId)}</span>
                      </div>
                    </td>
                    <td>
                      <div
                        className="progress-container"
                        title={`${tarefasConcluidas.length} de ${tarefasDoProcesso.length} tarefas concluídas`}
                      >
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${progresso}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{progresso}%</span>
                      </div>
                    </td>
                    <td>{formatDate(processo.prazo)}</td>
                    <td>
                      <span className="categoria-badge">{processo.categoria}</span>
                    </td>
                    <td>
                      <div className="acoes-rapidas">
                        <button className="btn-action btn-success" title="Concluir" onClick={() => onStatusChange(processo, 'concluido')} disabled={processo.status === 'concluido'}>✅</button>
                        <button className="btn-action btn-warning" title="Pausar" onClick={() => onStatusChange(processo, 'pausado')}>⏰</button>
                        <button className="btn-action btn-alert" title="Marcar como Atrasado" onClick={() => onStatusChange(processo, 'atrasado')}>⚠️</button>
                        <button className="btn-action btn-primary" title="Editar" onClick={() => onEdit(processo)}>✏️</button>
                        <button className="btn-action btn-info" title="Detalhes" onClick={() => onDetails(processo)}>👁️</button>
                        <button className="btn-action btn-danger" title="Excluir" onClick={() => onDelete(processo.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;
