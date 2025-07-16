import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Tarefa, Processo, User, Anexo } from '../../types';
import UniversalAnexoManager from '../Anexos/UniversalAnexoManagerFinal';
import { usePermissions } from '../../hooks/usePermissions';

interface TarefaModalProps {
  isOpen: boolean;
  onClose: () => void;
  tarefa?: Tarefa;
}

const TarefaModal: React.FC<TarefaModalProps> = ({ isOpen, onClose, tarefa }) => {
  const { addTarefa, updateTarefa, processos, usuarios } = useApp();
  const { canEdit } = usePermissions();
  const [anexos, setAnexos] = useState<Anexo[]>([]);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    status: 'pendente',
    prioridade: 'media',
    dataInicio: '',
    prazo: '',
    processoId: '',
    responsavelId: '',
    progresso: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sincronizar anexos quando a tarefa muda
  useEffect(() => {
    if (tarefa?.anexos) {
      setAnexos(tarefa.anexos);
    } else {
      setAnexos([]);
    }
  }, [tarefa]);

  useEffect(() => {
    if (tarefa) {
      setFormData({
        titulo: tarefa.titulo,
        descricao: tarefa.descricao,
        status: tarefa.status,
        prioridade: tarefa.prioridade || 'media',
        dataInicio: tarefa.dataInicio,
        prazo: tarefa.prazo,
        processoId: tarefa.processoId?.toString() || '',
        responsavelId: tarefa.responsavelId?.toString() || '',
        progresso: tarefa.progresso || 0,
      });
      
      // Carregar anexos se for edição - o UniversalAnexoManager fará isso automaticamente
    } else {
      setFormData({
        titulo: '',
        descricao: '',
        status: 'pendente',
        prioridade: 'media',
        dataInicio: '',
        prazo: '',
        processoId: '',
        responsavelId: '',
        progresso: 0,
      });
      setAnexos([]);
    }
    setErrors({});
  }, [tarefa, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (!formData.dataInicio) {
      newErrors.dataInicio = 'Data de início é obrigatória';
    }

    if (!formData.prazo) {
      newErrors.prazo = 'Prazo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const tipoTarefa = formData.processoId && formData.processoId.trim() ? 'VINCULADA_PROCESSO' : 'INDEPENDENTE';
      console.log(`🔍 [TAREFA MODAL] Criando tarefa do tipo: ${tipoTarefa}`, {
        titulo: formData.titulo,
        processoId: formData.processoId,
        responsavelId: formData.responsavelId,
        tipoTarefa
      });
      
      // Construir objeto com tipos corretos, filtrando campos undefined
      const tarefaData: Partial<Tarefa> = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        status: formData.status as Tarefa['status'],
        dataInicio: formData.dataInicio,
        prazo: formData.prazo,
        prioridade: formData.prioridade as Tarefa['prioridade'],
        progresso: formData.progresso
      };

      // Adicionar processoId apenas se não estiver vazio
      if (formData.processoId && formData.processoId.trim() !== '') {
        tarefaData.processoId = formData.processoId;
        console.log('✅ [TAREFA MODAL] Tarefa VINCULADA ao processo:', formData.processoId);
      } else {
        console.log('ℹ️ [TAREFA MODAL] Tarefa INDEPENDENTE (relatórios, levantamentos, etc.)');
      }

      // Adicionar responsavelId apenas se não estiver vazio e for número válido
      if (formData.responsavelId && formData.responsavelId.trim() !== '') {
        const responsavelIdNum = parseInt(formData.responsavelId);
        if (!isNaN(responsavelIdNum)) {
          tarefaData.responsavelId = responsavelIdNum;
          console.log('✅ [TAREFA MODAL] Responsável atribuído:', responsavelIdNum);
        }
      }

      console.log('📤 [TAREFA MODAL] Dados finais para envio:', tarefaData);

      // Remove campos undefined explicitamente
      Object.keys(tarefaData).forEach(
        key => tarefaData[key as keyof typeof tarefaData] === undefined && delete tarefaData[key as keyof typeof tarefaData]
      );

      if (tarefa) {
        await updateTarefa(tarefa.id, tarefaData);
      } else {
        await addTarefa(tarefaData as Omit<Tarefa, 'id' | 'criadoEm' | 'atualizadoEm'>);
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      setErrors({ submit: 'Erro ao salvar tarefa. Tente novamente.' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{tarefa ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="titulo">Título *</label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Digite o título da tarefa"
              className={errors.titulo ? 'error' : ''}
            />
            {errors.titulo && <span className="error-message">{errors.titulo}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="descricao">Descrição *</label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              placeholder="Descreva a tarefa"
              rows={3}
              className={errors.descricao ? 'error' : ''}
            />
            {errors.descricao && <span className="error-message">{errors.descricao}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="pendente">Pendente</option>
                <option value="em-andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="prioridade">Prioridade</label>
              <select
                id="prioridade"
                name="prioridade"
                value={formData.prioridade}
                onChange={handleChange}
              >
                <option value="baixa">🟢 Baixa</option>
                <option value="media">🟡 Média</option>
                <option value="alta">🟠 Alta</option>
                <option value="urgente">🔴 Urgente</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dataInicio">Data de Início *</label>
              <input
                type="date"
                id="dataInicio"
                name="dataInicio"
                value={formData.dataInicio}
                onChange={handleChange}
                className={errors.dataInicio ? 'error' : ''}
              />
              {errors.dataInicio && <span className="error-message">{errors.dataInicio}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="prazo">Prazo *</label>
              <input
                type="date"
                id="prazo"
                name="prazo"
                value={formData.prazo}
                onChange={handleChange}
                className={errors.prazo ? 'error' : ''}
              />
              {errors.prazo && <span className="error-message">{errors.prazo}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="processoId">
                Processo 
                <span className="field-info">(opcional - deixe vazio para tarefas independentes)</span>
              </label>
              <select
                id="processoId"
                name="processoId"
                value={formData.processoId}
                onChange={handleChange}
              >
                <option value="">🔸 Tarefa Independente (sem processo)</option>
                {processos.map((processo: Processo) => (
                  <option key={processo.id} value={processo.id}>
                    📋 {processo.titulo}
                  </option>
                ))}
              </select>
              <small className="form-help">
                {formData.processoId ? 
                  '✅ Tarefa será vinculada ao processo selecionado' : 
                  'ℹ️ Tarefa independente (ex: relatórios, levantamentos, solicitações avulsas)'
                }
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="responsavelId">Responsável</label>
              <select
                id="responsavelId"
                name="responsavelId"
                value={formData.responsavelId}
                onChange={handleChange}
              >
                <option value="">Selecione um responsável (opcional)</option>
                {usuarios.map((usuario: User) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seção de Anexos - apenas para tarefas existentes */}
          {tarefa && (
            <div className="anexos-section">
              <UniversalAnexoManager
                entityType="tasks"
                entityId={tarefa.id}
                anexos={anexos}
                usuarios={usuarios}
                canEdit={canEdit('tarefas')}
                showPreview={true}
                onAnexosChange={setAnexos}
                onError={(error) => console.error('Erro no anexo:', error)}
              />
            </div>
          )}

          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {tarefa ? 'Atualizar' : 'Criar'} Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TarefaModal;