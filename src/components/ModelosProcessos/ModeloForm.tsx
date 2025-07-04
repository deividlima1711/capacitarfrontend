import React, { useState, useEffect } from 'react';
import { ModeloProcesso, AtividadeModelo } from '../../types';

interface ModeloFormProps {
  modelo: ModeloProcesso | null;
  onSave: (modelo: Omit<ModeloProcesso, 'id' | 'dataCriacao' | 'dataUltimaEdicao'>) => void;
  onCancel: () => void;
  loading: boolean;
}

const ModeloForm: React.FC<ModeloFormProps> = ({
  modelo,
  onSave,
  onCancel,
  loading
}) => {
  const [nome, setNome] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [atividades, setAtividades] = useState<AtividadeModelo[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [anexos, setAnexos] = useState<File[]>([]);
  const [showAnexosModal, setShowAnexosModal] = useState(false);

  useEffect(() => {
    if (modelo) {
      setNome(modelo.nome);
      setAtivo(modelo.ativo);
      setAtividades([...modelo.atividades]);
      // No useEffect, se modelo tiver anexos futuramente, pode-se popular aqui
    } else {
      setNome('');
      setAtivo(true);
      setAtividades([]);
    }
  }, [modelo]);

  const addAtividade = () => {
    const newAtividade: AtividadeModelo = {
      id: Date.now(),
      nome: '',
      ordem: atividades.length + 1,
      cargosExecutores: [],
      usuariosAdicionais: [],
      descricao: ''
    };
    setAtividades([...atividades, newAtividade]);
  };

  const updateAtividade = (index: number, field: keyof AtividadeModelo, value: any) => {
    const updatedAtividades = [...atividades];
    updatedAtividades[index] = {
      ...updatedAtividades[index],
      [field]: value
    };
    setAtividades(updatedAtividades);
  };

  const removeAtividade = (index: number) => {
    const updatedAtividades = atividades.filter((_, i) => i !== index);
    // Reordenar as atividades
    updatedAtividades.forEach((atividade, i) => {
      atividade.ordem = i + 1;
    });
    setAtividades(updatedAtividades);
  };

  const moveAtividade = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === atividades.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedAtividades = [...atividades];
    
    // Trocar posições
    [updatedAtividades[index], updatedAtividades[newIndex]] = 
    [updatedAtividades[newIndex], updatedAtividades[index]];
    
    // Atualizar ordem
    updatedAtividades.forEach((atividade, i) => {
      atividade.ordem = i + 1;
    });
    
    setAtividades(updatedAtividades);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!nome.trim()) {
      newErrors.nome = 'Nome do modelo é obrigatório';
    }

    if (atividades.length === 0) {
      newErrors.atividades = 'Pelo menos uma atividade é obrigatória';
    }

    atividades.forEach((atividade, index) => {
      if (!atividade.nome.trim()) {
        newErrors[`atividade_${index}_nome`] = 'Nome da atividade é obrigatório';
      }
      if (atividade.cargosExecutores.length === 0) {
        newErrors[`atividade_${index}_cargos`] = 'Pelo menos um cargo executor é obrigatório';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const modeloData = {
      nome: nome.trim(),
      ativo,
      criadoPor: 'Usuário Atual', // Em um sistema real, viria do contexto
      ultimaEdicaoPor: 'Usuário Atual',
      totalAtividades: atividades.length,
      atividades
    };

    onSave(modeloData);
  };

  const handleAnexosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAnexos(Array.from(e.target.files));
    }
  };

  const cargosDisponiveis = [
    'Coordenador Pedagógico',
    'Gerente',
    'Supervisor',
    'Analista',
    'Assistente',
    'Diretor'
  ];

  return (
    <div className="modelo-form">
      <div className="form-header">
        <h2>{modelo ? 'Editar Modelo' : 'Novo Modelo'}</h2>
        <button className="btn-secondary" onClick={onCancel}>
          <span className="material-icons">arrow_back</span>
          Voltar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-section">
          <h3>Informações Básicas</h3>
          <div className="form-group">
            <label htmlFor="nome">Nome do Modelo *</label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={errors.nome ? 'error' : ''}
              placeholder="Digite o nome do modelo"
            />
            {errors.nome && <span className="error-message">{errors.nome}</span>}
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              Modelo ativo
            </label>
          </div>
          <div className="form-group">
            <label htmlFor="anexos">Anexos do Modelo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              <button
                type="button"
                title="Visualizar anexos"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0052cc', fontSize: 22, marginBottom: 8 }}
                onClick={() => setShowAnexosModal(true)}
                disabled={anexos.length === 0}
              >
                <span className="material-icons">visibility</span>
              </button>
            </div>
            {anexos.length > 0 && (
              <ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none', fontSize: 14 }}>
                {anexos.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            )}
            <small>Adicione anexos descritivos para facilitar a execução do processo.</small>
            {showAnexosModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAnexosModal(false)}>
                <div style={{ background: '#fff', borderRadius: 8, padding: 24, minWidth: 320, maxWidth: 400, boxShadow: '0 4px 16px rgba(0,0,0,0.13)' }} onClick={e => e.stopPropagation()}>
                  <h3 style={{ marginTop: 0 }}>Anexos do Modelo</h3>
                  <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                    {anexos.map((file, idx) => (
                      <li key={idx} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="material-icons" style={{ fontSize: 18, color: '#0052cc' }}>description</span>
                        <span>{file.name}</span>
                      </li>
                    ))}
                  </ul>
                  <button style={{ marginTop: 16 }} className="btn btn-primary" onClick={() => setShowAnexosModal(false)}>Fechar</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Atividades do Modelo</h3>
            <button
              type="button"
              className="btn-primary"
              onClick={addAtividade}
            >
              <span className="material-icons">add</span>
              Adicionar Atividade
            </button>
          </div>

          {errors.atividades && (
            <div className="error-message">{errors.atividades}</div>
          )}

          <div className="atividades-list">
            {atividades.map((atividade, index) => (
              <div key={atividade.id} className="atividade-card">
                <div className="atividade-header">
                  <span className="atividade-order">#{atividade.ordem}</span>
                  <div className="atividade-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => moveAtividade(index, 'up')}
                      disabled={index === 0}
                      title="Mover para cima"
                    >
                      <span className="material-icons">keyboard_arrow_up</span>
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => moveAtividade(index, 'down')}
                      disabled={index === atividades.length - 1}
                      title="Mover para baixo"
                    >
                      <span className="material-icons">keyboard_arrow_down</span>
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-danger"
                      onClick={() => removeAtividade(index)}
                      title="Remover atividade"
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </div>
                </div>

                <div className="atividade-content">
                  <div className="form-group">
                    <label>Nome da Atividade *</label>
                    <input
                      type="text"
                      value={atividade.nome}
                      onChange={(e) => updateAtividade(index, 'nome', e.target.value)}
                      className={errors[`atividade_${index}_nome`] ? 'error' : ''}
                      placeholder="Digite o nome da atividade"
                    />
                    {errors[`atividade_${index}_nome`] && (
                      <span className="error-message">{errors[`atividade_${index}_nome`]}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Cargos Executores *</label>
                    <select
                      multiple
                      value={atividade.cargosExecutores}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        updateAtividade(index, 'cargosExecutores', values);
                      }}
                      className={errors[`atividade_${index}_cargos`] ? 'error' : ''}
                    >
                      {cargosDisponiveis.map(cargo => (
                        <option key={cargo} value={cargo}>{cargo}</option>
                      ))}
                    </select>
                    {errors[`atividade_${index}_cargos`] && (
                      <span className="error-message">{errors[`atividade_${index}_cargos`]}</span>
                    )}
                    <small>Segure Ctrl/Cmd para selecionar múltiplos cargos</small>
                  </div>

                  <div className="form-group">
                    <label>Descrição</label>
                    <textarea
                      value={atividade.descricao || ''}
                      onChange={(e) => updateAtividade(index, 'descricao', e.target.value)}
                      placeholder="Descrição opcional da atividade"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Salvando...
              </>
            ) : (
              <>
                <span className="material-icons">save</span>
                {modelo ? 'Atualizar' : 'Criar'} Modelo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModeloForm;

