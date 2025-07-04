import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { TipoUsuario, PermissaoConfig } from '../types';

// Configuração de permissões por tipo de usuário
const PERMISSOES_CONFIG: Record<TipoUsuario, PermissaoConfig> = {
  Gestor: {
    dashboard: { visualizar: true, criar: true, editar: true, excluir: true },
    processos: { visualizar: true, criar: true, editar: true, excluir: true },
    tarefas: { visualizar: true, criar: true, editar: true, excluir: true },
    equipe: { visualizar: true, criar: true, editar: true, excluir: true },
    'modelos-processos': { visualizar: true, criar: true, editar: true, excluir: true },
    relatorios: { visualizar: true, criar: true, editar: true, excluir: true },
    configuracoes: { visualizar: true, criar: true, editar: true, excluir: true },
    financeiro: { visualizar: true, criar: true, editar: true, excluir: true },
  },
  Comum: {
    dashboard: { visualizar: true, criar: false, editar: false, excluir: false },
    processos: { visualizar: true, criar: true, editar: true, excluir: false },
    tarefas: { visualizar: true, criar: true, editar: true, excluir: false },
    equipe: { visualizar: true, criar: false, editar: false, excluir: false },
    'modelos-processos': { visualizar: true, criar: false, editar: false, excluir: false },
    relatorios: { visualizar: false, criar: false, editar: false, excluir: false },
    configuracoes: { visualizar: false, criar: false, editar: false, excluir: false },
    financeiro: { visualizar: false, criar: false, editar: false, excluir: false },
  },
  Financeiro: {
    dashboard: { visualizar: true, criar: false, editar: false, excluir: false },
    processos: { visualizar: true, criar: true, editar: true, excluir: false },
    tarefas: { visualizar: true, criar: true, editar: true, excluir: false },
    equipe: { visualizar: true, criar: false, editar: false, excluir: false },
    'modelos-processos': { visualizar: true, criar: false, editar: false, excluir: false },
    relatorios: { visualizar: true, criar: false, editar: false, excluir: false },
    configuracoes: { visualizar: false, criar: false, editar: false, excluir: false },
    financeiro: { visualizar: true, criar: true, editar: true, excluir: true },
  },
};

export const usePermissions = () => {
  const { user } = useApp();

  const permissions = useMemo(() => {
    if (!user || !user.tipoUsuario) {
      return PERMISSOES_CONFIG.Comum; // Permissões padrão mais restritivas
    }
    return PERMISSOES_CONFIG[user.tipoUsuario];
  }, [user]);

  const hasPermission = (modulo: string, acao: 'visualizar' | 'criar' | 'editar' | 'excluir'): boolean => {
    return permissions[modulo]?.[acao] || false;
  };

  const canAccess = (modulo: string): boolean => {
    return hasPermission(modulo, 'visualizar');
  };

  const canCreate = (modulo: string): boolean => {
    return hasPermission(modulo, 'criar');
  };

  const canEdit = (modulo: string): boolean => {
    return hasPermission(modulo, 'editar');
  };

  const canDelete = (modulo: string): boolean => {
    return hasPermission(modulo, 'excluir');
  };

  const isGestor = (): boolean => {
    return user?.tipoUsuario === 'Gestor';
  };

  const isFinanceiro = (): boolean => {
    return user?.tipoUsuario === 'Financeiro';
  };

  const isComum = (): boolean => {
    return user?.tipoUsuario === 'Comum';
  };

  // Filtrar tarefas baseado no tipo de usuário
  const filterUserTasks = (tarefas: any[]) => {
    // Todos os usuários podem ver todas as tarefas
    return tarefas;
  };

  // Filtrar processos baseado no tipo de usuário
  const filterUserProcesses = (processos: any[]): any[] => {
    if (!user) return [];
    
    if (isGestor()) {
      return processos; // Gestor vê todos os processos
    }
    
    // Usuários Comum e Financeiro veem apenas processos onde são responsáveis
    return processos.filter(processo => processo.responsavelId === user.id);
  };

  return {
    permissions,
    hasPermission,
    canAccess,
    canCreate,
    canEdit,
    canDelete,
    isGestor,
    isFinanceiro,
    isComum,
    filterUserTasks,
    filterUserProcesses,
    userType: user?.tipoUsuario || 'Comum',
  };
};

