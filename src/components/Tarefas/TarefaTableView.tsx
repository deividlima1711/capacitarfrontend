import React, { useState, useEffect } from 'react';
import { Tarefa } from '../../types';
import { useApp } from '../../contexts/AppContext';
import TarefaResolucaoModal from './TarefaResolucaoModal';
import './Tarefas.css';

interface TarefaTableViewProps {
  tarefas: Tarefa[];
  onEdit: (tarefa: Tarefa) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const TarefaTableView: React.FC<TarefaTableViewProps> = ({ 
  tarefas, 
  onEdit, 
  onDelete, 
  canEdit, 
  canDelete 
}) => {
  const { usuarios, updateTarefa } = useApp();
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

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
    return (
      <span className={`chip-status ${statusInfo.class}`}>{statusInfo.label}</span>
    );
  };

  const handleStatusChange = (id: string, novoStatus: Tarefa['status']) => {
    updateTarefa(id, {
      status: novoStatus,
      progresso: novoStatus === 'concluido' ? 100 : novoStatus === 'em-andamento' ? 50 : 0
    });
  };

  const handleAbrirModal = (tarefa: Tarefa) => {
    setTarefaSelecionada(tarefa);
    setMostrarModal(true);
  };

  const handleFecharModal = () => {
    setMostrarModal(false);
    setTarefaSelecionada(null);
  };

  const getTempoDecorrido = (tarefa: Tarefa) => {
    if (!tarefa.dataInicio) return '-';
    const inicio = new Date(tarefa.dataInicio);
    const fim = tarefa.status === 'concluido' && tarefa.dataFim ? new Date(tarefa.dataFim) : new Date();
    const diffMs = fim.getTime() - inicio.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffM = Math.floor((diffMs / (1000 * 60)) % 60);
    return `${diffH}h ${diffM}m`;
  };

  // Cronômetro para tarefas em andamento
  useEffect(() => {
    const interval = setInterval(() => {
      // Força re-render para atualizar o tempo decorrido
      // (não é a forma mais eficiente, mas funciona para exibir o cronômetro)
      if (tarefas.some(t => t.status !== 'concluido')) {
        setTarefaSelecionada(t => t);
      }
    }, 60000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, [tarefas]);

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>Tarefas ({tarefas.length})</h2>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Status</th>
              <th>Responsável</th>
              <th>Progresso</th>
              <th>Prazo</th>
              <th>Tempo Decorrido</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {tarefas.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  <div className="empty-state">
                    <span className="material-icons">task</span>
                    <p>Nenhuma tarefa encontrada</p>
                    <small>Clique em "Nova Tarefa" para começar</small>
                  </div>
                </td>
              </tr>
            ) : (
              tarefas.map((tarefa) => (
                <tr key={tarefa.id}>
                  <td>
                    <div className="tarefa-title">
                      <strong>{tarefa.titulo}</strong>
                    </div>
                  </td>
                  <td>{getStatusBadge(tarefa.status)}</td>
                  <td>{getResponsavelNome(tarefa.responsavelId)}</td>
                  <td>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${tarefa.progresso}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{tarefa.progresso}%</span>
                    </div>
                  </td>
                  <td>{formatDate(tarefa.prazo)}</td>
                  <td>{getTempoDecorrido(tarefa)}</td>
                  <td>
                    <div className="acoes-rapidas">
                      <button
                        className="btn-sm btn-primary"
                        title="Editar"
                        onClick={() => onEdit(tarefa)}
                      >
                        <span className="material-icons">edit</span>
                      </button>
                      <button
                        className="btn-sm btn-success"
                        title="Visualizar"
                        onClick={() => handleAbrirModal(tarefa)}
                      >
                        <span className="material-icons">visibility</span>
                      </button>
                      <button
                        className="btn-sm btn-danger"
                        title="Excluir"
                        onClick={() => {
                          if (tarefa.processoId) {
                            alert('Essa tarefa não pode ser excluída, pois está relacionada a um processo.');
                            return;
                          }
                          onDelete(tarefa.id);
                        }}
                      >
                        <span className="material-icons">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TarefaResolucaoModal
        tarefa={tarefaSelecionada}
        aberto={mostrarModal}
        onClose={handleFecharModal}
        onStatusChange={novoStatus => {
          if (tarefaSelecionada) handleStatusChange(tarefaSelecionada.id, novoStatus);
        }}
      />
    </div>
  );
};

export default TarefaTableView;

