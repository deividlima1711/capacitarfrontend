import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppState, User, Processo, Tarefa, Notificacao, Estatisticas } from '../types';
import { userAPI, processAPI, taskAPI, generalAPI } from '../services/api';

interface AppContextType extends AppState {
  setUser: (user: User | null) => void;
  addProcesso: (processo: Omit<Processo, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<Processo>;
  updateProcesso: (id: string, updates: Partial<Processo>) => Promise<void>;
  deleteProcesso: (id: string) => Promise<void>;
  addTarefa: (tarefa: Omit<Tarefa, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<void>;
  updateTarefa: (id: string, updates: Partial<Tarefa>) => Promise<void>;
  deleteTarefa: (id: string) => Promise<void>;
  addUsuario: (usuario: Omit<User, 'id' | 'criadoEm'>) => Promise<void>;
  updateUsuario: (id: number, updates: Partial<User>) => Promise<void>;
  deleteUsuario: (id: number) => Promise<void>;
  markNotificationAsRead: (id: number) => void;
  addNotification: (notification: Omit<Notificacao, 'id' | 'criadoEm'>) => void;
  updateEstatisticas: () => Promise<void>;
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROCESSOS'; payload: Processo[] }
  | { type: 'ADD_PROCESSO'; payload: Processo }
  | { type: 'UPDATE_PROCESSO'; payload: { id: string; updates: Partial<Processo> } }
  | { type: 'DELETE_PROCESSO'; payload: string }
  | { type: 'SET_TAREFAS'; payload: Tarefa[] }
  | { type: 'ADD_TAREFA'; payload: Tarefa }
  | { type: 'UPDATE_TAREFA'; payload: { id: string; updates: Partial<Tarefa> } }
  | { type: 'DELETE_TAREFA'; payload: string }
  | { type: 'SET_USUARIOS'; payload: User[] }
  | { type: 'ADD_USUARIO'; payload: User }
  | { type: 'UPDATE_USUARIO'; payload: { id: number; updates: Partial<User> } }
  | { type: 'DELETE_USUARIO'; payload: number }
  | { type: 'ADD_NOTIFICATION'; payload: Notificacao }
  | { type: 'MARK_NOTIFICATION_READ'; payload: number }
  | { type: 'UPDATE_ESTATISTICAS'; payload: Estatisticas };

const initialState: AppState = {
  user: null,
  processos: [],
  tarefas: [],
  usuarios: [],
  notificacoes: [],
  modelosProcessos: [],
  estatisticas: {
    processosAtivos: 0,
    tarefasPendentes: 0,
    tempoMedio: '0h',
    processosAtrasados: 0,
    tendencias: {
      processosAtivos: 0,
      tarefasPendentes: 0,
      tempoMedio: 0,
      processosAtrasados: 0,
    },
  },
  loading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PROCESSOS':
      return { ...state, processos: action.payload };
    case 'ADD_PROCESSO':
      return { ...state, processos: [...state.processos, action.payload] };
    case 'UPDATE_PROCESSO':
      return {
        ...state,
        processos: state.processos.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };
    case 'DELETE_PROCESSO':
      return {
        ...state,
        processos: state.processos.filter(p => p.id !== action.payload),
      };
    case 'SET_TAREFAS':
      return { ...state, tarefas: action.payload };
    case 'ADD_TAREFA':
      return { ...state, tarefas: [...state.tarefas, action.payload] };
    case 'UPDATE_TAREFA':
      return {
        ...state,
        tarefas: state.tarefas.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      };
    case 'DELETE_TAREFA':
      return {
        ...state,
        tarefas: state.tarefas.filter(t => t.id !== action.payload),
      };
    case 'SET_USUARIOS':
      return { ...state, usuarios: action.payload };
    case 'ADD_USUARIO':
      return { ...state, usuarios: [...state.usuarios, action.payload] };
    case 'UPDATE_USUARIO':
      return {
        ...state,
        usuarios: state.usuarios.map(u =>
          u.id === action.payload.id ? { ...u, ...action.payload.updates } : u
        ),
      };
    case 'DELETE_USUARIO':
      return {
        ...state,
        usuarios: state.usuarios.filter(u => u.id !== action.payload),
      };
    case 'ADD_NOTIFICATION':
      return { ...state, notificacoes: [...state.notificacoes, action.payload] };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notificacoes: state.notificacoes.map(n =>
          n.id === action.payload ? { ...n, lida: true } : n
        ),
      };
    case 'UPDATE_ESTATISTICAS':
      return { ...state, estatisticas: action.payload };
    default:
      return state;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Carregar dados do backend
  const loadData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Carregar dados em paralelo
      const [usuariosResult, processosResult, tarefasResult] = await Promise.allSettled([
        userAPI.getAll(),
        processAPI.getAll({ limit: 100 }), // Carregar mais processos
        taskAPI.getAll({ limit: 100 }) // Carregar mais tarefas
      ]);

      // Processar usuários
      if (usuariosResult.status === 'fulfilled') {
        dispatch({ type: 'SET_USUARIOS', payload: usuariosResult.value });
      } else {
        console.error('Erro ao carregar usuários:', usuariosResult.reason);
      }

      // Processar processos
      if (processosResult.status === 'fulfilled') {
        dispatch({ type: 'SET_PROCESSOS', payload: processosResult.value.processos });
      } else {
        console.error('Erro ao carregar processos:', processosResult.reason);
      }

      // Processar tarefas
      if (tarefasResult.status === 'fulfilled') {
        dispatch({ type: 'SET_TAREFAS', payload: tarefasResult.value.tarefas });
      } else {
        console.error('Erro ao carregar tarefas:', tarefasResult.reason);
      }

      // Atualizar estatísticas
      await updateEstatisticas();

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar dados do servidor' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    // Só carrega dados se houver usuário autenticado e token válido
    const token = localStorage.getItem('token');
    if (state.user && token) {
      loadData();
    }
  }, [state.user]);

  const calculateEstatisticas = (): Estatisticas => {
    const processosAtivos = state.processos.filter(p => p.status === 'em-andamento').length;
    const tarefasPendentes = state.tarefas.filter(t => t.status === 'pendente').length;
    const processosAtrasados = state.processos.filter(p => {
      if (!p.prazo || p.status === 'concluido') return false;
      try {
        const prazo = new Date(p.prazo);
        const hoje = new Date();
        return prazo < hoje;
      } catch (error) {
        console.warn('Data inválida encontrada:', p.prazo);
        return false;
      }
    }).length;

    const tarefasConcluidas = state.tarefas.filter(t => t.status === 'concluido');
    let tempoMedio = '0h';
    if (tarefasConcluidas.length > 0) {
      const totalHoras = tarefasConcluidas.reduce((acc, t) => acc + (t.horasGastas || 0), 0);
      const media = totalHoras / tarefasConcluidas.length;
      tempoMedio = `${Math.round(media)}h`;
    }

    return {
      processosAtivos,
      tarefasPendentes,
      tempoMedio,
      processosAtrasados,
      tendencias: {
        processosAtivos: 0, // Será calculado com dados históricos
        tarefasPendentes: 0,
        tempoMedio: 0,
        processosAtrasados: 0,
      },
    };
  };

  const updateEstatisticas = async () => {
    try {
      // Tentar obter estatísticas do backend
      const stats = await generalAPI.getDashboardStats();
      
      // Se o backend não retornar estatísticas, calcular localmente
      if (!stats || Object.keys(stats).length === 0) {
        const localStats = calculateEstatisticas();
        dispatch({ type: 'UPDATE_ESTATISTICAS', payload: localStats });
      } else {
        // Usar estatísticas do backend (adaptar conforme necessário)
        const adaptedStats = calculateEstatisticas(); // Por enquanto usar cálculo local
        dispatch({ type: 'UPDATE_ESTATISTICAS', payload: adaptedStats });
      }
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
      // Fallback para cálculo local
      const localStats = calculateEstatisticas();
      dispatch({ type: 'UPDATE_ESTATISTICAS', payload: localStats });
    }
  };

  // Funções CRUD para Processos
  const addProcesso = async (processoData: Omit<Processo, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Processo> => {
    try {
      const novoProcesso = await processAPI.create(processoData);
      dispatch({ type: 'ADD_PROCESSO', payload: novoProcesso });
      await updateEstatisticas();
      return novoProcesso;
    } catch (error) {
      console.error('Erro ao criar processo:', error);
      throw error;
    }
  };

  const updateProcesso = async (id: string, updates: Partial<Processo>) => {
    try {
      await processAPI.update(id, updates);
      dispatch({ type: 'UPDATE_PROCESSO', payload: { id, updates } });
      await updateEstatisticas();
    } catch (error) {
      console.error('Erro ao atualizar processo:', error);
      throw error;
    }
  };

  const deleteProcesso = async (id: string) => {
    try {
      await processAPI.delete(id);
      dispatch({ type: 'DELETE_PROCESSO', payload: id });
      // Remover tarefas associadas
      const tarefasAssociadas = state.tarefas.filter(t => t.processoId === id);
      tarefasAssociadas.forEach(t => {
        dispatch({ type: 'DELETE_TAREFA', payload: t.id });
      });
      await updateEstatisticas();
    } catch (error) {
      console.error('Erro ao deletar processo:', error);
      throw error;
    }
  };

  // Funções CRUD para Tarefas
  const addTarefa = async (tarefaData: Omit<Tarefa, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    try {
      const novaTarefa = await taskAPI.create(tarefaData);
      dispatch({ type: 'ADD_TAREFA', payload: novaTarefa });
      await updateEstatisticas();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      throw error;
    }
  };

  const updateTarefa = async (id: string, updates: Partial<Tarefa>) => {
    try {
      await taskAPI.update(id, updates);
      dispatch({ type: 'UPDATE_TAREFA', payload: { id, updates } });
      await updateEstatisticas();
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      throw error;
    }
  };

  const deleteTarefa = async (id: string) => {
    try {
      await taskAPI.delete(id);
      dispatch({ type: 'DELETE_TAREFA', payload: id });
      await updateEstatisticas();
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      throw error;
    }
  };

  // Funções CRUD para Usuários
  const addUsuario = async (usuarioData: Omit<User, 'id' | 'criadoEm'>) => {
    try {
      const novoUsuario = await userAPI.create(usuarioData);
      dispatch({ type: 'ADD_USUARIO', payload: novoUsuario });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  };

  const updateUsuario = async (id: number, updates: Partial<User>) => {
    try {
      await userAPI.update(id, updates);
      dispatch({ type: 'UPDATE_USUARIO', payload: { id, updates } });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const deleteUsuario = async (id: number) => {
    try {
      await userAPI.delete(id);
      dispatch({ type: 'DELETE_USUARIO', payload: id });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  };

  // Funções para Notificações (mantidas locais por enquanto)
  const markNotificationAsRead = (id: number) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  };

  const addNotification = (notification: Omit<Notificacao, 'id' | 'criadoEm'>) => {
    const newNotification: Notificacao = {
      ...notification,
      id: Date.now(),
      criadoEm: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
  };

  // Função para recarregar dados
  const refreshData = async () => {
    await loadData();
  };

  const setUser = (user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const value: AppContextType = {
    ...state,
    setUser,
    addProcesso,
    updateProcesso,
    deleteProcesso,
    addTarefa,
    updateTarefa,
    deleteTarefa,
    addUsuario,
    updateUsuario,
    deleteUsuario,
    markNotificationAsRead,
    addNotification,
    updateEstatisticas,
    loadData,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

