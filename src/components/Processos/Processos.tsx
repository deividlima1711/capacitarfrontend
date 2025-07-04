import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Processo } from '../../types';
import ProcessoModal from '../Modals/ProcessoModal';
import ProcessoDetalhesModal from '../Modals/ProcessoDetalhesModal';
import KanbanView from './KanbanView';
import TableView from './TableView';
import './Processos.css';

const Processos: React.FC = () => {
  const { processos, tarefas, deleteProcesso, updateProcesso } = useApp(); // ✅ Inclui tarefas
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProcesso, setEditingProcesso] = useState<Processo | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);

  const handleNewProcesso = () => {
    setEditingProcesso(null);
    setModalOpen(true);
  };

  const handleEditProcesso = (processo: Processo) => {
    setEditingProcesso(processo);
    setModalOpen(true);
  };

  const handleDeleteProcesso = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este processo?')) {
      deleteProcesso(id);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProcesso(null);
  };

  const handleDetailsProcesso = (processo: Processo) => {
    setSelectedProcesso(processo);
    setDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedProcesso(null);
  };

  const handleStatusChange = (processo: Processo, novoStatus: string) => {
    updateProcesso(processo.id, { status: novoStatus as 'pendente' | 'em-andamento' | 'concluido' | 'atrasado' });
  };

  // ✅ Atualiza automaticamente o status para "concluido" se 100% das tarefas forem finalizadas
  useEffect(() => {
    processos.forEach(processo => {
      const tarefasDoProcesso = tarefas.filter(t => t.processoId === processo.id);
      if (tarefasDoProcesso.length > 0) {
        const concluidas = tarefasDoProcesso.filter(t => t.status === 'concluido').length;
        if (concluidas === tarefasDoProcesso.length && processo.status !== 'concluido') {
          updateProcesso(processo.id, { status: 'concluido' });
        }
      }
    });
  }, [processos, tarefas]);

  return (
    <div className="processos">
      <div className="processos-header">
        <h1 className="processos-title">Gerenciamento de Processos</h1>
        <button className="btn btn-primary" onClick={handleNewProcesso}>
          <span className="material-icons">add</span>
          Novo Processo
        </button>
      </div>

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

      {viewMode === 'table' ? (
        <TableView
          processos={processos}
          tarefas={tarefas}
          onEdit={handleEditProcesso}
          onDelete={handleDeleteProcesso}
          onDetails={handleDetailsProcesso}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <KanbanView
          processos={processos}
          onEdit={handleEditProcesso}
        />
      )}

      {modalOpen && (
        <ProcessoModal
          processo={editingProcesso}
          onClose={handleCloseModal}
        />
      )}

      <ProcessoDetalhesModal
        processo={selectedProcesso}
        isOpen={detailsModalOpen}
        onClose={handleCloseDetailsModal}
      />
    </div>
  );
};

export default Processos;
