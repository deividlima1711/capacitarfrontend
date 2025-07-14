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
        password: '',
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
      newErrors.password = 'Senha é obrigatória';
    } else if (!isEditing && formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
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
      if (isEditing && usuario) {
        // Para edição, usar Partial<User>
        const updates: Partial<User> = {
          nome: formData.nome.trim(),
          email: formData.email.trim(),
          username: formData.username.trim(),
          tipoUsuario: formData.tipoUsuario,
          departamento: formData.departamento.trim() || undefined,
          cargo: formData.cargo.trim() || undefined,
        };

        // Incluir password apenas se fornecido
        if (formData.password.trim()) {
          (updates as any).password = formData.password.trim();
        }

        await updateUsuario(usuario.id, updates);
      } else {
        // Para criação, usar Omit<User, 'id' | 'criadoEm'>
        const userData: Omit<User, 'id' | 'criadoEm'> = {
          username: formData.username.trim(),
          nome: formData.nome.trim(),
          email: formData.email.trim(),
          role: 'user', // Valor padrão para o tipo User
          tipoUsuario: formData.tipoUsuario,
          departamento: formData.departamento.trim() || undefined,
          cargo: formData.cargo.trim() || undefined,
        };

        // Incluir password para criação
        (userData as any).password = formData.password.trim();

        await addUsuario(userData);
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                  placeholder="Mínimo 6 caracteres"
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                onChange={(e) => handleInputChange('tipoUsuario', e.target.value as TipoUsuario)}
                className={errors.tipoUsuario ? 'error' : ''}
                disabled={isSubmitting}
              >
                <option value="Comum">Comum</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Gestor">Gestor</option>
              </select>
              {errors.tipoUsuario && <span className="error-message">{errors.tipoUsuario}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="departamento">Departamento</label>
              <input
                type="text"
                id="departamento"
                value={formData.departamento}
                onChange={(e) => handleInputChange('departamento', e.target.value)}
                placeholder="Ex: TI, RH, Vendas"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cargo">Cargo</label>
              <input
                type="text"
                id="cargo"
                value={formData.cargo}
                onChange={(e) => handleInputChange('cargo', e.target.value)}
                placeholder="Ex: Desenvolvedor, Analista"
                disabled={isSubmitting}
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
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar Usuário' : 'Criar Usuário')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsuarioModal;

