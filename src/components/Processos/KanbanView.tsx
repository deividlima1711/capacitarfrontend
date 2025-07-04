import React from 'react';
import { Processo } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface KanbanViewProps {
  processos: Processo[];
  onEdit: (processo: Processo) => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({ processos, onEdit }) => {
  const { usuarios, updateProcesso } = useApp();

  const columns = [
    { id: 'pendente', title: 'Pendente', status: 'pendente' },
    { id: 'em-andamento', title: 'Em Andamento', status: 'em-andamento' },
    { id: 'concluido', title: 'Concluído', status: 'concluido' },
    { id: 'atrasado', title: 'Atrasado', status: 'atrasado' },
  ];

  const getProcessosByStatus = (status: string) => {
    return processos.filter(p => p.status === status);
  };

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

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'critica': return '#ff5630';
      case 'alta': return '#ffab00';
      case 'media': return '#4e91f9';
      case 'baixa': return '#36b37e';
      default: return '#6b778c';
    }
  };

  const handleDragStart = (e: React.DragEvent, processo: Processo) => {
    e.dataTransfer.setData('text/plain', processo.id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const processoId = e.dataTransfer.getData('text/plain');
    const processo = processos.find(p => p.id === processoId);
    
    if (processo && processo.status !== newStatus) {
      updateProcesso(processoId, { 
        status: newStatus as any,
        dataFim: newStatus === 'concluido' ? new Date().toISOString() : undefined,
      });
    }
  };

  return (
    <div className="kanban-container active">
      {columns.map((column) => {
        const columnProcessos = getProcessosByStatus(column.status);
        
        return (
          <div 
            key={column.id} 
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <div className="kanban-column-header">
              <span>{column.title}</span>
              <span className="kanban-column-count">{columnProcessos.length}</span>
            </div>
            
            <div className="kanban-cards">
              {columnProcessos.map((processo) => (
                <div
                  key={processo.id}
                  className="kanban-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, processo)}
                  onClick={() => onEdit(processo)}
                >
                  <div className="kanban-card-header">
                    <h4 className="kanban-card-title">{processo.titulo}</h4>
                    <div 
                      className="priority-indicator"
                      style={{ backgroundColor: getPriorityColor(processo.prioridade) }}
                      title={`Prioridade: ${processo.prioridade}`}
                    ></div>
                  </div>
                  
                  {processo.descricao && (
                    <p className="kanban-card-description">
                      {processo.descricao.substring(0, 80)}
                      {processo.descricao.length > 80 ? '...' : ''}
                    </p>
                  )}
                  
                  <div className="kanban-card-progress">
                    <div className="progress-bar small">
                      <div 
                        className="progress-fill"
                        style={{ width: `${processo.progresso}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{processo.progresso}%</span>
                  </div>
                  
                  <div className="kanban-card-meta">
                    <div className="kanban-card-assignee">
                      <img 
                        src="https://cdn-icons-png.flaticon.com/512/9131/9131546.png" 
                        alt="Avatar"
                        className="assignee-avatar"
                      />
                      <span>{getResponsavelNome(processo.responsavelId)}</span>
                    </div>
                    <div className="kanban-card-date">
                      <span className="material-icons">schedule</span>
                      {formatDate(processo.prazo)}
                    </div>
                  </div>
                  
                  {processo.categoria && (
                    <div className="kanban-card-category">
                      <span className="categoria-tag">{processo.categoria}</span>
                    </div>
                  )}
                </div>
              ))}
              
              {columnProcessos.length === 0 && (
                <div className="kanban-empty">
                  <span className="material-icons">assignment</span>
                  <p>Nenhum processo</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanView;

