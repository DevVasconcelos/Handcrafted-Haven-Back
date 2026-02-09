const { testConnection, closePool } = require('../config/database');
const { query } = require('./query');

const runTests = async () => {
  console.log('Iniciando testes de conexão...\n');
  
  try {
    console.log('1. Testando conexão básica...');
    await testConnection();
    
    console.log('\n2. Testando query simples...');
    const result = await query('SELECT version()');
    console.log('Versão do PostgreSQL:', result.rows[0].version.split(',')[0]);
    
    console.log('\n3. Verificando tabelas no banco...');
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('Tabelas encontradas:');
      tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    } else {
      console.log('Nenhuma tabela encontrada. Execute o script schema.sql para criar as tabelas.');
    }
    
    console.log('\nTodos os testes passaram com sucesso!');
    
  } catch (error) {
    console.error('\nErro durante os testes:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
};

runTests();
