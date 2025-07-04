import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';

export interface FiltrosRelatorio {
  periodo: string;
  responsavel: string;
  status: string;
  setor: string;
  empresaId?: number;
}

export const useRelatorios = () => {
  const { processos, tarefas, usuarios } = useApp();
  
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    periodo: 'todos',
    responsavel: 'todos',
    status: 'todos',
    setor: 'todos',
    empresaId: 1 // Default para primeira empresa
  });

  // Dados filtrados baseados nos filtros atuais
  const dadosFiltrados = useMemo(() => {
    let processosFiltered = [...processos];
    let tarefasFiltered = [...tarefas];
    let usuariosFiltered = [...usuarios];

    // Aplicar filtros de período
    if (filtros.periodo !== 'todos') {
      const hoje = new Date();
      let dataLimite = new Date();
      
      switch (filtros.periodo) {
        case 'ultima-semana':
          dataLimite.setDate(hoje.getDate() - 7);
          break;
        case 'ultimo-mes':
          dataLimite.setMonth(hoje.getMonth() - 1);
          break;
        case 'ultimo-trimestre':
          dataLimite.setMonth(hoje.getMonth() - 3);
          break;
      }
      
      processosFiltered = processosFiltered.filter(p => new Date(p.dataInicio) >= dataLimite);
      tarefasFiltered = tarefasFiltered.filter(t => new Date(t.dataInicio) >= dataLimite);
    }

    // Aplicar filtro de responsável
    if (filtros.responsavel !== 'todos') {
      const responsavelId = parseInt(filtros.responsavel);
      processosFiltered = processosFiltered.filter(p => p.responsavelId === responsavelId);
      tarefasFiltered = tarefasFiltered.filter(t => t.responsavelId === responsavelId);
    }

    // Aplicar filtro de status
    if (filtros.status !== 'todos') {
      processosFiltered = processosFiltered.filter(p => p.status === filtros.status);
      tarefasFiltered = tarefasFiltered.filter(t => t.status === filtros.status);
    }

    // Aplicar filtro de setor (usando departamento do usuário)
    if (filtros.setor !== 'todos') {
      const usuariosDoSetor = usuarios.filter(u => u.departamento === filtros.setor);
      const idsUsuariosSetor = usuariosDoSetor.map(u => u.id);
      
      processosFiltered = processosFiltered.filter(p => idsUsuariosSetor.includes(p.responsavelId));
      tarefasFiltered = tarefasFiltered.filter(t => idsUsuariosSetor.includes(t.responsavelId));
    }

    return { 
      processos: processosFiltered, 
      tarefas: tarefasFiltered, 
      usuarios: usuariosFiltered 
    };
  }, [filtros, processos, tarefas, usuarios]);

  // Calcular métricas resumo
  const metricas = useMemo(() => {
    const { processos: processosFiltered, tarefas: tarefasFiltered } = dadosFiltrados;
    
    return {
      processosEmAndamento: processosFiltered.filter(p => p.status === 'em-andamento').length,
      processosConcluidos: processosFiltered.filter(p => p.status === 'concluido').length,
      processosAtrasados: processosFiltered.filter(p => p.status === 'atrasado').length,
      tarefasConcluidas: tarefasFiltered.filter(t => t.status === 'concluido').length,
      tarefasAtrasadas: tarefasFiltered.filter(t => t.status === 'atrasado').length,
      totalProcessos: processosFiltered.length,
      totalTarefas: tarefasFiltered.length
    };
  }, [dadosFiltrados]);

  // Dados para gráficos
  const dadosGraficos = useMemo(() => {
    const { processos: processosFiltered, tarefas: tarefasFiltered, usuarios: usuariosFiltered } = dadosFiltrados;

    // Gráfico de pizza - Distribuição de status dos processos
    const statusDistribuicao = {
      labels: ['Em Andamento', 'Concluído', 'Atrasado', 'Pendente'],
      datasets: [{
        label: 'Processos por Status',
        data: [
          processosFiltered.filter(p => p.status === 'em-andamento').length,
          processosFiltered.filter(p => p.status === 'concluido').length,
          processosFiltered.filter(p => p.status === 'atrasado').length,
          processosFiltered.filter(p => p.status === 'pendente').length
        ],
        backgroundColor: [
          '#3B82F6', // Azul
          '#10B981', // Verde
          '#EF4444', // Vermelho
          '#F59E0B'  // Amarelo
        ]
      }]
    };

    // Gráfico de barras - Volume de tarefas por usuário
    const tarefasPorUsuario = {
      labels: usuariosFiltered.map(u => u.nome),
      datasets: [{
        label: 'Tarefas por Usuário',
        data: usuariosFiltered.map(u => tarefasFiltered.filter(t => t.responsavelId === u.id).length),
        backgroundColor: '#3B82F6'
      }]
    };

    // Gráfico de linha - Evolução mensal (baseado em dados reais)
    const mesesLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const processosPorMes = mesesLabels.map((_, index) => {
      const mesAtual = new Date();
      mesAtual.setMonth(mesAtual.getMonth() - (5 - index));
      return processosFiltered.filter(p => {
        const dataProcesso = new Date(p.dataInicio);
        return dataProcesso.getMonth() === mesAtual.getMonth() && 
               dataProcesso.getFullYear() === mesAtual.getFullYear();
      }).length;
    });

    const evolucaoMensal = {
      labels: mesesLabels,
      datasets: [{
        label: 'Processos Criados',
        data: processosPorMes,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }]
    };

    return {
      statusDistribuicao,
      tarefasPorUsuario,
      evolucaoMensal
    };
  }, [dadosFiltrados]);

  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltros({
      periodo: 'todos',
      responsavel: 'todos',
      status: 'todos',
      setor: 'todos',
      empresaId: 1
    });
  };

  // Mock de empresas para compatibilidade (será removido quando implementar no backend)
  const empresas = [
    { id: 1, nome: 'Empresa Principal', setor: 'Geral' }
  ];

  return {
    filtros,
    setFiltros,
    limparFiltros,
    dadosFiltrados,
    metricas,
    dadosGraficos,
    empresas,
    usuarios,
    filtrarDadosPorEmpresa: () => dadosFiltrados // Compatibilidade
  };
};

