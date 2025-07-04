import React from 'react';
import { Tarefa } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface TarefaKanbanViewProps {
  tarefas: Tarefa[];
  onEdit: (tarefa: Tarefa) => void;
  canEdit: boolean;
}

const TarefaKanbanView: React.FC<TarefaKanbanViewProps> = ({ tarefas, onEdit, canEdit }) => {
  const { usuarios, processos, updateTarefa } = useApp();

  const columns = [
    { id: 'pendente', title: 'Pendente', status: 'pendente' },
    { id: 'em-andamento', title: 'Em Andamento', status: 'em-andamento' },
    { id: 'concluido', title: 'Concluído', status: 'concluido' },
    { id: 'atrasado', title: 'Atrasado', status: 'atrasado' },
  ];

  const getTarefasByStatus = (status: string) => {
    return tarefas.filter(t => t.status === status);
  };

  const getResponsavelNome = (responsavelId: number) => {
    const usuario = usuarios.find(u => u.id === responsavelId);
    return usuario?.nome || 'Não atribuído';
  };

  const getProcessoNome = (processoId?: string) => {
    if (!processoId) return null;
    const processo = processos.find(p => p.id === processoId);
    return processo?.titulo || 'Processo não encontrado';
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

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'critica': return '#ff5630';
      case 'alta': return '#ffab00';
      case 'media': return '#4e91f9';
      case 'baixa': return '#36b37e';
      default: return '#6b778c';
    }
  };

  const formatHours = (hours?: number) => {
    if (!hours) return '-';
    return `${hours}h`;
  };

  const handleDragStart = (e: React.DragEvent, tarefa: Tarefa) => {
    e.dataTransfer.setData('text/plain', tarefa.id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const tarefaId = e.dataTransfer.getData('text/plain');
    const tarefa = tarefas.find(t => t.id === tarefaId);
    
    if (tarefa && tarefa.status !== newStatus) {
      updateTarefa(tarefaId, { 
        status: newStatus as any,
        dataFim: newStatus === 'concluido' ? new Date().toISOString() : undefined,
        progresso: newStatus === 'concluido' ? 100 : tarefa.progresso,
      });
    }
  };

  return (
    <div className="kanban-container active">
      {columns.map((column) => {
        const columnTarefas = getTarefasByStatus(column.status);
        
        return (
          <div 
            key={column.id} 
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <div className="kanban-column-header">
              <span>{column.title}</span>
              <span className="kanban-column-count">{columnTarefas.length}</span>
            </div>
            
            <div className="kanban-cards">
              {columnTarefas.map((tarefa) => (
                <div
                  key={tarefa.id}
                  className="kanban-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, tarefa)}
                  onClick={() => onEdit(tarefa)}
                >
                  <div className="kanban-card-header">
                    <h4 className="kanban-card-title">{tarefa.titulo}</h4>
                    <div 
                      className="priority-indicator"
                      style={{ backgroundColor: getPriorityColor(tarefa.prioridade) }}
                      title={`Prioridade: ${tarefa.prioridade}`}
                    ></div>
                  </div>
                  
                  {tarefa.descricao && (
                    <p className="kanban-card-description">
                      {tarefa.descricao.substring(0, 80)}
                      {tarefa.descricao.length > 80 ? '...' : ''}
                    </p>
                  )}
                  
                  <div className="kanban-card-progress">
                    <div className="progress-bar small">
                      <div 
                        className="progress-fill"
                        style={{ width: `${tarefa.progresso}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{tarefa.progresso}%</span>
                  </div>
                  
                  <div className="kanban-card-meta">
                    <div className="kanban-card-assignee">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/512/9131/9131546.png" 
                        alt="Avatar"
                        className="assignee-avatar"
                      />
                      <span>{getResponsavelNome(tarefa.responsavelId)}</span>
                    </div>
                    <div className="kanban-card-date">
                      <span className="material-icons">schedule</span>
                      {formatDate(tarefa.prazo)}
                    </div>
                  </div>
                  
                  {getProcessoNome(tarefa.processoId) && (
                    <div className="kanban-card-processo">
                      <span className="processo-tag">{getProcessoNome(tarefa.processoId)}</span>
                    </div>
                  )}

                  {(tarefa.estimativaHoras || tarefa.horasGastas) && (
                    <div className="kanban-card-time">
                      <span title="Estimativa">
                        <span className="material-icons" style={{ fontSize: '12px' }}>schedule</span>
                        {formatHours(tarefa.estimativaHoras)}
                      </span>
                      <span title="Gasto">
                        <span className="material-icons" style={{ fontSize: '12px' }}>timer</span>
                        {formatHours(tarefa.horasGastas)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              
              {columnTarefas.length === 0 && (
                <div className="kanban-empty">
                  <span className="material-icons">task</span>
                  <p>Nenhuma tarefa</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TarefaKanbanView;

