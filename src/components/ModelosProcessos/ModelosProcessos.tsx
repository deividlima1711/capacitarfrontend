import React, { useState, useEffect } from 'react';
import { ModeloProcesso } from '../../types';
import ModelosList from './ModelosList';
import ModeloForm from './ModeloForm';
import ModeloDetails from './ModeloDetails';
import './ModelosProcessos.css';

const ModelosProcessos: React.FC = () => {
  const [modelos, setModelos] = useState<ModeloProcesso[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'form' | 'details'>('list');
  const [selectedModelo, setSelectedModelo] = useState<ModeloProcesso | null>(null);
  const [editingModelo, setEditingModelo] = useState<ModeloProcesso | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar modelos do localStorage
  useEffect(() => {
    const loadModelos = () => {
      try {
        const savedModelos = localStorage.getItem('pf_modelos_processos');
        if (savedModelos) {
          setModelos(JSON.parse(savedModelos));
        } else {
          // Inicializar com array vazio - dados serão carregados do backend
          setModelos([]);
        }
      } catch (error) {
        console.error('Erro ao carregar modelos:', error);
        setModelos([]);
      }
    };
    loadModelos();
  }, []);

  // Salvar modelos no localStorage sempre que houver mudanças
  const saveModelos = (newModelos: ModeloProcesso[]) => {
    try {
      localStorage.setItem('pf_modelos_processos', JSON.stringify(newModelos));
      setModelos(newModelos);
    } catch (error) {
      console.error('Erro ao salvar modelos:', error);
    }
  };

  const handleCreateModelo = () => {
    setEditingModelo(null);
    setCurrentView('form');
  };

  const handleEditModelo = (modelo: ModeloProcesso) => {
    setEditingModelo(modelo);
    setCurrentView('form');
  };

  const handleViewModelo = (modelo: ModeloProcesso) => {
    setSelectedModelo(modelo);
    setCurrentView('details');
  };

  const handleDeleteModelo = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este modelo?')) {
      const newModelos = modelos.filter(m => m.id !== id);
      saveModelos(newModelos);
    }
  };

  const handleSaveModelo = (modeloData: Omit<ModeloProcesso, 'id' | 'dataCriacao' | 'dataUltimaEdicao'>) => {
    const now = new Date().toISOString();
    
    if (editingModelo) {
      // Editando modelo existente
      const updatedModelo: ModeloProcesso = {
        ...editingModelo,
        ...modeloData,
        dataUltimaEdicao: now,
        totalAtividades: modeloData.atividades.length
      };
      
      const newModelos = modelos.map(m => m.id === editingModelo.id ? updatedModelo : m);
      saveModelos(newModelos);
    } else {
      // Criando novo modelo
      const newModelo: ModeloProcesso = {
        ...modeloData,
        id: Date.now(), // ID temporário
        dataCriacao: now,
        dataUltimaEdicao: now,
        totalAtividades: modeloData.atividades.length
      };
      
      const newModelos = [...modelos, newModelo];
      saveModelos(newModelos);
    }
    
    setCurrentView('list');
    setEditingModelo(null);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedModelo(null);
    setEditingModelo(null);
  };

  return (
    <div className="modelos-processos">
      {currentView === 'list' && (
        <ModelosList
          modelos={modelos}
          onCreateModelo={handleCreateModelo}
          onEditModelo={handleEditModelo}
          onViewModelo={handleViewModelo}
          onDeleteModelo={handleDeleteModelo}
          loading={loading}
        />
      )}
      
      {currentView === 'form' && (
        <ModeloForm
          modelo={editingModelo}
          onSave={handleSaveModelo}
          onCancel={handleBackToList}
          loading={loading}
        />
      )}
      
      {currentView === 'details' && selectedModelo && (
        <ModeloDetails
          modelo={selectedModelo}
          onEdit={() => handleEditModelo(selectedModelo)}
          onDelete={() => handleDeleteModelo(selectedModelo.id)}
          onBack={handleBackToList}
        />
      )}
    </div>
  );
};

export default ModelosProcessos;

