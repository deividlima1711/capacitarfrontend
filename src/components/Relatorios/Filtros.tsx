import React from 'react';
import { FiltrosRelatorio } from '../../hooks/useRelatorios';

interface FiltrosProps {
  filtros: FiltrosRelatorio;
  setFiltros: (filtros: FiltrosRelatorio) => void;
  limparFiltros: () => void;
  usuarios: Array<{
    id: number;
    nome: string;
    setor: string;
  }>;
}

const Filtros: React.FC<FiltrosProps> = ({ filtros, setFiltros, limparFiltros, usuarios }) => {
  const handleFiltroChange = (campo: keyof FiltrosRelatorio, valor: string) => {
    setFiltros({
      ...filtros,
      [campo]: valor
    });
  };

  const setores = Array.from(new Set(usuarios.map(u => u.setor)));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filtro de Período */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Período
          </label>
          <select
            value={filtros.periodo}
            onChange={(e) => handleFiltroChange('periodo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos os períodos</option>
            <option value="ultima-semana">Última semana</option>
            <option value="ultimo-mes">Último mês</option>
            <option value="ultimo-trimestre">Último trimestre</option>
          </select>
        </div>

        {/* Filtro de Responsável */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Responsável
          </label>
          <select
            value={filtros.responsavel}
            onChange={(e) => handleFiltroChange('responsavel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos os responsáveis</option>
            {usuarios.map(usuario => (
              <option key={usuario.id} value={usuario.id.toString()}>
                {usuario.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filtros.status}
            onChange={(e) => handleFiltroChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="em-andamento">Em Andamento</option>
            <option value="concluido">Concluído</option>
            <option value="atrasado">Atrasado</option>
          </select>
        </div>

        {/* Filtro de Setor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Setor
          </label>
          <select
            value={filtros.setor}
            onChange={(e) => handleFiltroChange('setor', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos os setores</option>
            {setores.map(setor => (
              <option key={setor} value={setor}>
                {setor}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botão para limpar filtros */}
      <div className="mt-4">
        <button
          onClick={limparFiltros}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};

export default Filtros;

