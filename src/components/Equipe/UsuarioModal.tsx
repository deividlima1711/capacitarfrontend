import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { User, TipoUsuario } from '../../types';
import '../Modals/Modal.css';

interface UsuarioModalProps {
  usuario?: User | null;
  onClose: () => void;
}

const UsuarioModal: React.FC<UsuarioModalProps> = ({ usuario, onClose }) => {
  const { addUsuario, updateUsuario } = useApp();
  const isEditing = !!usuario;

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    username: '',
    password: '',
    tipoUsuario: 'Comum' as TipoUsuario,
    departamento: '',
    cargo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    if (usuario) {
      setFormData({
        nome: usuario.nome || '',
        email: usuario.email || '',
        username: usuario.username || '',
        password: '', // Não preencher senha ao editar
        tipoUsuario: usuario.tipoUsuario || 'Comum',
        departamento: usuario.departamento || '',
        cargo: usuario.cargo || '',
      });
    }
  }, [usuario]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Nome de usuário é obrigatório';
    }

    if (!isEditing && !formData.password.trim()) {
      newErrors.password = 'Senha é obrigatória para novos usuários';
    }

    if (!formData.tipoUsuario) {
      newErrors.tipoUsuario = 'Tipo de usuário é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const userData = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        username: formData.username.trim(),
        tipoUsuario: formData.tipoUsuario,
        departamento: formData.departamento.trim(),
        cargo: formData.cargo.trim(),
        // Mapear tipoUsuario para role do backend
        role: formData.tipoUsuario === 'Gestor' ? 'admin' : 
              formData.tipoUsuario === 'Financeiro' ? 'manager' : 'user',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.nome)}&background=6366f1&color=fff`,
        // Adicionar senha apenas se não estiver editando ou se fornecida
        ...((!isEditing || formData.password.trim()) && { password: formData.password.trim() })
      };

      console.log('🔍 [MODAL] Dados completos antes de enviar:');
      console.log('  - Nome:', userData.nome);
      console.log('  - Email:', userData.email);
      console.log('  - Username:', userData.username);
      console.log('  - TipoUsuario:', userData.tipoUsuario);
      console.log('  - Role:', userData.role);
      console.log('  - Departamento:', userData.departamento);
      console.log('  - Cargo:', userData.cargo);
      console.log('  - Tem senha?:', !!userData.password);
      console.log('  - Avatar:', userData.avatar);
      console.log('  - Objeto completo:', JSON.stringify(userData, null, 2));

      console.log('🔍 [MODAL] Enviando dados do usuário:', userData);

      if (isEditing && usuario) {
        await updateUsuario(usuario.id, userData);
      } else {
        await addUsuario(userData);
      }

      onClose();
    } catch (error) {
      console.error('❌ [MODAL] Erro ao salvar usuário:', error);
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Erro inesperado ao salvar usuário. Verifique os dados e tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {submitError && (
            <div className="error-banner" style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #f87171',
              color: '#991b1b',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              {submitError}
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nome">Nome Completo *</label>
              <input
                type="text"
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className={errors.nome ? 'error' : ''}
                placeholder="Digite o nome completo"
              />
              {errors.nome && <span className="error-message">{errors.nome}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
                placeholder="Digite o email"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Nome de Usuário *</label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={errors.username ? 'error' : ''}
                placeholder="Digite o nome de usuário"
              />
              {errors.username && <span className="error-message">{errors.username}</span>}
            </div>

            {!isEditing && (
              <div className="form-group">
                <label htmlFor="password">Senha *</label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={errors.password ? 'error' : ''}
                  placeholder="Digite a senha"
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
            )}

            {isEditing && (
              <div className="form-group">
                <label htmlFor="password">Nova Senha (opcional)</label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Deixe em branco para manter a senha atual"
                />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tipoUsuario">Tipo de Usuário *</label>
              <select
                id="tipoUsuario"
                value={formData.tipoUsuario}
                onChange={(e) => handleInputChange('tipoUsuario', e.target.value)}
                className={errors.tipoUsuario ? 'error' : ''}
              >
                <option value="Comum">Comum</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Gestor">Gestor</option>
              </select>
              {errors.tipoUsuario && <span className="error-message">{errors.tipoUsuario}</span>}
            </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="departamento">Departamento</label>
              <input
                type="text"
                id="departamento"
                value={formData.departamento}
                onChange={(e) => handleInputChange('departamento', e.target.value)}
                placeholder="Ex: TI, RH, Vendas"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cargo">Cargo</label>
              <input
                type="text"
                id="cargo"
                value={formData.cargo}
                onChange={(e) => handleInputChange('cargo', e.target.value)}
                placeholder="Ex: Desenvolvedor, Analista"
              />
            </div>
          </div>

          <div className="tipo-usuario-info">
            <h4>Permissões por Tipo de Usuário:</h4>
            <div className="permissoes-grid">
              <div className="permissao-item">
                <strong>Gestor:</strong> Acesso total a todas as funcionalidades
              </div>
              <div className="permissao-item">
                <strong>Financeiro:</strong> Visualiza dados financeiros e gerencia suas tarefas
              </div>
              <div className="permissao-item">
                <strong>Comum:</strong> Visualiza e gerencia apenas suas próprias tarefas
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar Usuário' : 'Criar Usuário')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsuarioModal;

