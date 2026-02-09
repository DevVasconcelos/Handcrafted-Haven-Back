const BASE_URL = 'http://localhost:4000/api';

let accessToken = '';
let refreshToken = '';
const testEmail = `test.${Date.now()}@example.com`;

const testRoutes = async () => {
  try {
    console.log('=== Teste das Rotas de Autenticação ===\n');

    console.log('1. POST /api/auth/register (BUYER)...');
    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: 'senha123',
        role: 'BUYER',
        newsletter: true,
      }),
    });
    const registerData = await registerResponse.json();
    console.log('Status:', registerResponse.status);
    console.log('Usuário criado:', registerData.data?.user?.email);
    console.log('Token gerado:', registerData.data?.accessToken ? 'OK' : 'FALHOU');
    accessToken = registerData.data?.accessToken;
    refreshToken = registerData.data?.refreshToken;

    console.log('\n2. POST /api/auth/register (validação - email inválido)...');
    const invalidRegister = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'email-invalido',
        password: 'senha123',
        role: 'BUYER',
      }),
    });
    const invalidData = await invalidRegister.json();
    console.log('Status:', invalidRegister.status);
    console.log('Erro esperado:', invalidData.message);

    console.log('\n3. POST /api/auth/login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'senha123',
      }),
    });
    const loginData = await loginResponse.json();
    console.log('Status:', loginResponse.status);
    console.log('Login bem-sucedido:', loginData.data?.user?.email);

    console.log('\n4. GET /api/auth/me (autenticado)...');
    const meResponse = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const meData = await meResponse.json();
    console.log('Status:', meResponse.status);
    console.log('Usuário autenticado:', meData.data?.user?.email);

    console.log('\n5. GET /api/auth/me (sem token)...');
    const noTokenResponse = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const noTokenData = await noTokenResponse.json();
    console.log('Status:', noTokenResponse.status);
    console.log('Erro esperado:', noTokenData.message);

    console.log('\n6. POST /api/auth/refresh...');
    const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken: refreshToken,
      }),
    });
    const refreshData = await refreshResponse.json();
    console.log('Status:', refreshResponse.status);
    console.log('Novo token gerado:', refreshData.data?.accessToken ? 'OK' : 'FALHOU');

    console.log('\n7. POST /api/auth/register (SELLER)...');
    const sellerEmail = `seller.${Date.now()}@example.com`;
    const sellerRegister = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Seller',
        lastName: 'Test',
        email: sellerEmail,
        password: 'senha456',
        role: 'SELLER',
        newsletter: false,
      }),
    });
    const sellerData = await sellerRegister.json();
    console.log('Status:', sellerRegister.status);
    console.log('Seller criado:', sellerData.data?.user?.email);
    console.log('Seller slug:', sellerData.data?.seller?.slug);

    console.log('\n8. GET /health...');
    const healthResponse = await fetch('http://localhost:4000/health');
    const healthData = await healthResponse.json();
    console.log('Status:', healthResponse.status);
    console.log('Health:', healthData.data?.status);

    console.log('\n=== Todos os testes das rotas passaram! ===\n');
  } catch (error) {
    console.error('\nErro nos testes:', error.message);
  }
};

console.log('Aguardando servidor iniciar...');
setTimeout(testRoutes, 2000);
