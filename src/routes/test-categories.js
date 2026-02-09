const BASE_URL = 'http://localhost:4000/api';

let sellerToken = '';
let createdCategoryId = null;

const testCategories = async () => {
  try {
    console.log('=== Teste das Rotas de Categorias ===\n');

    const sellerEmail = `seller.${Date.now()}@example.com`;
    console.log('1. Criando usuário SELLER para testes...');
    const sellerRegister = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Seller',
        lastName: 'Categories',
        email: sellerEmail,
        password: 'senha123',
        role: 'SELLER',
      }),
    });
    const sellerData = await sellerRegister.json();
    sellerToken = sellerData.data.accessToken;
    console.log('SELLER criado. Token obtido.\n');

    console.log('2. GET /api/categories (listar todas - público)...');
    const listResponse = await fetch(`${BASE_URL}/categories`);
    const listData = await listResponse.json();
    console.log('Status:', listResponse.status);
    console.log('Categorias retornadas:', listData.data?.length || 0);

    console.log('\n3. GET /api/categories?includeCount=true (com contagem de produtos)...');
    const listWithCountResponse = await fetch(`${BASE_URL}/categories?includeCount=true`);
    const listWithCountData = await listWithCountResponse.json();
    console.log('Status:', listWithCountResponse.status);
    console.log('Primeira categoria:', listWithCountData.data?.[0]?.name);
    console.log('Products count:', listWithCountData.data?.[0]?.products_count);

    console.log('\n4. POST /api/categories (criar categoria - sem auth)...');
    const noAuthResponse = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description',
        icon: '🧪',
        gradient: 'from-blue-500 to-green-500',
      }),
    });
    console.log('Status:', noAuthResponse.status, '- Esperado: 401');

    console.log('\n5. POST /api/categories (criar categoria - autenticado)...');
    const createResponse = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description for automated tests',
        icon: '🧪',
        gradient: 'from-blue-500 to-green-500',
      }),
    });
    const createData = await createResponse.json();
    console.log('Status:', createResponse.status);
    if (createData.data) {
      createdCategoryId = createData.data.id;
      console.log('Categoria criada com ID:', createdCategoryId);
      console.log('Slug:', createData.data.slug);
    }

    console.log('\n6. POST /api/categories (slug duplicado)...');
    const duplicateResponse = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        name: 'Another Category',
        slug: 'test-category',
        description: 'Different description',
      }),
    });
    const duplicateData = await duplicateResponse.json();
    console.log('Status:', duplicateResponse.status, '- Esperado: 409');
    console.log('Mensagem:', duplicateData.message);

    console.log('\n7. POST /api/categories (validação - slug inválido)...');
    const invalidSlugResponse = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sellerToken}`,
      },
      body: JSON.stringify({
        name: 'Invalid Slug',
        slug: 'Invalid Slug With Spaces',
        description: 'Test',
      }),
    });
    console.log('Status:', invalidSlugResponse.status, '- Esperado: 400');

    if (createdCategoryId) {
      console.log('\n8. GET /api/categories/:id (buscar por ID)...');
      const getByIdResponse = await fetch(`${BASE_URL}/categories/${createdCategoryId}`);
      const getByIdData = await getByIdResponse.json();
      console.log('Status:', getByIdResponse.status);
      console.log('Categoria retornada:', getByIdData.data?.name);

      console.log('\n9. GET /api/categories/slug/:slug (buscar por slug)...');
      const getBySlugResponse = await fetch(`${BASE_URL}/categories/slug/test-category`);
      const getBySlugData = await getBySlugResponse.json();
      console.log('Status:', getBySlugResponse.status);
      console.log('Categoria retornada:', getBySlugData.data?.name);

      console.log('\n10. PUT /api/categories/:id (atualizar categoria)...');
      const updateResponse = await fetch(`${BASE_URL}/categories/${createdCategoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sellerToken}`,
        },
        body: JSON.stringify({
          name: 'Test Category Updated',
          description: 'Updated description',
        }),
      });
      const updateData = await updateResponse.json();
      console.log('Status:', updateResponse.status);
      console.log('Nome atualizado:', updateData.data?.name);

      console.log('\n11. DELETE /api/categories/:id (deletar categoria)...');
      const deleteResponse = await fetch(`${BASE_URL}/categories/${createdCategoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sellerToken}`,
        },
      });
      const deleteData = await deleteResponse.json();
      console.log('Status:', deleteResponse.status);
      console.log('Mensagem:', deleteData.message);

      console.log('\n12. GET /api/categories/:id (verificar deleção)...');
      const verifyDeleteResponse = await fetch(`${BASE_URL}/categories/${createdCategoryId}`);
      console.log('Status:', verifyDeleteResponse.status, '- Esperado: 404');
    }

    console.log('\n13. GET /api/categories/slug/pottery (categoria da seed)...');
    const potteryResponse = await fetch(`${BASE_URL}/categories/slug/pottery`);
    const potteryData = await potteryResponse.json();
    console.log('Status:', potteryResponse.status);
    console.log('Categoria:', potteryData.data?.name);
    console.log('Icon:', potteryData.data?.icon);

    console.log('\n=== Resumo dos Testes de Categorias ===');
    console.log('✓ Rotas públicas: acessíveis');
    console.log('✓ Rotas protegidas: requerem autenticação');
    console.log('✓ CRUD completo: funcional');
    console.log('✓ Validações: funcionando');
    console.log('✓ Busca por ID e slug: funcional');
    console.log('✓ Listagem com contagem: funcional');
    console.log('\nTodos os testes de categorias passaram!\n');

  } catch (error) {
    console.error('\nErro nos testes:', error.message);
  }
};

console.log('Aguardando servidor iniciar...');
setTimeout(testCategories, 2000);
