/**
 * Configuração do Backend - Usuários Reais Apenas
 * 
 * Este arquivo garante que o sistema use apenas usuários reais do backend,
 * removendo qualquer dependência de dados mockados ou locais.
 */

const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://capacitarbackendoficial-production.up.railway.app';

/**
 * Valida se o sistema está configurado para usar apenas o backend real
 */
export const validateBackendConfig = (): void => {
  console.log('🔧 Validando configuração do backend...');
  
  // Verificar URL do backend
  if (!BACKEND_URL) {
    throw new Error('❌ URL do backend não configurada');
  }
  
  console.log('✅ Backend URL:', BACKEND_URL);
  
  // Garantir que não há flags de modo mock ativas
  localStorage.removeItem('useMockData');
  
  // Limpar qualquer dados de usuários mockados antigos
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      // Se o usuário foi criado localmente (sem dados reais do backend), remover
      if (!user.criadoEm || user.id === 1 || user.username === 'admin') {
        console.warn('⚠️ Removendo dados de usuário possivelmente mockados');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao validar usuário salvo, removendo:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }
  
  console.log('✅ Sistema configurado para usar apenas usuários reais do backend');
};

/**
 * Força o uso exclusivo do backend real
 */
export const enforceRealUsersOnly = (): void => {
  // Remover qualquer flag de modo de desenvolvimento
  localStorage.removeItem('useMockData');
  localStorage.removeItem('useLocalData');
  localStorage.removeItem('offlineMode');
  
  console.log('🚀 Modo exclusivo de backend real ativado');
};

/**
 * Verifica se há conexão com o backend
 */
export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('❌ Falha na conexão com o backend:', error);
    return false;
  }
};

export { BACKEND_URL };
