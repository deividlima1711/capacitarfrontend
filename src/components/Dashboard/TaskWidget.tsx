import React from 'react';
import { Tarefa } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface TaskWidgetProps {
  title: string;
  tasks: Tarefa[];
}

const TaskWidget: React.FC<TaskWidgetProps> = ({ title, tasks }) => {
  const { updateTarefa, usuarios } = useApp();

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    updateTarefa(taskId, {
      status: completed ? 'concluido' : 'pendente',
      dataFim: completed ? new Date().toISOString() : undefined,
    });
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

  return (
    <div className="widget">
      <div className="widget-header">
        <h3 className="widget-title">{title}</h3>
      </div>
      <div className="widget-content">
        <div className="task-list">
          {tasks.length === 0 ? (
            <div className="task-empty">
              <span className="material-icons">check_circle</span>
              <p>Nenhuma tarefa pendente</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="task-item">
                <div className="task-checkbox">
                  <input
                    type="checkbox"
                    id={`task-${task.id}`}
                    checked={task.status === 'concluido'}
                    onChange={(e) => handleTaskToggle(task.id, e.target.checked)}
                  />
                  <label htmlFor={`task-${task.id}`}></label>
                </div>
                <div className="task-content">
                  <p className="task-title">{task.titulo}</p>
                  <div className="task-meta">
                    <span className="task-responsible">
                      {getResponsavelNome(task.responsavelId)}
                    </span>
                    <span className="task-separator">•</span>
                    <span className="task-deadline">
                      Prazo: {formatDate(task.prazo)}
                    </span>
                    <span className="task-separator">•</span>
                    <span 
                      className="task-priority"
                      style={{ color: getPriorityColor(task.prioridade) }}
                    >
                      {task.prioridade.charAt(0).toUpperCase() + task.prioridade.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskWidget;

