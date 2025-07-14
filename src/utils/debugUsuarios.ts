/**
 * Ferramenta de debug para testar o carregamento de usuários
 * Arquivo temporário para diagnosticar problemas de carregamento
 */

export const debugUsuarios = async () => {
  console.log('🔍 [DEBUG] === INICIANDO DEBUG DE USUÁRIOS ===');
  
  // Verificar localStorage
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('🔍 [DEBUG] Token no localStorage:', token ? `${token.substring(0, 30)}...` : 'NENHUM');
  console.log('🔍 [DEBUG] User no localStorage:', user ? 'PRESENTE' : 'NENHUM');
  
  if (token) {
    try {
      // Testar requisição direta
      const API_URL = process.env.REACT_APP_API_URL || 'https://capacitarbackendoficial-production.up.railway.app/api';
      
      console.log('🔍 [DEBUG] URL da API:', API_URL);
      
      const response = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 [DEBUG] Status da resposta:', response.status);
      console.log('🔍 [DEBUG] Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [DEBUG] Dados recebidos:', data);
        console.log('🔍 [DEBUG] Quantidade de usuários:', data.users?.length || 'N/A');
      } else {
        const errorText = await response.text();
        console.error('❌ [DEBUG] Erro na requisição:', errorText);
      }
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro de rede:', error);
    }
  }
  
  console.log('🔍 [DEBUG] === FIM DO DEBUG DE USUÁRIOS ===');
};

// Para executar no console do navegador:
// debugUsuarios();
