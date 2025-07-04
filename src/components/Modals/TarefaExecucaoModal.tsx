import React from 'react';
import styles from './Modal.module.css';
import { Tarefa } from '../../types';

interface TarefaExecucaoModalProps {
  tarefa: Tarefa | null;
  aberto: boolean;
  onClose: () => void;
  onStatusChange?: (novoStatus: Tarefa['status']) => void;
}

const getStatusBadge = (status: Tarefa['status']) => {
  switch (status) {
    case 'pendente': return <span className="chip-status pendente">Pendente</span>;
    case 'em-andamento': return <span className="chip-status em-andamento">Em Andamento</span>;
    case 'concluido': return <span className="chip-status concluido">Concluído</span>;
    case 'atrasado': return <span className="chip-status atrasado">Atrasado</span>;
    default: return <span className="chip-status">{status}</span>;
  }
};

const TarefaExecucaoModal: React.FC<TarefaExecucaoModalProps> = ({ tarefa, aberto, onClose, onStatusChange }) => {
  if (!aberto || !tarefa?.id) return null;

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['modal']} style={{ minWidth: 350, maxWidth: 500 }}>
        <button className={styles['modal-close']} onClick={onClose}>&times;</button>
        <div className="tarefa-item" style={{ boxShadow: 'none', border: 'none', margin: 0 }}>
          <div className="tarefa-content">
            <h4>{tarefa.titulo}</h4>
            <div className="tarefa-meta">
              <span className="tarefa-status">
                Status: {getStatusBadge(tarefa.status)}
              </span>
              <span className="tarefa-prazo">
                Prazo: {new Date(tarefa.prazo).toLocaleDateString('pt-BR')}
              </span>
              <span className="tarefa-responsavel">
                Responsável: {tarefa.responsavelId}
              </span>
            </div>
            {tarefa.descricao && (
              <p className="tarefa-descricao">{tarefa.descricao}</p>
            )}
            <div className="tarefa-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${tarefa.progresso}%` }}
                ></div>
              </div>
              <span className="progress-text">{tarefa.progresso}%</span>
            </div>
            <div className="tarefa-status-controls">
              <label>Alterar Status:</label>
              <div className="status-buttons">
                <button 
                  className={`btn-status ${tarefa.status === 'pendente' ? 'active' : ''}`}
                  onClick={() => onStatusChange && onStatusChange('pendente')}
                >📋 Pendente</button>
                <button 
                  className={`btn-status ${tarefa.status === 'em-andamento' ? 'active' : ''}`}
                  onClick={() => onStatusChange && onStatusChange('em-andamento')}
                >⚡ Em Andamento</button>
                <button 
                  className={`btn-status ${tarefa.status === 'concluido' ? 'active' : ''}`}
                  onClick={() => onStatusChange && onStatusChange('concluido')}
                >✅ Concluído</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarefaExecucaoModal;
