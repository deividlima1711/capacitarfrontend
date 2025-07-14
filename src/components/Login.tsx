import React, { useState, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI } from '../services/api';
import './Login.css';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const usernameRef = useRef<HTMLInputElement>(null);

  // Função utilitária para validar formato JWT
  const isValidJWT = (token: string): boolean => {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    return parts.every(part => part.length > 0);
  };

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  function getResponseData(resp: any) {
    if (resp && typeof resp === 'object' && 'data' in resp && resp.data) {
      return resp.data;
    }
    return resp;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Iniciando login para:', username);
      
      // Login APENAS com backend real - sem fallbacks
      const response = await authAPI.login(username, password);
      const resData = getResponseData(response);
      
      console.log('📥 Resposta do backend:', resData);
      console.log('🔑 Token recebido:', resData.token ? 'Presente' : 'Ausente');
      console.log('👤 Usuário recebido:', resData.user ? resData.user.nome : 'Ausente');
      
      // Busca o token e usuário
      const token = resData.token || resData.access_token || '';
      const user = resData.user || null;
      
      if (!token) {
        console.error('❌ Token não recebido do backend');
        setError('Token não recebido do servidor.');
        clearAuthData();
        setUsername('');
        setPassword('');
        setTimeout(() => usernameRef.current?.focus(), 100);
        setLoading(false);
        return;
      }
      
      if (!user) {
        console.error('❌ Dados do usuário não recebidos do backend');
        setError('Dados do usuário não recebidos do servidor.');
        clearAuthData();
        setUsername('');
        setPassword('');
        setTimeout(() => usernameRef.current?.focus(), 100);
        setLoading(false);
        return;
      }
      
      // Valida formato do JWT
      if (!isValidJWT(token)) {
        console.error('❌ Token JWT inválido recebido');
        setError('Token JWT inválido recebido do servidor');
        clearAuthData();
        setUsername('');
        setPassword('');
        setTimeout(() => usernameRef.current?.focus(), 100);
        setLoading(false);
        return;
      }
      
      // Decodifica o JWT de forma segura
      type JwtPayload = { exp?: number; [key: string]: any };
      let decoded: JwtPayload | null = null;
      try {
        decoded = jwtDecode<JwtPayload>(token);
        console.log('🔓 Token JWT decodificado com sucesso');
      } catch (decodeError) {
        console.error('❌ Erro ao decodificar JWT:', decodeError);
        setError('Token JWT inválido recebido do servidor');
        clearAuthData();
        setUsername('');
        setPassword('');
        setTimeout(() => usernameRef.current?.focus(), 100);
        setLoading(false);
        return;
      }
      
      // Verifica expiração
      if (decoded && decoded.exp && Date.now() / 1000 > decoded.exp) {
        console.error('❌ Token JWT expirado');
        setError('Sessão expirada. Faça login novamente.');
        clearAuthData();
        setUsername('');
        setPassword('');
        setTimeout(() => usernameRef.current?.focus(), 100);
        setLoading(false);
        return;
      }
      
      // Login bem-sucedido
      console.log('✅ Login validado, armazenando dados e redirecionando...');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Chamar callback de sucesso
      onLoginSuccess(user, token);
      
    } catch (err: any) {
      console.error('❌ Erro no login:', err);
      console.error('❌ Detalhes:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Erro ao conectar com o servidor'
      );
      clearAuthData();
      setUsername('');
      setPassword('');
      setTimeout(() => usernameRef.current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // Função removida: fillAdminCredentials e handleCredentialClick
  // Sistema usa APENAS usuários reais do backend, sem credenciais demo

  return (
    <div className="login-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
      padding: 0
    }}>
      <div className="login-card" style={{
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        padding: '40px 32px 32px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0
      }}>
        <img
          src="/Logo.png"
          alt="Logo"
          style={{
            height: '100px',
            marginTop: '40px', // desce a logo
            marginBottom: '20px',
            maxWidth: '500px',
            width: '100%',
            display: 'block',
            objectFit: 'contain',
          }}
        />
        <p
          style={{
            fontSize: '1.3em',
            fontWeight: 400,
            marginBottom: 28,
            textAlign: 'center',
            color: '#444',
          }}
        >
          Sistema de Gestão de Processos
        </p>
        <form onSubmit={handleSubmit} className="login-form" style={{ width: '100%' }}>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: 6, color: '#333', fontWeight: 500 }}>Usuário:</label>
            <input
              type="text"
              id="username"
              ref={usernameRef}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Digite seu usuário"
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d0d0d0', fontSize: 15 }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: 6, color: '#333', fontWeight: 500 }}>Senha:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Digite sua senha"
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d0d0d0', fontSize: 15 }}
            />
          </div>
          {error && <div className="error-message" style={{ color: '#d32f2f', marginBottom: 12, textAlign: 'center' }}>{error}</div>}
          <button type="submit" disabled={loading} className="login-button" style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 6,
            background: 'linear-gradient(90deg, #6dd5ed 0%, #2193b0 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            border: 'none',
            marginBottom: 18,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        {/* Componente DemoCredentials removido - sistema usa APENAS usuários reais do backend */}
      </div>
    </div>
  );
};

export default Login;
