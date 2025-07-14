/**
 * Configuração para garantir que o sistema ProcessFlow use APENAS usuários reais do backend.
 * Este arquivo foi criado para deixar explícito que não devem existir:
 * - Usuários mock/fake
 * - Dados locais/localStorage como usuários
 * - Modo offline com usuários simulados
 * - Fallbacks para dados mockados
 */

export const REAL_USERS_ONLY_CONFIG = {
  // Backend URL base - deve sempre estar definida
  BACKEND_URL: process.env.REACT_APP_API_URL || 'https://capacitarbackendoficial-production.up.railway.app/api',
  
  // Configurações rígidas - NUNCA alterar para true
  ALLOW_MOCK_DATA: false,
  ALLOW_LOCAL_USERS: false,
  ALLOW_OFFLINE_MODE: false,
  ALLOW_DEMO_CREDENTIALS: false,
  
  // Configurações de validação
  REQUIRE_BACKEND_CONNECTION: true,
  VALIDATE_JWT_TOKENS: true,
  ENFORCE_REAL_USER_DATA: true,
} as const;

/**
 * Valida se o sistema está configurado corretamente para usar apenas usuários reais
 */
export const validateRealUsersOnlyConfig = (): boolean => {
  // Verificar se não há flags de mock ativas
  const mockFlags = ['useMockData', 'useLocalData', 'offlineMode', 'demoMode'];
  const hasActiveMockFlags = mockFlags.some(flag => 
    localStorage.getItem(flag) === 'true' || sessionStorage.getItem(flag) === 'true'
  );
  
  if (hasActiveMockFlags) {
    console.error('❌ ERRO: Flags de modo mock detectadas no localStorage/sessionStorage');
    return false;
  }
  
  // Verificar se o backend URL está definido
  if (!REAL_USERS_ONLY_CONFIG.BACKEND_URL) {
    console.error('❌ ERRO: URL do backend não está definida');
    return false;
  }
  
  // Verificar se as configurações estão corretas
  if (REAL_USERS_ONLY_CONFIG.ALLOW_MOCK_DATA ||
      REAL_USERS_ONLY_CONFIG.ALLOW_LOCAL_USERS ||
      REAL_USERS_ONLY_CONFIG.ALLOW_OFFLINE_MODE ||
      REAL_USERS_ONLY_CONFIG.ALLOW_DEMO_CREDENTIALS) {
    console.error('❌ ERRO: Configurações de mock/local ainda estão habilitadas');
    return false;
  }
  
  console.log('✅ Configuração validada: Sistema usando APENAS usuários reais do backend');
  return true;
};

/**
 * Limpa qualquer dados de usuários mock que possam existir
 */
export const clearMockUserData = (): void => {
  const itemsToRemove = [
    'useMockData',
    'useLocalData', 
    'offlineMode',
    'demoMode',
    'mockUsers',
    'localUsers',
    'demoUsers'
  ];
  
  itemsToRemove.forEach(item => {
    localStorage.removeItem(item);
    sessionStorage.removeItem(item);
  });
  
  console.log('🧹 Dados de usuários mock limpos');
};

/**
 * Inicialização para garantir que apenas usuários reais sejam usados
 */
export const initializeRealUsersOnly = (): void => {
  console.log('🔒 Inicializando modo "Usuários Reais Apenas"');
  
  // Limpar dados mock
  clearMockUserData();
  
  // Validar configuração
  const isValid = validateRealUsersOnlyConfig();
  
  if (!isValid) {
    console.error('❌ FALHA na inicialização do modo "Usuários Reais Apenas"');
    throw new Error('Sistema não está configurado corretamente para usar apenas usuários reais');
  }
  
  console.log('✅ Sistema configurado com sucesso para usar APENAS usuários reais do backend');
  console.log(`🌐 Backend URL: ${REAL_USERS_ONLY_CONFIG.BACKEND_URL}`);
};
