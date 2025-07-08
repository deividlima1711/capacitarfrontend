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
import { mockUsers, mockProcessos, mockTarefas, simulateApiDelay, shouldUseMockData } from '../utils/mockData';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
  
  // Verificar se cada parte é base64 válida
  try {
    for (const part of parts) {
      if (!part || part.length === 0) {
        console.warn('🔍 Token inválido: parte vazia');
        return false;
      }
      // Tentar decodificar base64 (adicionar padding se necessário)
      const padded = part + '='.repeat((4 - part.length % 4) % 4);
      atob(padded);
    }
    return true;
  } catch (error) {
    console.warn('🔍 Token inválido: erro na decodificação base64');
    return false;
  }
};

// Função para limpar dados de autenticação
const clearAuthData = () => {
  console.log('🧹 Limpando dados de autenticação');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('useMockData');
};

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token && config.headers) {
      // Validar token antes de enviar
      if (isValidJWT(token)) {
        (config.headers as any).Authorization = `Bearer ${token}`;
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔐 Token adicionado à requisição: ${token.substring(0, 20)}...`);
        }
      } else {
        console.warn('⚠️ Token inválido detectado, removendo...');
        clearAuthData();
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
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
      if (!shouldUseMockData()) {
        // Evitar loop infinito de redirecionamento
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
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

// Serviços de Autenticação
export const authAPI = {
  login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
    // Validar entrada
    if (!username || !password) {
      throw new Error('Usuário e senha são obrigatórios');
    }
    
    if (shouldUseMockData()) {
      await simulateApiDelay(1000);
      console.log('🔄 Usando autenticação mockada');
      if (
        (username === 'admin' && password === 'Lima12345') ||
        (username === 'usuario1' && password === '123456') ||
        (username === 'usuario2' && password === '123456')
      ) {
        const user = mockUsers.find(u => u.username === username);
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        // Armazenar dados mockados
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        return {
          token: mockToken,
          user: user as User
        };
      } else {
        throw new Error('Credenciais inválidas');
      }
    }
    
    try {
      console.log(`🔐 Tentando login para usuário: ${username}`);
      
      const response = await api.post<{ token: string; user: BackendUser }>('/api/auth/login', { 
        username: username.trim(), 
        password 
      });
      
      const { token, user } = response.data;
      
      // Validar resposta
      if (!token || !user) {
        throw new Error('Resposta inválida do servidor');
      }
      
      // Validar token recebido
      if (!isValidJWT(token)) {
        throw new Error('Token recebido é inválido');
      }
      
      const transformedUser = transformBackendUserToFrontend(user);
      
      // Armazenar dados
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(transformedUser));
      localStorage.removeItem('useMockData'); // Remover flag de mock se existir
      
      console.log(`✅ Login realizado com sucesso para ${username}`);
      
      return {
        token,
        user: transformedUser
      };
      
    } catch (error: any) {
      console.error('❌ Erro no login:', error.message);
      
      // Se for erro de rede, tentar modo offline
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        console.warn('🔄 Erro de conexão, tentando modo offline...');
        localStorage.setItem('useMockData', 'true');
        
        if (
          (username === 'admin' && password === 'Lima12345') ||
          (username === 'usuario1' && password === '123456') ||
          (username === 'usuario2' && password === '123456')
        ) {
          const user = mockUsers.find(u => u.username === username);
          const mockToken = 'mock-jwt-token-' + Date.now();
          
          localStorage.setItem('token', mockToken);
          localStorage.setItem('user', JSON.stringify(user));
          
          return {
            token: mockToken,
            user: user as User
          };
        }
      }
      
      // Propagar erro original
      throw error;
    }
  },

  register: async (username: string, password: string, email?: string): Promise<{ token: string; user: User }> => {
    const response = await api.post<{ token: string; user: BackendUser }>('/api/auth/register', { username, password, email });
    
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
    const response = await api.get<{ user: BackendUser }>('/api/auth/verify');
    return {
      user: transformBackendUserToFrontend(response.data.user)
    };
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean }> => {
    const response = await api.put<{ success: boolean }>('/api/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  logout: async (): Promise<{ success: boolean }> => {
    try {
      const response = await api.post<{ success: boolean }>('/api/auth/logout');
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
    const response = await api.get('/api/auth/test-jwt');
    return response.data;
  }
};

// Serviços de Usuários
export const userAPI = {
  getAll: async (): Promise<User[]> => {
    if (shouldUseMockData()) {
      await simulateApiDelay(500);
      return mockUsers;
    }
    try {
      const response = await api.get<{ users: BackendUser[] }>('/api/users');
      const backendUsers: BackendUser[] = response.data.users || [];
      initializeUserMapping(backendUsers);
      return backendUsers.map(transformBackendUserToFrontend);
    } catch (error) {
      console.warn('⚠️ Erro ao buscar usuários, usando dados mockados');
      return mockUsers;
    }
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get<BackendUser>(`/api/users/${id}`);
    return transformBackendUserToFrontend(response.data);
  },

  create: async (userData: Omit<User, 'id' | 'criadoEm'>): Promise<User> => {
    const backendData = transformFrontendUserToBackend(userData);
    const response = await api.post<BackendUser>('/api/users', backendData);
    return transformBackendUserToFrontend(response.data);
  },

  update: async (id: number, userData: Partial<User>): Promise<User> => {
    const backendData = transformFrontendUserToBackend(userData);
    const response = await api.put<BackendUser>(`/api/users/${id}`, backendData);
    return transformBackendUserToFrontend(response.data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<BackendUser>('/api/users/profile/me');
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
    responsible?: string;
    search?: string;
  }): Promise<{ processos: Processo[]; total: number; totalPages: number; currentPage: number }> => {
    if (shouldUseMockData()) {
      await simulateApiDelay(500);
      return {
        processos: mockProcessos,
        total: mockProcessos.length,
        totalPages: 1,
        currentPage: 1
      };
    }
    try {
      const response = await api.get<{ processes: BackendProcess[]; total: number; totalPages: number; currentPage: number }>('/api/processes', { params });
      const backendProcesses: BackendProcess[] = response.data.processes || [];
      return {
        processos: backendProcesses.map(transformBackendProcessToFrontend),
        total: response.data.total || backendProcesses.length,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1
      };
    } catch (error) {
      console.warn('⚠️ Erro ao buscar processos, usando dados mockados');
      return {
        processos: mockProcessos,
        total: mockProcessos.length,
        totalPages: 1,
        currentPage: 1
      };
    }
  },

  getById: async (id: string): Promise<Processo> => {
    const response = await api.get<BackendProcess>(`/api/processes/${id}`);
    return transformBackendProcessToFrontend(response.data);
  },

  create: async (processData: Omit<Processo, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Processo> => {
    const backendData = transformFrontendProcessToBackend(processData);
    const response = await api.post<BackendProcess>('/api/processes', backendData);
    return transformBackendProcessToFrontend(response.data);
  },

  update: async (id: string, processData: Partial<Processo>): Promise<Processo> => {
    const backendData = transformFrontendProcessToBackend(processData);
    const response = await api.put<BackendProcess>(`/api/processes/${id}`, backendData);
    return transformBackendProcessToFrontend(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/processes/${id}`);
  },

  addComment: async (id: string, text: string): Promise<void> => {
    await api.post(`/api/processes/${id}/comments`, { text });
  },

  getStats: async (): Promise<any> => {
    try {
      const response = await api.get('/api/processes/stats/dashboard');
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
    if (shouldUseMockData()) {
      await simulateApiDelay(500);
      return {
        tarefas: mockTarefas,
        total: mockTarefas.length,
        totalPages: 1,
        currentPage: 1
      };
    }
    try {
      const response = await api.get<{ tasks: BackendTask[]; total: number; totalPages: number; currentPage: number }>('/api/tasks', { params });
      const backendTasks: BackendTask[] = response.data.tasks || [];
      return {
        tarefas: backendTasks.map(transformBackendTaskToFrontend),
        total: response.data.total || backendTasks.length,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1
      };
    } catch (error) {
      console.warn('⚠️ Erro ao buscar tarefas, usando dados mockados');
      return {
        tarefas: mockTarefas,
        total: mockTarefas.length,
        totalPages: 1,
        currentPage: 1
      };
    }
  },

  getById: async (id: string): Promise<Tarefa> => {
    const response = await api.get<BackendTask>(`/api/tasks/${id}`);
    return transformBackendTaskToFrontend(response.data);
  },

  create: async (taskData: Omit<Tarefa, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Tarefa> => {
    const backendData = transformFrontendTaskToBackend(taskData);
    const response = await api.post<BackendTask>('/api/tasks', backendData);
    return transformBackendTaskToFrontend(response.data);
  },

  update: async (id: string, taskData: Partial<Tarefa>): Promise<Tarefa> => {
    const backendData = transformFrontendTaskToBackend(taskData);
    const response = await api.put<BackendTask>(`/api/tasks/${id}`, backendData);
    return transformBackendTaskToFrontend(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/tasks/${id}`);
  },

  addComment: async (id: string, text: string): Promise<void> => {
    await api.post(`/api/tasks/${id}/comments`, { text });
  },

  getMyTasks: async (): Promise<Tarefa[]> => {
    const response = await api.get<{ tasks: BackendTask[] }>('/api/tasks/my/tasks');
    const backendTasks: BackendTask[] = response.data.tasks || [];
    return backendTasks.map(transformBackendTaskToFrontend);
  },

  getStats: async (): Promise<any> => {
    try {
      const response = await api.get('/api/tasks/stats/dashboard');
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
    const response = await api.get<{ members: BackendUser[] }>('/api/teams/members');
    const backendUsers: BackendUser[] = response.data.members || [];
    return backendUsers.map(transformBackendUserToFrontend);
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/api/teams/stats');
    return response.data;
  },

  getMemberPerformance: async (id: number): Promise<any> => {
    const response = await api.get(`/api/teams/member/${id}/performance`);
    return response.data;
  },

  getDepartments: async (): Promise<any> => {
    const response = await api.get('/api/teams/departments');
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

    const response = await api.post<{ url: string; name: string }>('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  download: async (fileId: string): Promise<Blob> => {
    const response = await api.get<Blob>(`/api/files/download/${fileId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (fileId: string): Promise<void> => {
    await api.delete(`/api/files/${fileId}`);
  }
};

// Serviços Gerais
export const generalAPI = {
  getStatus: async (): Promise<any> => {
    const response = await api.get('/api/');
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

export default api;

