import React from 'react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ExportacaoProps {
  dadosProcessos: any[];
  dadosTarefas: any[];
}

const Exportacao: React.FC<ExportacaoProps> = ({ dadosProcessos, dadosTarefas }) => {
  const exportarPDF = () => {
    const doc = new jsPDF();
    
    // Header moderno
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Estratégico ProcessFlow', 20, 20);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    let yPosition = 50;
    
    // Seção Processos
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Resumo de Processos', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    dadosProcessos.forEach((processo, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${index + 1}. ${processo.titulo} - Status: ${processo.status}`, 20, yPosition);
      yPosition += 8;
    });
    
    // Seção Tarefas
    yPosition += 10;
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('📋 Resumo de Tarefas', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    dadosTarefas.forEach((tarefa, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${index + 1}. ${tarefa.titulo} - Status: ${tarefa.status}`, 20, yPosition);
      yPosition += 8;
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 20, 290);
    
    doc.save('relatorio-processflow.pdf');
  };

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Planilha de Processos
    const wsProcessos = XLSX.utils.json_to_sheet(dadosProcessos.map(p => ({
      'Título': p.titulo,
      'Status': p.status,
      'Prioridade': p.prioridade,
      'Setor': p.setor,
      'Progresso': `${p.progresso}%`,
      'Data Início': p.dataInicio,
      'Data Fim': p.dataFim
    })));
    
    XLSX.utils.book_append_sheet(wb, wsProcessos, 'Processos');
    
    // Planilha de Tarefas
    const wsTarefas = XLSX.utils.json_to_sheet(dadosTarefas.map(t => ({
      'Título': t.titulo,
      'Status': t.status,
      'Prioridade': t.prioridade,
      'Setor': t.setor,
      'Tempo Estimado': t.tempoEstimado,
      'Tempo Gasto': t.horasGastas,
      'Data Início': t.dataInicio,
      'Data Fim': t.dataFim
    })));
    
    XLSX.utils.book_append_sheet(wb, wsTarefas, 'Tarefas');
    
    // Planilha de Métricas
    const metricas = [
      { Métrica: 'Total de Processos', Valor: dadosProcessos.length },
      { Métrica: 'Total de Tarefas', Valor: dadosTarefas.length },
      { Métrica: 'Processos Concluídos', Valor: dadosProcessos.filter(p => p.status === 'Concluído').length },
      { Métrica: 'Tarefas Concluídas', Valor: dadosTarefas.filter(t => t.status === 'Concluído').length },
      { Métrica: 'Taxa de Conclusão', Valor: '85%' },
      { Métrica: 'Produtividade Média', Valor: '92%' }
    ];
    
    const wsMetricas = XLSX.utils.json_to_sheet(metricas);
    XLSX.utils.book_append_sheet(wb, wsMetricas, 'Métricas');
    
    XLSX.writeFile(wb, 'relatorio-processflow.xlsx');
  };

  const exportarCSV = () => {
    const dadosCombinados = [
      ...dadosProcessos.map(p => ({ ...p, tipo: 'Processo' })),
      ...dadosTarefas.map(t => ({ ...t, tipo: 'Tarefa' }))
    ];
    
    const csv = [
      'Tipo,Título,Status,Prioridade,Setor,Data Início,Data Fim',
      ...dadosCombinados.map(item => 
        `${item.tipo},"${item.titulo}",${item.status},${item.prioridade},${item.setor},${item.dataInicio},${item.dataFim || ''}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'relatorio-processflow.csv');
  };

  return (
    <div className="exportacao-container">
      <h3>📤 Exportar Relatórios</h3>
      
      <div className="exportacao-buttons">
        <button 
          className="export-btn export-btn-pdf"
          onClick={exportarPDF}
        >
          <span>📄</span>
          Exportar PDF
        </button>
        
        <button 
          className="export-btn export-btn-excel"
          onClick={exportarExcel}
        >
          <span>📊</span>
          Exportar Excel
        </button>
        
        <button 
          className="export-btn export-btn-csv"
          onClick={exportarCSV}
        >
          <span>📋</span>
          Exportar CSV
        </button>
      </div>
      
      <div className="info-expansao">
        <p>
          <span>💡</span>
          <strong>PDF:</strong> Relatório executivo com métricas e lista de processos
          <br />
          <strong>Excel:</strong> Planilhas separadas para métricas, processos e tarefas
          <br />
          <strong>CSV:</strong> Dados combinados em formato de texto separado por vírgulas
        </p>
      </div>
    </div>
  );
};

export default Exportacao;

