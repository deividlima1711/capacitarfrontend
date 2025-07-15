import axios from 'axios';
import type { AxiosError, AxiosResponse } from 'axios';
import {
  transformBackendUserToFrontend,
  transformFrontendUserToBackend,
  transformBackendProcessToFrontend,
  transformFrontendProcessToBackend,
  transformBackendTaskToFrontend,
  transformFrontendTaskToBackend,
  initializeUserMapping,
  BackendUser,
  BackendProcess,
  BackendTask
} from '../utils/dataTransformers';
import { User, Processo, Tarefa } from '../types';
// Mock data imports REMOVIDOS - sistema usa APENAS backend real

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

if (process.env.NODE_ENV === 'development') {
  console.log('API base URL:', API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Aumentado para 15 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Função para validar token JWT
const isValidJWT = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Remover espaços em branco
  token = token.trim();
  
  // Verificar se tem 3 partes separadas por ponto
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.warn('🔍 Token inválido: não tem 3 partes');
    return false;
  }
  
  // Verificar apenas se as partes não estão vazias
  if (parts.some(part => !part || part.length === 0)) {
    console.warn('🔍 Token inválido: parte vazia');
    return false;
  }
  
  console.log('✅ Token JWT válido');
  return true;
};

// Função para limpar dados de autenticação
const clearAuthData = () => {
  console.log('🧹 Limpando dados de autenticação');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Garantir limpeza de qualquer modo mock que ainda possa existir
  localStorage.removeItem('useMockData');
  localStorage.removeItem('useLocalData');
  localStorage.removeItem('offlineMode');
};

// Interceptor para adicionar token automaticamente - VERSÃO MELHORADA
api.interceptors.request.use(
  (config) => {
    // Pegar token SEMPRE do localStorage e sessionStorage
    const tokenLocal = localStorage.getItem('token');
    const tokenSession = sessionStorage.getItem('token');
    const token = tokenLocal || tokenSession;
    
    console.log('🔐 [INTERCEPTOR] Debug token:', {
      localStorage: tokenLocal ? `${tokenLocal.substring(0, 20)}...` : 'VAZIO',
      sessionStorage: tokenSession ? `${tokenSession.substring(0, 20)}...` : 'VAZIO',
      selecionado: token ? `${token.substring(0, 20)}...` : 'VAZIO',
      url: config.url
    });
    
    // Garantir que headers existe sempre
    if (!config.headers) {
      config.headers = {} as any;
    }
    
    if (token && token.trim()) {
      // Validar token antes de enviar
      if (isValidJWT(token)) {
        config.headers['Authorization'] = `Bearer ${token.trim()}`;
        console.log(`✅ [INTERCEPTOR] Token adicionado à requisição para ${config.url}`);
      } else {
        console.warn('⚠️ Token inválido detectado, removendo...');
        clearAuthData();
        return Promise.reject(new Error('Token inválido - faça login novamente'));
      }
    } else {
      // Verificar se é uma rota que precisa de autenticação
      const isProtectedRoute = config.url && (
        config.url.includes('/users') || 
        config.url.includes('/processes') || 
        config.url.includes('/tasks') ||
        config.url.includes('/auth/verify') ||
        config.url.includes('/auth/logout')
      );
      
      if (isProtectedRoute && config.url && !config.url.includes('/auth/login')) {
        console.error('❌ [INTERCEPTOR] Tentativa de acessar endpoint protegido sem token:', config.url);
        return Promise.reject(new Error('Token de autenticação necessário'));
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
      console.log('📤 Headers Authorization:', config.headers['Authorization'] ? 'Presente' : 'Ausente');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Erro no interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error: AxiosError) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ API Error:', error.response?.status, error.config?.url, error.message);
    }
    
    // Tratar diferentes tipos de erro
    if (error.response?.status === 429) {
      console.warn('⚠️ Rate limit atingido');
      alert('Muitas requisições! Aguarde alguns minutos antes de tentar novamente.');
    } else if (error.response?.status === 401) {
      console.warn('⚠️ Token inválido ou expirado');
      clearAuthData();
      // SEMPRE redirecionar para login se token inválido (sem mock)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 500) {
      console.error('❌ Erro interno do servidor');
    } else if (error.code === 'ECONNABORTED') {
      console.error('❌ Timeout na requisição');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('❌ Erro de rede');
    }
    
    return Promise.reject(error);
  }
);

// Função utilitária para verificar se o usuário está autenticado
export const isUserAuthenticated = (): boolean => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? isValidJWT(token) : false;
};

// Função utilitária para obter token válido
export const getValidToken = (): string | null => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return (token && isValidJWT(token)) ? token : null;
};

// Serviços de Autenticação
export const authAPI = {
  login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
    // Validar entrada
    if (!username || !password) {
      throw new Error('Usuário e senha são obrigatórios');
    }
    
    try {
      console.log(`🔐 Tentando login no backend para usuário: ${username}`);
      console.log(`🌐 URL do backend: ${API_URL}`);
      
      const response = await api.post<{ token: string; user: BackendUser }>('/auth/login', { 
        username: username.trim(), 
        password 
      });
      
      console.log(`📥 Resposta do backend recebida:`, response.status);
      
      const { token, user } = response.data;
      
      // Validar resposta
      if (!token || !user) {
        throw new Error('Resposta inválida do servidor - token ou usuário ausente');
      }
      
      // Validar token recebido
      if (!isValidJWT(token)) {
        throw new Error('Token recebido é inválido');
      }
      
      const transformedUser = transformBackendUserToFrontend(user);
      
      // Limpar qualquer dados de mock antes de armazenar dados reais
      localStorage.removeItem('useMockData');
      
      // SALVAR TOKEN EM AMBOS OS STORAGES PARA GARANTIR PERSISTÊNCIA
      localStorage.setItem('token', token);
      sessionStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(transformedUser));
      sessionStorage.setItem('user', JSON.stringify(transformedUser));
      
      console.log(`✅ Login realizado com sucesso para ${username}:`, transformedUser);
      console.log(`✅ Token salvo no localStorage:`, localStorage.getItem('token') ? 'SIM' : 'NÃO');
      console.log(`✅ Token salvo no sessionStorage:`, sessionStorage.getItem('token') ? 'SIM' : 'NÃO');
      
      return {
        token,
        user: transformedUser
      };
      
    } catch (error: any) {
      console.error('❌ Erro no login backend:', error);
      console.error('❌ Detalhes do erro:', error.response?.data);
      console.error('❌ Status do erro:', error.response?.status);
      
      // NÃO usar fallback para dados mockados - sempre falhar se backend falhar
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Erro ao conectar com o servidor'
      );
    }
  },

  register: async (username: string, password: string, email?: string): Promise<{ token: string; user: User }> => {
    const response = await api.post<{ token: string; user: BackendUser }>('/auth/register', { username, password, email });
    
    const { token, user } = response.data;
    
    if (!isValidJWT(token)) {
      throw new Error('Token recebido é inválido');
    }
    
    const transformedUser = transformBackendUserToFrontend(user);
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(transformedUser));
    
    return {
      token,
      user: transformedUser
    };
  },

  verify: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: BackendUser }>('/auth/verify');
    return {
      user: transformBackendUserToFrontend(response.data.user)
    };
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean }> => {
    const response = await api.put<{ success: boolean }>('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  logout: async (): Promise<{ success: boolean }> => {
    try {
      const response = await api.post<{ success: boolean }>('/auth/logout');
      clearAuthData();
      return response.data;
    } catch (error) {
      // Mesmo se der erro no servidor, limpar dados locais
      clearAuthData();
      return { success: true };
    }
  },

  // Novo método para testar JWT
  testJWT: async (): Promise<any> => {
    const response = await api.get('/auth/test-jwt');
    return response.data;
  }
};

// Serviços de Usuários
export const userAPI = {
  getAll: async (): Promise<User[]> => {
    // SEMPRE usar backend real - sem fallback para mock
    const response = await api.get<{ users: BackendUser[] }>('/users');
    const backendUsers: BackendUser[] = response.data.users || [];
    initializeUserMapping(backendUsers);
    return backendUsers.map(transformBackendUserToFrontend);
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get<BackendUser>(`/users/${id}`);
    return transformBackendUserToFrontend(response.data);
  },

  create: async (userData: Omit<User, 'id' | 'criadoEm'>): Promise<User> => {
    console.log('🔍 [USER CREATION] ===== INÍCIO DA CRIAÇÃO DE USUÁRIO =====');
    console.log('🔍 [USER CREATION] Dados originais do frontend:', JSON.stringify(userData, null, 2));
    
    // Verificar se temos token antes da requisição - VERIFICAÇÃO MELHORADA
    const tokenLocal = localStorage.getItem('token');
    const tokenSession = sessionStorage.getItem('token');
    const token = tokenLocal || tokenSession;
    
    console.log('🔍 [USER CREATION] Token no localStorage:', tokenLocal ? `${tokenLocal.substring(0, 50)}...` : 'NENHUM');
    console.log('🔍 [USER CREATION] Token no sessionStorage:', tokenSession ? `${tokenSession.substring(0, 50)}...` : 'NENHUM');
    console.log('🔍 [USER CREATION] Token selecionado:', token ? `${token.substring(0, 50)}...` : 'NENHUM');
    
    if (!token) {
      console.error('❌ [USER CREATION] ERRO CRÍTICO: Nenhum token disponível!');
      throw new Error('Token de autenticação não encontrado - faça login novamente');
    }
    
    const backendData = transformFrontendUserToBackend(userData);
    
    console.log('🔍 [USER CREATION] Payload final para o backend:', JSON.stringify(backendData, null, 2));
    console.log('🔍 [USER CREATION] URL completa:', `${api.defaults.baseURL}/users`);
    
    try {
      console.log('🔍 [USER CREATION] Enviando requisição POST...');
      const response = await api.post<BackendUser>('/users', backendData);
      console.log('✅ [USER CREATION] Sucesso! Status:', response.status);
      console.log('✅ [USER CREATION] Resposta do backend:', JSON.stringify(response.data, null, 2));
      return transformBackendUserToFrontend(response.data);
    } catch (error) {
      console.error('❌ [USER CREATION] ===== ERRO NA CRIAÇÃO DO USUÁRIO =====');
      if (axios.isAxiosError(error)) {
        console.error('❌ Status HTTP:', error.response?.status);
        console.error('❌ Mensagem de erro:', error.message);
        console.error('❌ Dados do erro do backend:', JSON.stringify(error.response?.data, null, 2));
        console.error('❌ Headers enviados:', error.config?.headers);
        console.error('❌ Authorization header presente?:', error.config?.headers?.Authorization ? 'SIM' : 'NÃO');
        console.error('❌ URL da requisição:', error.config?.url);
        console.error('❌ Método da requisição:', error.config?.method);
        console.error('❌ Payload enviado:', error.config?.data);
        
        // Tentar extrair mensagem de erro específica do backend
        const backendErrorMessage = error.response?.data?.message || 
                                  error.response?.data?.error || 
                                  error.response?.data?.details ||
                                  'Erro desconhecido do servidor';
        
        console.error('❌ Mensagem específica do backend:', backendErrorMessage);
        
        // Lançar erro com informações mais detalhadas
        throw new Error(`Erro ${error.response?.status}: ${backendErrorMessage}`);
      } else {
        console.error('❌ Erro não relacionado ao Axios:', error);
      }
      throw error;
    }
  },

  update: async (id: number, userData: Partial<User>): Promise<User> => {
    const backendData = transformFrontendUserToBackend(userData);
    const response = await api.put<BackendUser>(`/users/${id}`, backendData);
    return transformBackendUserToFrontend(response.data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<BackendUser>('/users/profile/me');
    return transformBackendUserToFrontend(response.data);
  }
};

// Serviços de Processos
export const processAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assignedTo?: string;
    process?: string;
    search?: string;
  }): Promise<{ processos: Processo[]; total: number; totalPages: number; currentPage: number }> => {
    // SEMPRE usar backend real - sem fallback para mock
    const response = await api.get<{ processes: BackendProcess[]; total: number; totalPages: number; currentPage: number }>('/processes', { params });
    const backendProcesses: BackendProcess[] = response.data.processes || [];
    return {
      processos: backendProcesses.map(transformBackendProcessToFrontend),
      total: response.data.total || backendProcesses.length,
      totalPages: response.data.totalPages || 1,
      currentPage: response.data.currentPage || 1
    };
  },

  getById: async (id: string): Promise<Processo> => {
    const response = await api.get<BackendProcess>(`/processes/${id}`);
    return transformBackendProcessToFrontend(response.data);
  },

  create: async (processData: Omit<Processo, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Processo> => {
    const backendData = transformFrontendProcessToBackend(processData);
    const response = await api.post<BackendProcess>('/processes', backendData);
    return transformBackendProcessToFrontend(response.data);
  },

  update: async (id: string, processData: Partial<Processo>): Promise<Processo> => {
    const backendData = transformFrontendProcessToBackend(processData);
    const response = await api.put<BackendProcess>(`/processes/${id}`, backendData);
    return transformBackendProcessToFrontend(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/processes/${id}`);
  },

  addComment: async (id: string, text: string): Promise<void> => {
    await api.post(`/processes/${id}/comments`, { text });
  },

  getStats: async (): Promise<any> => {
    try {
      const response = await api.get('/processes/stats/dashboard');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Erro ao buscar estatísticas de processos');
      throw error;
    }
  }
};

// Serviços de Tarefas
export const taskAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assignedTo?: string;
    process?: string;
    search?: string;
  }): Promise<{ tarefas: Tarefa[]; total: number; totalPages: number; currentPage: number }> => {
    // SEMPRE usar backend real - sem fallback para mock
    const response = await api.get<{ tasks: BackendTask[]; total: number; totalPages: number; currentPage: number }>('/tasks', { params });
    const backendTasks: BackendTask[] = response.data.tasks || [];
    return {
      tarefas: backendTasks.map(transformBackendTaskToFrontend),
      total: response.data.total || backendTasks.length,
      totalPages: response.data.totalPages || 1,
      currentPage: response.data.currentPage || 1
    };
  },

  getById: async (id: string): Promise<Tarefa> => {
    const response = await api.get<BackendTask>(`/tasks/${id}`);
    return transformBackendTaskToFrontend(response.data);
  },

  create: async (taskData: Omit<Tarefa, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Tarefa> => {
    const backendData = transformFrontendTaskToBackend(taskData);
    const response = await api.post<BackendTask>('/tasks', backendData);
    return transformBackendTaskToFrontend(response.data);
  },

  update: async (id: string, taskData: Partial<Tarefa>): Promise<Tarefa> => {
    const backendData = transformFrontendTaskToBackend(taskData);
    const response = await api.put<BackendTask>(`/tasks/${id}`, backendData);
    return transformBackendTaskToFrontend(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  addComment: async (id: string, text: string): Promise<void> => {
    await api.post(`/tasks/${id}/comments`, { text });
  },

  getMyTasks: async (): Promise<Tarefa[]> => {
    const response = await api.get<{ tasks: BackendTask[] }>('/tasks/my/tasks');
    const backendTasks: BackendTask[] = response.data.tasks || [];
    return backendTasks.map(transformBackendTaskToFrontend);
  },

  getStats: async (): Promise<any> => {
    try {
      const response = await api.get('/tasks/stats/dashboard');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Erro ao buscar estatísticas de tarefas');
      throw error;
    }
  }
};

// Serviços de Equipes
export const teamAPI = {
  getMembers: async (): Promise<User[]> => {
    const response = await api.get<{ members: BackendUser[] }>('/teams/members');
    const backendUsers: BackendUser[] = response.data.members || [];
    return backendUsers.map(transformBackendUserToFrontend);
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/teams/stats');
    return response.data;
  },

  getMemberPerformance: async (id: number): Promise<any> => {
    const response = await api.get(`/teams/member/${id}/performance`);
    return response.data;
  },

  getDepartments: async (): Promise<any> => {
    const response = await api.get('/teams/departments');
    return response.data;
  }
};

// Serviços de Upload/Download
export const fileAPI = {
  upload: async (file: File, type: 'process' | 'task', entityId: string): Promise<{ url: string; name: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('entityId', entityId);

    const response = await api.post<{ url: string; name: string }>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  download: async (fileId: string): Promise<Blob> => {
    const response = await api.get<Blob>(`/files/download/${fileId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (fileId: string): Promise<void> => {
    await api.delete(`/files/${fileId}`);
  }
};

// Serviços Gerais
export const generalAPI = {
  getStatus: async (): Promise<any> => {
    const response = await api.get('/');
    return response.data;
  },

  getDashboardStats: async (): Promise<any> => {
    try {
      const [processStats, taskStats, teamStats] = await Promise.all([
        processAPI.getStats(),
        taskAPI.getStats(),
        teamAPI.getStats()
      ]);

      return {
        processes: processStats,
        tasks: taskStats,
        team: teamStats
      };
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas do dashboard:', error);
      return {
        processes: {},
        tasks: {},
        team: {}
      };
    }
  }
};

// API para gerenciamento de anexos
export const anexoAPI = {
  upload: async (tarefaId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tarefaId', tarefaId);
    
    try {
      const response = await api.post(`/tasks/${tarefaId}/anexos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Anexo enviado com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar anexo:', error);
      throw error;
    }
  },

  download: async (tarefaId: string, anexoId: string): Promise<Blob> => {
    try {
      const response = await api.get(`/tasks/${tarefaId}/anexos/${anexoId}/download`, {
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao baixar anexo:', error);
      throw error;
    }
  },

  delete: async (tarefaId: string, anexoId: string): Promise<void> => {
    try {
      await api.delete(`/tasks/${tarefaId}/anexos/${anexoId}`);
      console.log('✅ Anexo removido com sucesso');
    } catch (error) {
      console.error('❌ Erro ao remover anexo:', error);
      throw error;
    }
  },

  list: async (tarefaId: string): Promise<any[]> => {
    try {
      const response = await api.get(`/tasks/${tarefaId}/anexos`);
      return response.data.anexos || [];
    } catch (error) {
      console.error('❌ Erro ao listar anexos:', error);
      throw error;
    }
  }
};

export default api;

