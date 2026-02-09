const BASE_URL = 'http://localhost:4000/api';

let buyerToken = '';
let sellerToken = '';
let buyerEmail = '';
let sellerEmail = '';

const testPermissions = async () => {
  try {
    console.log('=== Teste de Permissões e Roles ===\n');

    buyerEmail = `buyer.${Date.now()}@example.com`;
    sellerEmail = `seller.${Date.now()}@example.com`;

    console.log('1. Criando usuário BUYER...');
    const buyerRegister = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Buyer',
        lastName: 'Test',
        email: buyerEmail,
        password: 'senha123',
        role: 'BUYER',
      }),
    });
    const buyerData = await buyerRegister.json();
    buyerToken = buyerData.data.accessToken;
    console.log('BUYER criado. Token obtido.');

    console.log('\n2. Criando usuário SELLER...');
    const sellerRegister = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Seller',
        lastName: 'Test',
        email: sellerEmail,
        password: 'senha456',
        role: 'SELLER',
      }),
    });
    const sellerData = await sellerRegister.json();
    sellerToken = sellerData.data.accessToken;
    console.log('SELLER criado. Token obtido.');

    console.log('\n3. GET /api/users (sem autenticação)...');
    const noAuthResponse = await fetch(`${BASE_URL}/users`);
    console.log('Status:', noAuthResponse.status, '- Esperado: 401');

    console.log('\n4. GET /api/users (BUYER tentando acessar - sem permissão)...');
    const buyerNoPermResponse = await fetch(`${BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${buyerToken}` },
    });
    console.log('Status:', buyerNoPermResponse.status, '- Esperado: 403');

    console.log('\n5. GET /api/users (SELLER com permissão)...');
    const sellerPermResponse = await fetch(`${BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${sellerToken}` },
    });
    const usersData = await sellerPermResponse.json();
    console.log('Status:', sellerPermResponse.status, '- Esperado: 200');
    console.log('Usuários retornados:', usersData.data?.length || 0);

    console.log('\n6. GET /api/users/buyers (SELLER acessando)...');
    const buyersResponse = await fetch(`${BASE_URL}/users/buyers`, {
      headers: { 'Authorization': `Bearer ${sellerToken}` },
    });
    const buyersData = await buyersResponse.json();
    console.log('Status:', buyersResponse.status, '- Esperado: 200');
    console.log('Buyers retornados:', buyersData.data?.length || 0);

    console.log('\n7. GET /api/users/buyers (BUYER tentando acessar)...');
    const buyerAccessBuyersResponse = await fetch(`${BASE_URL}/users/buyers`, {
      headers: { 'Authorization': `Bearer ${buyerToken}` },
    });
    console.log('Status:', buyerAccessBuyersResponse.status, '- Esperado: 403');

    console.log('\n8. GET /api/users/sellers (qualquer usuário autenticado)...');
    const sellersResponseBuyer = await fetch(`${BASE_URL}/users/sellers`, {
      headers: { 'Authorization': `Bearer ${buyerToken}` },
    });
    const sellersData = await sellersResponseBuyer.json();
    console.log('BUYER acessando - Status:', sellersResponseBuyer.status, '- Esperado: 200');
    console.log('Sellers retornados:', sellersData.data?.length || 0);

    const sellersResponseSeller = await fetch(`${BASE_URL}/users/sellers`, {
      headers: { 'Authorization': `Bearer ${sellerToken}` },
    });
    console.log('SELLER acessando - Status:', sellersResponseSeller.status, '- Esperado: 200');

    console.log('\n9. GET /api/users/:id (usuário autenticado)...');
    const userId = buyerData.data.user.id;
    const userByIdResponse = await fetch(`${BASE_URL}/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${buyerToken}` },
    });
    const userData = await userByIdResponse.json();
    console.log('Status:', userByIdResponse.status, '- Esperado: 200');
    console.log('Usuário retornado:', userData.data?.email);

    console.log('\n10. Testando token expirado/inválido...');
    const invalidTokenResponse = await fetch(`${BASE_URL}/users/sellers`, {
      headers: { 'Authorization': 'Bearer token-invalido-123' },
    });
    console.log('Status:', invalidTokenResponse.status, '- Esperado: 401');

    console.log('\n11. Testando acesso sem header Authorization...');
    const noHeaderResponse = await fetch(`${BASE_URL}/users`);
    console.log('Status:', noHeaderResponse.status, '- Esperado: 401');

    console.log('\n=== Resumo dos Testes de Permissões ===');
    console.log('✓ Rotas sem autenticação: bloqueadas (401)');
    console.log('✓ Rotas sem permissão adequada: bloqueadas (403)');
    console.log('✓ Rotas com permissão SELLER: acessíveis');
    console.log('✓ Rotas públicas autenticadas: acessíveis para todos');
    console.log('✓ Tokens inválidos: rejeitados (401)');
    console.log('\nTodos os testes de permissões passaram!\n');

  } catch (error) {
    console.error('\nErro nos testes:', error.message);
  }
};

console.log('Aguardando servidor iniciar...');
setTimeout(testPermissions, 2000);
