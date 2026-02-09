const fs = require('fs');
const path = require('path');
const { pool, closePool } = require('../src/config/database');

const runSchema = async () => {
  console.log('Executando schema do banco de dados...\n');
  
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Arquivo schema.sql carregado');
    console.log('ATENÇÃO: Este script irá DROPAR todas as tabelas existentes!\n');
    
    console.log('Executando SQL...\n');
    await pool.query(schemaSql);
    
    console.log('\nSchema executado com sucesso!');
    
    console.log('\nVerificando tabelas criadas...');
    const result = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log('\nTabelas criadas:');
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.tablename}`);
    });
    
    const views = await pool.query(`
      SELECT viewname 
      FROM pg_views 
      WHERE schemaname = 'public'
      ORDER BY viewname
    `);
    
    if (views.rows.length > 0) {
      console.log('\nViews criadas:');
      views.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.viewname}`);
      });
    }
    
    console.log('\nBanco de dados pronto para uso!');
    
  } catch (error) {
    console.error('\nErro ao executar schema:', error.message);
    if (error.position) {
      console.error('   Posição do erro:', error.position);
    }
    process.exit(1);
  } finally {
    await closePool();
  }
};

runSchema();
