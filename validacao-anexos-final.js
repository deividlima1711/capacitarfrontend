#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE VALIDAÇÃO FINAL - SISTEMA DE ANEXOS
 * 
 * Este script valida se todos os endpoints de anexos estão funcionando
 * corretamente após a migração completa para o sistema universal.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configurações
const BASE_URL = 'http://localhost:3000/api';
const TEST_CONFIG = {
  TEST_FILE: path.join(__dirname, 'teste-anexo.txt'),
  ENTITIES: [
    { type: 'tasks', id: '1', name: 'Tarefa Teste' },
    { type: 'processes', id: '1', name: 'Processo Teste' },
    { type: 'models', id: '1', name: 'Modelo Teste' }
  ]
};

// Cores para logs
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Criar arquivo de teste se não existir
function criarArquivoTeste() {
  if (!fs.existsSync(TEST_CONFIG.TEST_FILE)) {
    fs.writeFileSync(TEST_CONFIG.TEST_FILE, 'Este é um arquivo de teste para validação do sistema de anexos.');
    log(`📄 Arquivo de teste criado: ${TEST_CONFIG.TEST_FILE}`, 'blue');
  }
}

// Testar upload de anexo
async function testarUpload(entityType, entityId) {
  try {
    log(`\n📤 Testando upload para ${entityType}/${entityId}...`, 'blue');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_CONFIG.TEST_FILE));
    
    const response = await axios.post(`${BASE_URL}/${entityType}/${entityId}/anexos`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 10000
    });
    
    log(`✅ Upload bem-sucedido: ${response.status}`, 'green');
    log(`   Resposta: ${JSON.stringify(response.data, null, 2)}`);
    return response.data;
    
  } catch (error) {
    if (error.response?.status === 404) {
      log(`❌ ENDPOINT NÃO IMPLEMENTADO: POST /${entityType}/${entityId}/anexos`, 'red');
      log(`   Este endpoint precisa ser implementado no backend`, 'yellow');
    } else if (error.code === 'ECONNREFUSED') {
      log(`❌ SERVIDOR OFFLINE: Não foi possível conectar em ${BASE_URL}`, 'red');
    } else {
      log(`❌ Erro no upload: ${error.message}`, 'red');
      if (error.response) {
        log(`   Status: ${error.response.status}`);
        log(`   Dados: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
    return null;
  }
}

// Testar listagem de anexos
async function testarListagem(entityType, entityId) {
  try {
    log(`\n📋 Testando listagem para ${entityType}/${entityId}...`, 'blue');
    
    const response = await axios.get(`${BASE_URL}/${entityType}/${entityId}/anexos`, {
      timeout: 5000
    });
    
    log(`✅ Listagem bem-sucedida: ${response.status}`, 'green');
    log(`   Anexos encontrados: ${response.data.anexos?.length || 0}`);
    return response.data;
    
  } catch (error) {
    if (error.response?.status === 404) {
      log(`❌ ENDPOINT NÃO IMPLEMENTADO: GET /${entityType}/${entityId}/anexos`, 'red');
    } else if (error.code === 'ECONNREFUSED') {
      log(`❌ SERVIDOR OFFLINE`, 'red');
    } else {
      log(`❌ Erro na listagem: ${error.message}`, 'red');
    }
    return null;
  }
}

// Testar download de anexo
async function testarDownload(entityType, entityId, anexoId) {
  try {
    log(`\n💾 Testando download para ${entityType}/${entityId}/anexos/${anexoId}...`, 'blue');
    
    const response = await axios.get(`${BASE_URL}/${entityType}/${entityId}/anexos/${anexoId}/download`, {
      responseType: 'blob',
      timeout: 10000
    });
    
    log(`✅ Download bem-sucedido: ${response.status}`, 'green');
    return true;
    
  } catch (error) {
    if (error.response?.status === 404) {
      log(`❌ ENDPOINT NÃO IMPLEMENTADO: GET /${entityType}/${entityId}/anexos/${anexoId}/download`, 'red');
    } else {
      log(`❌ Erro no download: ${error.message}`, 'red');
    }
    return false;
  }
}

// Testar remoção de anexo
async function testarRemocao(entityType, entityId, anexoId) {
  try {
    log(`\n🗑️ Testando remoção para ${entityType}/${entityId}/anexos/${anexoId}...`, 'blue');
    
    const response = await axios.delete(`${BASE_URL}/${entityType}/${entityId}/anexos/${anexoId}`, {
      timeout: 5000
    });
    
    log(`✅ Remoção bem-sucedida: ${response.status}`, 'green');
    return true;
    
  } catch (error) {
    if (error.response?.status === 404) {
      log(`❌ ENDPOINT NÃO IMPLEMENTADO: DELETE /${entityType}/${entityId}/anexos/${anexoId}`, 'red');
    } else {
      log(`❌ Erro na remoção: ${error.message}`, 'red');
    }
    return false;
  }
}

// Teste completo para uma entidade
async function testarEntidade(entity) {
  log(`\n${'='.repeat(60)}`, 'yellow');
  log(`🧪 TESTANDO: ${entity.name.toUpperCase()} (${entity.type}/${entity.id})`, 'yellow');
  log(`${'='.repeat(60)}`, 'yellow');
  
  const resultados = {
    upload: false,
    listagem: false,
    download: false,
    remocao: false
  };
  
  // 1. Testar listagem inicial
  const listagemInicial = await testarListagem(entity.type, entity.id);
  if (listagemInicial) resultados.listagem = true;
  
  // 2. Testar upload
  const upload = await testarUpload(entity.type, entity.id);
  if (upload) {
    resultados.upload = true;
    
    // 3. Testar listagem após upload
    const listagemDepois = await testarListagem(entity.type, entity.id);
    
    // 4. Se temos anexos, testar download e remoção
    if (upload.id) {
      const downloadOk = await testarDownload(entity.type, entity.id, upload.id);
      if (downloadOk) resultados.download = true;
      
      const remocaoOk = await testarRemocao(entity.type, entity.id, upload.id);
      if (remocaoOk) resultados.remocao = true;
    }
  }
  
  return resultados;
}

// Gerar relatório final
function gerarRelatorio(resultados) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`📊 RELATÓRIO FINAL DE VALIDAÇÃO`, 'cyan');
  log(`${'='.repeat(80)}`, 'cyan');
  
  let totalTestes = 0;
  let testesOk = 0;
  
  resultados.forEach(({ entity, resultado }) => {
    log(`\n🔍 ${entity.name} (${entity.type}):`);
    
    Object.entries(resultado).forEach(([operacao, sucesso]) => {
      totalTestes++;
      if (sucesso) {
        testesOk++;
        log(`   ✅ ${operacao}: OK`, 'green');
      } else {
        log(`   ❌ ${operacao}: FALHOU`, 'red');
      }
    });
  });
  
  const percentual = Math.round((testesOk / totalTestes) * 100);
  
  log(`\n📈 RESUMO:`, 'cyan');
  log(`   Total de testes: ${totalTestes}`);
  log(`   Testes aprovados: ${testesOk}`, testesOk === totalTestes ? 'green' : 'yellow');
  log(`   Taxa de sucesso: ${percentual}%`, percentual === 100 ? 'green' : percentual >= 75 ? 'yellow' : 'red');
  
  if (percentual < 100) {
    log(`\n⚠️ AÇÕES NECESSÁRIAS:`, 'yellow');
    log(`   1. Implementar endpoints em falta no backend`);
    log(`   2. Verificar se o servidor está rodando`);
    log(`   3. Validar configuração de CORS`);
    log(`   4. Consultar documentação: BACKEND_ANEXOS_EXEMPLO.md`);
  } else {
    log(`\n🎉 PARABÉNS! Todos os endpoints estão funcionando!`, 'green');
  }
}

// Função principal
async function main() {
  log(`🚀 INICIANDO VALIDAÇÃO DO SISTEMA DE ANEXOS`, 'magenta');
  log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
  log(`🌐 URL Base: ${BASE_URL}`);
  
  // Criar arquivo de teste
  criarArquivoTeste();
  
  // Testar todas as entidades
  const resultados = [];
  
  for (const entity of TEST_CONFIG.ENTITIES) {
    const resultado = await testarEntidade(entity);
    resultados.push({ entity, resultado });
    
    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Gerar relatório
  gerarRelatorio(resultados);
  
  // Limpar arquivo de teste
  if (fs.existsSync(TEST_CONFIG.TEST_FILE)) {
    fs.unlinkSync(TEST_CONFIG.TEST_FILE);
    log(`\n🧹 Arquivo de teste removido`, 'blue');
  }
  
  log(`\n✨ Validação concluída!`, 'magenta');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log(`\n💥 ERRO CRÍTICO: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { main, testarEntidade };
