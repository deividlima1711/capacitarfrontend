import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Tarefa } from '../../types';
import TarefaModal from '../Modals/TarefaModal';
import TarefaTableView from './TarefaTableView';
import TarefaKanbanView from './TarefaKanbanView';
import TarefaResolucaoModal from './TarefaResolucaoModal';
import './Tarefas.css';

const Tarefas: React.FC = () => {
  const { tarefas, deleteTarefa } = useApp();
  const { filterUserTasks, canCreate, canEdit, canDelete } = usePermissions();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<Tarefa | null>(null);
  
  // Estado para modal de resolução de tarefa (navegação via notificação)
  const [tarefaResolucaoModal, setTarefaResolucaoModal] = useState(false);
  const [tarefaSelecionadaResolucao, setTarefaSelecionadaResolucao] = useState<Tarefa | null>(null);

  // 🔍 Log dos status reais (para depuração)
  useEffect(() => {
    console.log('🔍 Tarefas carregadas:');
    tarefas.forEach(tarefa => {
      console.log(`- ${tarefa.titulo} | status: ${tarefa.status}`);
    });
  }, [tarefas]);

  // Escutar eventos de navegação de notificações
  useEffect(() => {
    const handleOpenTaskModal = (event: CustomEvent) => {
      const { taskId } = event.detail;
      const tarefa = tarefas.find(t => t.id === taskId);
      
      if (tarefa) {
        console.log(`🔗 Abrindo modal da tarefa ${taskId} via notificação`);
        setTarefaSelecionadaResolucao(tarefa);
        setTarefaResolucaoModal(true);
      } else {
        console.warn(`⚠️ Tarefa ${taskId} não encontrada`);
      }
    };

    // Adicionar listener para eventos customizados
    window.addEventListener('openTaskModal', handleOpenTaskModal as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('openTaskModal', handleOpenTaskModal as EventListener);
    };
  }, [tarefas]);

  // Exibe todas as tarefas do contexto, sem filtro restritivo
  const filteredTarefas = tarefas.sort((a, b) => {
    if (a.status === 'em-andamento' && b.status === 'concluido') return -1;
    if (a.status === 'concluido' && b.status === 'em-andamento') return 1;
    return 0;
  });

  const handleNewTarefa = () => {
    if (!canCreate('tarefas')) {
      alert('Você não tem permissão para criar tarefas.');
      return;
    }
    setEditingTarefa(null);
    setModalOpen(true);
  };

  const handleEditTarefa = (tarefa: Tarefa) => {
    if (!canEdit('tarefas')) {
      alert('Você não tem permissão para editar tarefas.');
      return;
    }
    setEditingTarefa(tarefa);
    setModalOpen(true);
  };

  const handleDeleteTarefa = (id: string) => {
    if (!canDelete('tarefas')) {
      alert('Você não tem permissão para excluir tarefas.');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteTarefa(id);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTarefa(null);
  };

  const handleCloseResolucaoModal = () => {
    setTarefaResolucaoModal(false);
    setTarefaSelecionadaResolucao(null);
  };

  return (
    <div className="tarefas">
      <div className="tarefas-header">
        <h1 className="tarefas-title">Gerenciamento de Tarefas</h1>
        {canCreate('tarefas') && (
          <button className="btn btn-primary" onClick={handleNewTarefa}>
            <span className="material-icons">add</span>
            Nova Tarefa
          </button>
        )}
      </div>

      {/* View Selector */}
      <div className="view-selector">
        <button
          className={`view-selector-item ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
        >
          <span className="material-icons">table_view</span>
          Tabela
        </button>
        <button
          className={`view-selector-item ${viewMode === 'kanban' ? 'active' : ''}`}
          onClick={() => setViewMode('kanban')}
        >
          <span className="material-icons">view_kanban</span>
          Kanban
        </button>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <TarefaTableView
          tarefas={filteredTarefas}
          onEdit={handleEditTarefa}
          onDelete={handleDeleteTarefa}
          canEdit={canEdit('tarefas')}
          canDelete={canDelete('tarefas')}
        />
      ) : (
        <TarefaKanbanView
          tarefas={filteredTarefas}
          onEdit={handleEditTarefa}
          canEdit={canEdit('tarefas')}
        />
      )}

      {/* Modal */}
      {modalOpen && (
        <TarefaModal
          isOpen={modalOpen}
          tarefa={editingTarefa ?? undefined}
          onClose={handleCloseModal}
        />
      )}

      {/* Modal de Resolução de Tarefa (navegação via notificação) */}
      {tarefaResolucaoModal && tarefaSelecionadaResolucao && (
        <TarefaResolucaoModal
          tarefa={tarefaSelecionadaResolucao}
          aberto={tarefaResolucaoModal}
          onClose={handleCloseResolucaoModal}
          onStatusChange={(novoStatus: Tarefa['status']) => {
            // Implementar mudança de status aqui se necessário
            console.log(`Alterando status da tarefa ${tarefaSelecionadaResolucao.id} para ${novoStatus}`);
          }}
        />
      )}
    </div>
  );
};

export default Tarefas;
