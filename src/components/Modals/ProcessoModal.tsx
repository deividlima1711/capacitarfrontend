import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Select, { MultiValue } from 'react-select';
import { Processo, ModeloProcesso } from '../../types';
import { useApp } from '../../contexts/AppContext';
import './Modal.css';

interface ProcessoModalProps {
  processo?: Processo | null;
  onClose: () => void;
}

type UsuarioOption = {
  value: number;
  label: string;
};

const ProcessoModal: React.FC<ProcessoModalProps> = ({ processo, onClose }) => {
  const { addProcesso, updateProcesso, usuarios, addTarefa, addNotification } = useApp();

  const [modelos, setModelos] = useState<ModeloProcesso[]>([]);
  const [selectedModelo, setSelectedModelo] = useState<ModeloProcesso | null>(null);
  const [usuariosEnvolvidosSelecionados, setUsuariosEnvolvidosSelecionados] = useState<UsuarioOption[]>([]);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    status: 'pendente' as 'pendente' | 'em-andamento' | 'concluido' | 'atrasado',
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'critica',
    responsavelId: 0,
    dataInicio: '',
    prazo: '',
    progresso: 0,
    categoria: '',
    tags: [] as string[],
  });

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  useEffect(() => {
    try {
      const savedModelos = localStorage.getItem('pf_modelos_processos');
      if (savedModelos) {
        const modelosData = JSON.parse(savedModelos);
        setModelos(modelosData.filter((modelo: ModeloProcesso) => modelo.ativo));
      }
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
    }
  }, []);

  useEffect(() => {
    if (processo) {
      setFormData({
        titulo: processo.titulo,
        descricao: processo.descricao,
        status: processo.status,
        prioridade: processo.prioridade,
        responsavelId: processo.responsavelId,
        dataInicio: processo.dataInicio ? processo.dataInicio.split('T')[0] : '',
        prazo: processo.prazo ? processo.prazo.split('T')[0] : '',
        progresso: processo.progresso,
        categoria: processo.categoria,
        tags: processo.tags || [],
      });

      if (processo.envolvidos) {
        setUsuariosEnvolvidosSelecionados(
          processo.envolvidos.map(id => {
            const user = usuarios.find(u => u.id === id);
            return user ? { value: user.id, label: user.nome } : null;
          }).filter(Boolean) as UsuarioOption[]
        );
      }
    }
  }, [processo, usuarios]);

  const handleModeloChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modeloId = parseInt(e.target.value);
    if (selectedModelo?.id === modeloId) return;

    if (modeloId === 0) {
      setSelectedModelo(null);
      setFormData(prev => ({
        ...prev,
        titulo: '',
        descricao: '',
        categoria: ''
      }));
      return;
    }

    const modelo = modelos.find(m => m.id === modeloId);
    if (modelo) {
      setSelectedModelo(modelo);
      setFormData(prev => ({
        ...prev,
        titulo: modelo.nome,
        descricao: `Processo baseado no modelo: ${modelo.nome}\n\nAtividades:\n${modelo.atividades.map((ativ, index) => `${index + 1}. ${ativ.nome}`).join('\n')}`,
        categoria: 'Baseado em Modelo'
      }));
    }
  };

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  const name = target.name;
  const value = target.value;

  setFormData(prev => ({
    ...prev,
    [name]: name === 'responsavelId' || name === 'progresso' ? parseInt(value) : value,
  }));
};


  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const criarTarefasDoModelo = (processoId: string, modelo: ModeloProcesso) => {
    modelo.atividades.forEach((atividade, index) => {
      const dataInicio = new Date(formData.dataInicio || new Date());
      const prazoAtividade = new Date(dataInicio);
      prazoAtividade.setDate(prazoAtividade.getDate() + (index + 1) * 7);

      const novaTarefa = {
        titulo: atividade.nome,
        descricao: atividade.descricao || `Atividade do modelo: ${modelo.nome}`,
        status: 'pendente' as const,
        prioridade: 'media' as const,
        responsavelId: formData.responsavelId,
        processoId,
        dataInicio: formatDate(dataInicio),
        prazo: formatDate(prazoAtividade),
        progresso: 0,
        estimativaHoras: 8,
        horasGastas: 0,
        tags: [`modelo-${modelo.nome.toLowerCase().replace(/\s+/g, '-')}`],
        modeloOrigem: {
          modeloId: modelo.id,
          modeloNome: modelo.nome,
          atividadeOriginal: atividade,
          cargosExecutores: atividade.cargosExecutores || [],
          usuariosAdicionais: atividade.usuariosAdicionais || [],
          anexos: atividade.anexos || []
        }
      };

      addTarefa(novaTarefa);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      alert('O título é obrigatório!');
      return;
    }

    if (!formData.responsavelId || formData.responsavelId === 0) {
      alert('Selecione um responsável!');
      return;
    }

    if (!formData.prazo) {
      alert('O prazo é obrigatório!');
      return;
    }

    if (formData.dataInicio && new Date(formData.prazo) < new Date(formData.dataInicio)) {
      alert('O prazo não pode ser anterior à data de início.');
      return;
    }

    const processoData = {
      ...formData,
      dataInicio: formData.dataInicio ? new Date(formData.dataInicio).toISOString() : new Date().toISOString(),
      prazo: new Date(formData.prazo).toISOString(),
      envolvidos: usuariosEnvolvidosSelecionados.map(u => u.value),
    };

    let processoId = processo?.id;
    let processoTitulo = formData.titulo;

    if (processo) {
      updateProcesso(processo.id, processoData);
    } else {
      const novoProcesso: Processo = await addProcesso(processoData);
      processoId = novoProcesso.id;
      processoTitulo = novoProcesso.titulo;
      if (selectedModelo) {
        criarTarefasDoModelo(novoProcesso.id, selectedModelo);
      }
    }

    // Notificar usuários atribuídos
    usuariosEnvolvidosSelecionados.forEach(usuario => {
      addNotification({
        usuarioId: usuario.value,
        titulo: 'Atribuição de Processo',
        mensagem: `Você foi atribuído ao processo: ${processoTitulo}`,
        tipo: 'info',
        lida: false
      });
    });

    alert(`Processo ${processo ? 'atualizado' : 'criado'} com sucesso!`);
    onClose();
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{processo ? 'Editar Processo' : 'Novo Processo'}</h2>
          <button className="btn-fechar" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!processo && modelos.length > 0 && (
            <div className="form-group modelo-selector">
              <label htmlFor="modelo">Usar Modelo de Processo</label>
              <select
                id="modelo"
                value={selectedModelo?.id || 0}
                onChange={handleModeloChange}
              >
                <option value={0}>Criar processo do zero</option>
                {modelos.map(modelo => (
                  <option key={modelo.id} value={modelo.id}>
                    {modelo.nome} ({modelo.totalAtividades} atividades)
                  </option>
                ))}
              </select>
              {selectedModelo && (
                <div className="modelo-info">
                  <small>
                    <strong>Modelo selecionado:</strong> {selectedModelo.nome}<br />
                    <strong>Atividades:</strong> {selectedModelo.totalAtividades}<br />
                    <strong>Criado por:</strong> {selectedModelo.criadoPor}
                  </small>
                </div>
              )}
            </div>
          )}

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
              rows={selectedModelo ? 8 : 3}
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
            <label>Atribuir usuários ao processo</label>
            <Select<UsuarioOption, true>
              className="react-select-container"
              classNamePrefix="react-select"
              isMulti
              options={usuarios.map(u => ({
                value: u.id,
                label: u.nome,
              }))}
              value={usuariosEnvolvidosSelecionados}
              onChange={(newValue: MultiValue<UsuarioOption>) =>
                setUsuariosEnvolvidosSelecionados(newValue as UsuarioOption[])
              }
              placeholder="Selecione usuários envolvidos"
            />
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
              <label htmlFor="categoria">Categoria</label>
              <input
                type="text"
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                placeholder="Ex: Desenvolvimento, Marketing"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (separadas por vírgula)</label>
            <input
              type="text"
              id="tags"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              placeholder="Ex: urgente, cliente-vip, revisão"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn">
              {processo ? 'Atualizar' : 'Criar'} Processo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessoModal;
