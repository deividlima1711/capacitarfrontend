import React, { useState } from 'react';
import { authAPI } from '../services/api';
import DemoCredentials from './DemoCredentials';
import './Login.css';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt_decode = require('jwt-decode');

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Login com backend real
      const response = await authAPI.login(username, password);
      
      if (response.token && response.user) {
        // Valida formato do JWT
        if (!isValidJWT(response.token)) {
          setError('Token JWT inválido recebido do servidor');
          clearAuthData();
          setLoading(false);
          return;
        }
        // Decodifica o JWT de forma segura
        try {
          const decoded = jwt_decode(response.token);
          // Verifica expiração (se existir exp no payload)
          if (decoded && decoded.exp && Date.now() / 1000 > decoded.exp) {
            setError('Sessão expirada. Faça login novamente.');
            clearAuthData();
            setLoading(false);
            return;
          }
          // Login bem-sucedido
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          // Opcional: usar sessionStorage para mais segurança
          // sessionStorage.setItem('token', response.token);
          // sessionStorage.setItem('user', JSON.stringify(response.user));
          onLoginSuccess(response.user, response.token);
        } catch (decodeError) {
          console.error('Erro ao decodificar o token JWT:', decodeError);
          setError('Token JWT inválido recebido do servidor');
          clearAuthData();
          setLoading(false);
          return;
        }
      } else {
        setError('Resposta inválida do servidor');
        clearAuthData();
      }
    } catch (err: any) {
      console.error('Erro no login:', err.message);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Erro ao conectar com o servidor'
      );
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setUsername('admin');
    setPassword('Lima12345');
  };

  const handleCredentialClick = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(''); // Limpar erros anteriores
  };

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
        
        <DemoCredentials onCredentialClick={handleCredentialClick} />
      </div>
    </div>
  );
};

export default Login;
