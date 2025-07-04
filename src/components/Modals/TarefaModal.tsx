import React, { useState, useEffect } from 'react';
import { Tarefa } from '../../types';
import { useApp } from '../../contexts/AppContext';
import './Modal.css';
import MultiUserSelect from './MultiUserSelect';

interface TarefaModalProps {
  tarefa?: Tarefa | null;
  onClose: () => void;
}

const TarefaModal: React.FC<TarefaModalProps> = ({ tarefa, onClose }) => {
  const { addTarefa, updateTarefa, usuarios, processos } = useApp();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    status: 'pendente' as 'pendente' | 'em-andamento' | 'concluido' | 'atrasado',
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'critica',
    responsavelId: 0,
    processoId: '',
    dataInicio: '',
    prazo: '',
    progresso: 0,
    estimativaHoras: 0,
    horasGastas: 0,
    tags: [] as string[],
  });
  const [multiUsers, setMultiUsers] = useState<number[]>([]);
  const [anexos, setAnexos] = useState<File[]>([]);

  useEffect(() => {
    if (tarefa) {
      setFormData({
        titulo: tarefa.titulo,
        descricao: tarefa.descricao,
        status: tarefa.status,
        prioridade: tarefa.prioridade,
        responsavelId: tarefa.responsavelId,
        processoId: tarefa.processoId || '',
        dataInicio: tarefa.dataInicio ? tarefa.dataInicio.split('T')[0] : '',
        prazo: tarefa.prazo ? tarefa.prazo.split('T')[0] : '',
        progresso: tarefa.progresso,
        estimativaHoras: tarefa.estimativaHoras || 0,
        horasGastas: tarefa.horasGastas || 0,
        tags: tarefa.tags || [],
      });
    }
  }, [tarefa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.responsavelId || !formData.prazo) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    const tarefaData = {
      ...formData,
      dataInicio: formData.dataInicio ? new Date(formData.dataInicio).toISOString() : new Date().toISOString(),
      prazo: formData.prazo ? new Date(formData.prazo).toISOString() : new Date().toISOString(),
      processoId: formData.processoId || undefined,
    };

    if (tarefa) {
      updateTarefa(tarefa.id, tarefaData);
    } else {
      addTarefa(tarefaData);
    }

    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'responsavelId' || name === 'progresso' || name === 'estimativaHoras' || name === 'horasGastas' 
        ? parseInt(value) || 0 
        : value,
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleMultiUsersChange = (ids: number[]) => setMultiUsers(ids);

  const handleAnexosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAnexos(Array.from(e.target.files));
    }
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{tarefa ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button className="btn-fechar" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="titulo">Título *</label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="descricao">Descrição</label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
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
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="responsavelId">Responsável *</label>
              <select
                id="responsavelId"
                name="responsavelId"
                value={formData.responsavelId}
                onChange={handleChange}
                required
              >
                <option value={0}>Selecione um responsável</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="multiUsers">Atribuir para outros usuários</label>
              <MultiUserSelect
                usuarios={usuarios}
                value={multiUsers}
                onChange={handleMultiUsersChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="processoId">Processo (Opcional)</label>
              <select
                id="processoId"
                name="processoId"
                value={formData.processoId}
                onChange={handleChange}
              >
                <option value={0}>Nenhum processo</option>
                {processos.map(processo => (
                  <option key={processo.id} value={processo.id}>
                    {processo.titulo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dataInicio">Data de Início</label>
              <input
                type="date"
                id="dataInicio"
                name="dataInicio"
                value={formData.dataInicio}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="prazo">Prazo *</label>
              <input
                type="date"
                id="prazo"
                name="prazo"
                value={formData.prazo}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="progresso">Progresso (%)</label>
              <input
                type="number"
                id="progresso"
                name="progresso"
                value={formData.progresso}
                onChange={handleChange}
                min="0"
                max="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="estimativaHoras">Estimativa (horas)</label>
              <input
                type="number"
                id="estimativaHoras"
                name="estimativaHoras"
                value={formData.estimativaHoras}
                onChange={handleChange}
                min="0"
                step="0.5"
                placeholder="Ex: 8"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="horasGastas">Horas Gastas</label>
            <input
              type="number"
              id="horasGastas"
              name="horasGastas"
              value={formData.horasGastas}
              onChange={handleChange}
              min="0"
              step="0.5"
              placeholder="Ex: 4.5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (separadas por vírgula)</label>
            <input
              type="text"
              id="tags"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              placeholder="Ex: urgente, frontend, revisão"
            />
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label htmlFor="anexos">Anexar Arquivo</label>
            <label htmlFor="anexos" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f4f5f7', color: '#172b4d', border: '1px solid #dfe1e6', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 15, cursor: 'pointer', transition: 'background 0.2s', marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>📎</span>
              Selecionar Arquivo
              <input
                type="file"
                id="anexos"
                multiple
                style={{ display: 'none' }}
                onChange={handleAnexosChange}
              />
            </label>
            {anexos.length > 0 && (
              <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none', fontSize: 14 }}>
                {anexos.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn">
              {tarefa ? 'Atualizar' : 'Criar'} Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TarefaModal;

