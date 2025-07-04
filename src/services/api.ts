import axios from 'axios';
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
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('API Error:', error.response?.status, error.config?.url, error.message);
    }
    
    // Se há erro de conexão ou 401/404, ativar modo mock automaticamente
    if (!error.response || error.response.status === 401 || error.response.status === 404 || error.code === 'NETWORK_ERROR') {
      console.warn('API não disponível, ativando modo offline com dados mockados');
      localStorage.setItem('useMockData', 'true');
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Não redirecionar automaticamente para login se estivermos usando dados mock
      if (!shouldUseMockData()) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Serviços de Autenticação
export const authAPI = {
  login: async (username: string, password: string) => {
    // Se deve usar dados mockados, simular login
    if (shouldUseMockData()) {
      await simulateApiDelay(1000);
      console.log('Usando autenticação mockada');
      
      // Verificar credenciais mockadas
      if ((username === 'admin' && password === 'Lima12345') || 
          (username === 'usuario1' && password === '123456') ||
          (username === 'usuario2' && password === '123456')) {
        const user = mockUsers.find(u => u.username === username);
        return {
          token: 'mock-jwt-token-' + Date.now(),
          user: user
        };
      } else {
        throw new Error('Credenciais inválidas');
      }
    }
    
    try {
      const response = await api.post('/auth/login', { username, password });
      
      // Transformar dados do usuário
      if (response.data.user) {
        response.data.user = transformBackendUserToFrontend(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      console.warn('Erro na autenticação da API, tentando modo offline:', error);
      localStorage.setItem('useMockData', 'true');
      
      // Tentar novamente com dados mockados
      if ((username === 'admin' && password === 'Lima12345') || 
          (username === 'usuario1' && password === '123456') ||
          (username === 'usuario2' && password === '123456')) {
        const user = mockUsers.find(u => u.username === username);
        return {
          token: 'mock-jwt-token-' + Date.now(),
          user: user
        };
      } else {
        throw new Error('Credenciais inválidas');
      }
    }
  },

  register: async (username: string, password: string, email?: string) => {
    const response = await api.post('/auth/register', { username, password, email });
    
    if (response.data.user) {
      response.data.user = transformBackendUserToFrontend(response.data.user);
    }
    
    return response.data;
  },

  verify: async () => {
    const response = await api.get('/auth/verify');
    
    if (response.data.user) {
      response.data.user = transformBackendUserToFrontend(response.data.user);
    }
    
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/auth/change-password', { 
      currentPassword, 
      newPassword 
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

// Serviços de Usuários
export const userAPI = {
  getAll: async (): Promise<User[]> => {
    // Se deve usar dados mockados, retornar dados mock
    if (shouldUseMockData()) {
      await simulateApiDelay(500);
      console.log('Usando dados mockados para usuários');
      return mockUsers;
    }
    
    try {
      const response = await api.get('/api/users');
      const backendUsers: BackendUser[] = response.data.users || response.data;
      
      // Inicializar mapeamento de usuários
      initializeUserMapping(backendUsers);
      
      return backendUsers.map(transformBackendUserToFrontend);
    } catch (error) {
      console.warn('Erro ao carregar usuários da API, usando dados mockados:', error);
      localStorage.setItem('useMockData', 'true');
      return mockUsers;
    }
  },

  getById: async (id: number): Promise<User> => {
    // Converter ID do frontend para backend se necessário
    const response = await api.get(`/api/users/${id}`);
    return transformBackendUserToFrontend(response.data);
  },

  create: async (userData: Omit<User, 'id' | 'criadoEm'>): Promise<User> => {
    const backendData = transformFrontendUserToBackend(userData);
    const response = await api.post('/api/users', backendData);
    return transformBackendUserToFrontend(response.data);
  },

  update: async (id: number, userData: Partial<User>): Promise<User> => {
    const backendData = transformFrontendUserToBackend(userData);
    const response = await api.put(`/api/users/${id}`, backendData);
    return transformBackendUserToFrontend(response.data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/api/users/profile/me');
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
    // Se deve usar dados mockados, retornar dados mock
    if (shouldUseMockData()) {
      await simulateApiDelay(500);
      console.log('Usando dados mockados para processos');
      return {
        processos: mockProcessos,
        total: mockProcessos.length,
        totalPages: 1,
        currentPage: 1
      };
    }
    
    try {
      const response = await api.get('/api/processes', { params });
      const backendProcesses: BackendProcess[] = response.data.processes || response.data;
      
      return {
        processos: backendProcesses.map(transformBackendProcessToFrontend),
        total: response.data.total || backendProcesses.length,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1
      };
    } catch (error) {
      console.warn('Erro ao carregar processos da API, usando dados mockados:', error);
      localStorage.setItem('useMockData', 'true');
      return {
        processos: mockProcessos,
        total: mockProcessos.length,
        totalPages: 1,
        currentPage: 1
      };
    }
  },

  getById: async (id: string): Promise<Processo> => {
    const response = await api.get(`/api/processes/${id}`);
    return transformBackendProcessToFrontend(response.data);
  },

  create: async (processData: Omit<Processo, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Processo> => {
    const backendData = transformFrontendProcessToBackend(processData);
    const response = await api.post('/api/processes', backendData);
    return transformBackendProcessToFrontend(response.data);
  },

  update: async (id: string, processData: Partial<Processo>): Promise<Processo> => {
    const backendData = transformFrontendProcessToBackend(processData);
    const response = await api.put(`/api/processes/${id}`, backendData);
    return transformBackendProcessToFrontend(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/processes/${id}`);
  },

  addComment: async (id: string, text: string): Promise<void> => {
    await api.post(`/api/processes/${id}/comments`, { text });
  },

  getStats: async () => {
    const response = await api.get('/api/processes/stats/dashboard');
    return response.data;
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
    // Se deve usar dados mockados, retornar dados mock
    if (shouldUseMockData()) {
      await simulateApiDelay(500);
      console.log('Usando dados mockados para tarefas');
      return {
        tarefas: mockTarefas,
        total: mockTarefas.length,
        totalPages: 1,
        currentPage: 1
      };
    }
    
    try {
      const response = await api.get('/api/tasks', { params });
      const backendTasks: BackendTask[] = response.data.tasks || response.data;
      
      return {
        tarefas: backendTasks.map(transformBackendTaskToFrontend),
        total: response.data.total || backendTasks.length,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1
      };
    } catch (error) {
      console.warn('Erro ao carregar tarefas da API, usando dados mockados:', error);
      localStorage.setItem('useMockData', 'true');
      return {
        tarefas: mockTarefas,
        total: mockTarefas.length,
        totalPages: 1,
        currentPage: 1
      };
    }
  },

  getById: async (id: string): Promise<Tarefa> => {
    const response = await api.get(`/api/tasks/${id}`);
    return transformBackendTaskToFrontend(response.data);
  },

  create: async (taskData: Omit<Tarefa, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Tarefa> => {
    const backendData = transformFrontendTaskToBackend(taskData);
    const response = await api.post('/api/tasks', backendData);
    return transformBackendTaskToFrontend(response.data);
  },

  update: async (id: string, taskData: Partial<Tarefa>): Promise<Tarefa> => {
    const backendData = transformFrontendTaskToBackend(taskData);
    const response = await api.put(`/api/tasks/${id}`, backendData);
    return transformBackendTaskToFrontend(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/tasks/${id}`);
  },

  addComment: async (id: string, text: string): Promise<void> => {
    await api.post(`/api/tasks/${id}/comments`, { text });
  },

  getMyTasks: async (): Promise<Tarefa[]> => {
    const response = await api.get('/api/tasks/my/tasks');
    const backendTasks: BackendTask[] = response.data.tasks || response.data;
    return backendTasks.map(transformBackendTaskToFrontend);
  },

  getStats: async () => {
    const response = await api.get('/api/tasks/stats/dashboard');
    return response.data;
  }
};

// Serviços de Equipes
export const teamAPI = {
  getMembers: async (): Promise<User[]> => {
    const response = await api.get('/api/teams/members');
    const backendUsers: BackendUser[] = response.data.members || response.data;
    return backendUsers.map(transformBackendUserToFrontend);
  },

  getStats: async () => {
    const response = await api.get('/api/teams/stats');
    return response.data;
  },

  getMemberPerformance: async (id: number) => {
    const response = await api.get(`/api/teams/member/${id}/performance`);
    return response.data;
  },

  getDepartments: async () => {
    const response = await api.get('/api/teams/departments');
    return response.data;
  }
};

// Serviços de Upload/Download (placeholder para implementação futura)
export const fileAPI = {
  upload: async (file: File, type: 'process' | 'task', entityId: string): Promise<{ url: string; name: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('entityId', entityId);
    
    const response = await api.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  download: async (fileId: string): Promise<Blob> => {
    const response = await api.get(`/api/files/download/${fileId}`, {
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
  getStatus: async () => {
    const response = await api.get('/');
    return response.data;
  },

  getDashboardStats: async () => {
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
      console.error('Erro ao carregar estatísticas do dashboard:', error);
      return {
        processes: {},
        tasks: {},
        team: {}
      };
    }
  }
};

export default api;

