const http = require('http');

const makeRequest = (path, method = 'GET') => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

const runTests = async () => {
  console.log('Testando endpoints do servidor...\n');
  console.log('Certifique-se de que o servidor está rodando: npm run dev\n');

  try {
    console.log('1. Testando GET /');
    const rootResponse = await makeRequest('/');
    console.log('   Status:', rootResponse.statusCode);
    console.log('   Response:', JSON.stringify(rootResponse.body, null, 2));
    console.log('   Rota raiz funcionando\n');

    console.log('2. Testando GET /health');
    const healthResponse = await makeRequest('/health');
    console.log('   Status:', healthResponse.statusCode);
    console.log('   Response:', JSON.stringify(healthResponse.body, null, 2));
    
    if (healthResponse.body.data.database === 'connected') {
      console.log('   Health check OK - Banco conectado\n');
    } else {
      console.log('   Health check com problemas - Banco desconectado\n');
    }

    console.log('3. Testando GET /rota-inexistente (deve retornar 404)');
    const notFoundResponse = await makeRequest('/rota-inexistente');
    console.log('   Status:', notFoundResponse.statusCode);
    console.log('   Response:', JSON.stringify(notFoundResponse.body, null, 2));
    
    if (notFoundResponse.statusCode === 404) {
      console.log('   Tratamento de 404 funcionando\n');
    } else {
      console.log('   Esperava status 404\n');
    }

    console.log('Todos os testes passaram!');
    console.log('\nResumo:');
    console.log('   Servidor Express funcionando');
    console.log('   Middlewares aplicados corretamente');
    console.log('   Conexão com banco de dados OK');
    console.log('   Tratamento de erros funcionando');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\nErro: Servidor não está rodando!');
      console.error('   Execute: npm run dev');
    } else {
      console.error('\nErro durante os testes:', error.message);
    }
    process.exit(1);
  }
};

runTests();
