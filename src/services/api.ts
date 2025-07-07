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
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error: AxiosError) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('API Error:', error.response?.status, error.config?.url, error.message);
    }
    // Se há erro de conexão ou 401/404, NÃO ativar modo mock automaticamente
    // Removido: localStorage.setItem('useMockData', 'true');
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!shouldUseMockData()) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Serviços de Autenticação
export const authAPI = {
  login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
    if (shouldUseMockData()) {
      await simulateApiDelay(1000);
      console.log('Usando autenticação mockada');
      if (
        (username === 'admin' && password === 'Lima12345') ||
        (username === 'usuario1' && password === '123456') ||
        (username === 'usuario2' && password === '123456')
      ) {
        const user = mockUsers.find(u => u.username === username);
        return {
          token: 'mock-jwt-token-' + Date.now(),
          user: user as User
        };
      } else {
        throw new Error('Credenciais inválidas');
      }
    }
    try {
      const response = await api.post<{ token: string; user: BackendUser }>('/auth/login', { username, password });
      return {
        token: response.data.token,
        user: transformBackendUserToFrontend(response.data.user)
      };
    } catch (error) {
      console.warn('Erro na autenticação da API, tentando modo offline:', error);
      localStorage.setItem('useMockData', 'true');
      if (
        (username === 'admin' && password === 'Lima12345') ||
        (username === 'usuario1' && password === '123456') ||
        (username === 'usuario2' && password === '123456')
      ) {
        const user = mockUsers.find(u => u.username === username);
        return {
          token: 'mock-jwt-token-' + Date.now(),
          user: user as User
        };
      } else {
        throw new Error('Credenciais inválidas');
      }
    }
  },

  register: async (username: string, password: string, email?: string): Promise<{ token: string; user: User }> => {
    const response = await api.post<{ token: string; user: BackendUser }>('/auth/register', { username, password, email });
    return {
      token: response.data.token,
      user: transformBackendUserToFrontend(response.data.user)
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
    const response = await api.post<{ success: boolean }>('/auth/logout');
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
      const response = await api.get<{ users: BackendUser[] }>('/users');
      const backendUsers: BackendUser[] = response.data.users || [];
      initializeUserMapping(backendUsers);
      return backendUsers.map(transformBackendUserToFrontend);
    } catch (error) {
      // Removido: localStorage.setItem('useMockData', 'true');
      return mockUsers;
    }
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get<BackendUser>(`/users/${id}`);
    return transformBackendUserToFrontend(response.data);
  },

  create: async (userData: Omit<User, 'id' | 'criadoEm'>): Promise<User> => {
    const backendData = transformFrontendUserToBackend(userData);
    const response = await api.post<BackendUser>('/users', backendData);
    return transformBackendUserToFrontend(response.data);
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
      const response = await api.get<{ processes: BackendProcess[]; total: number; totalPages: number; currentPage: number }>('/processes', { params });
      const backendProcesses: BackendProcess[] = response.data.processes || [];
      return {
        processos: backendProcesses.map(transformBackendProcessToFrontend),
        total: response.data.total || backendProcesses.length,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1
      };
    } catch (error) {
      // Removido: localStorage.setItem('useMockData', 'true');
      return {
        processos: mockProcessos,
        total: mockProcessos.length,
        totalPages: 1,
        currentPage: 1
      };
    }
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
    const response = await api.get('/processes/stats/dashboard');
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
      const response = await api.get<{ tasks: BackendTask[]; total: number; totalPages: number; currentPage: number }>('/tasks', { params });
      const backendTasks: BackendTask[] = response.data.tasks || [];
      return {
        tarefas: backendTasks.map(transformBackendTaskToFrontend),
        total: response.data.total || backendTasks.length,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1
      };
    } catch (error) {
      // Removido: localStorage.setItem('useMockData', 'true');
      return {
        tarefas: mockTarefas,
        total: mockTarefas.length,
        totalPages: 1,
        currentPage: 1
      };
    }
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
    const response = await api.get('/tasks/stats/dashboard');
    return response.data;
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
