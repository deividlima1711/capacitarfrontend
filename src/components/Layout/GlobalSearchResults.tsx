import React, { useState } from 'react';
import { User, Processo, Tarefa } from '../../types';

interface GlobalSearchResultsProps {
  query: string;
  users: User[];
  processos: Processo[];
  tarefas: Tarefa[];
  onNavigate: (type: 'user' | 'processo' | 'tarefa', id: string | number) => void;
}

const highlight = (text: string, query: string) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.split(regex).map((part, i) =>
    regex.test(part) ? <mark key={i}>{part}</mark> : part
  );
};

const GlobalSearchResults: React.FC<GlobalSearchResultsProps> = ({ query, users, processos, tarefas, onNavigate }) => {
  const [anexosModal, setAnexosModal] = useState<{titulo: string, anexos: string[]} | null>(null);

  // Função mock: retorna anexos fictícios para cada tarefa
  const getAnexos = (tarefaId: string) => {
    // Aqui você pode integrar com o backend ou contexto real
    // Por enquanto, retorna anexos de exemplo
    return [
      `Manual_${tarefaId}.pdf`,
      `Instrucoes_${tarefaId}.docx`
    ];
  };

  if (!query) return null;
  const hasResults = users.length || processos.length || tarefas.length;
  return (
    <div className="global-search-results">
      {!hasResults && <div className="no-results">Nenhum resultado encontrado.</div>}
      {!!users.length && (
        <div className="search-section">
          <h4>Usuários</h4>
          <ul>
            {users.map(u => (
              <li key={u.id} onClick={() => onNavigate('user', u.id)}>
                {highlight(u.nome || u.username, query)} <small>({u.email})</small>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!!processos.length && (
        <div className="search-section">
          <h4>Processos</h4>
          <ul>
            {processos.map(p => (
              <li key={p.id} onClick={() => onNavigate('processo', p.id)}>
                {highlight(p.titulo, query)} <small>({p.status})</small>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!!tarefas.length && (
        <div className="search-section">
          <h4>Tarefas</h4>
          <ul>
            {tarefas.map(t => (
              <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1, cursor: 'pointer' }} onClick={() => onNavigate('tarefa', t.id)}>
                  {highlight(t.titulo, query)} <small>({t.status})</small>
                </span>
                <button
                  title="Visualizar anexos"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0052cc', fontSize: 18 }}
                  onClick={e => {
                    e.stopPropagation();
                    setAnexosModal({ titulo: t.titulo, anexos: getAnexos(t.id) });
                  }}
                >
                  <span className="material-icons">attach_file</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {anexosModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setAnexosModal(null)}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 24, minWidth: 320, maxWidth: 400, boxShadow: '0 4px 16px rgba(0,0,0,0.13)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Anexos de "{anexosModal.titulo}"</h3>
            <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
              {anexosModal.anexos.map((anexo, idx) => (
                <li key={idx} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-icons" style={{ fontSize: 18, color: '#0052cc' }}>description</span>
                  <span>{anexo}</span>
                </li>
              ))}
            </ul>
            <button style={{ marginTop: 16 }} className="btn btn-primary" onClick={() => setAnexosModal(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearchResults;
