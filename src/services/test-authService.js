const authService = require('../services/authService');
const userRepository = require('../db/repositories/userRepository');
const sellerRepository = require('../db/repositories/sellerRepository');
const { query } = require('../db/query');

const testAuthService = async () => {
  let buyerUser = null;
  let sellerUser = null;
  let sellerId = null;
  const randomEmail1 = `buyer.${Date.now()}@example.com`;
  const randomEmail2 = `seller.${Date.now() + 1}@example.com`;

  try {
    console.log('Iniciando testes do AuthService...\n');

    console.log('1. Testando register() - BUYER...');
    const buyerData = await authService.register({
      firstName: 'Maria',
      lastName: 'Santos',
      email: randomEmail1,
      password: 'senha123',
      role: 'BUYER',
      newsletter: true,
    });
    buyerUser = buyerData.user;
    console.log('BUYER registrado:', buyerUser.email);
    console.log('Access Token:', buyerData.accessToken ? 'OK' : 'FALHOU');
    console.log('Refresh Token:', buyerData.refreshToken ? 'OK' : 'FALHOU');
    console.log('Avatar gerado:', buyerUser.avatar);

    console.log('\n2. Testando register() - SELLER...');
    const sellerData = await authService.register({
      firstName: 'Pedro',
      lastName: 'Oliveira',
      email: randomEmail2,
      password: 'senha456',
      role: 'SELLER',
      newsletter: false,
    });
    sellerUser = sellerData.user;
    sellerId = sellerData.seller.id;
    console.log('SELLER registrado:', sellerUser.email);
    console.log('Seller criado com slug:', sellerData.seller.slug);
    console.log('Member since:', sellerData.seller.member_since);

    console.log('\n3. Testando register() - Email duplicado...');
    try {
      await authService.register({
        firstName: 'Outro',
        lastName: 'Usuario',
        email: randomEmail1,
        password: 'senha789',
        role: 'BUYER',
      });
      console.log('FALHOU: Deveria ter rejeitado email duplicado');
    } catch (error) {
      console.log('Email duplicado rejeitado:', error.message);
    }

    console.log('\n4. Testando login() - Credenciais válidas...');
    const loginData = await authService.login(randomEmail1, 'senha123');
    console.log('Login bem-sucedido:', loginData.user.email);
    console.log('Tokens gerados:', loginData.accessToken ? 'OK' : 'FALHOU');

    console.log('\n5. Testando login() - Senha incorreta...');
    try {
      await authService.login(randomEmail1, 'senhaErrada');
      console.log('FALHOU: Deveria ter rejeitado senha incorreta');
    } catch (error) {
      console.log('Senha incorreta rejeitada:', error.message);
    }

    console.log('\n6. Testando login() - Email inexistente...');
    try {
      await authService.login('naoexiste@example.com', 'senha123');
      console.log('FALHOU: Deveria ter rejeitado email inexistente');
    } catch (error) {
      console.log('Email inexistente rejeitado:', error.message);
    }

    console.log('\n7. Testando refreshToken()...');
    const { refreshToken } = buyerData;
    const newTokens = await authService.refreshToken(refreshToken);
    console.log('Novo access token gerado:', newTokens.accessToken ? 'OK' : 'FALHOU');

    console.log('\n8. Testando refreshToken() - Token inválido...');
    try {
      await authService.refreshToken('token-invalido');
      console.log('FALHOU: Deveria ter rejeitado token inválido');
    } catch (error) {
      console.log('Token inválido rejeitado:', error.message);
    }

    console.log('\n9. Testando verifyToken()...');
    const { accessToken } = buyerData;
    const verifiedData = await authService.verifyToken(accessToken);
    console.log('Token verificado:', verifiedData.user.email);

    console.log('\n10. Testando verifyToken() com SELLER...');
    const sellerLoginData = await authService.login(randomEmail2, 'senha456');
    const verifiedSeller = await authService.verifyToken(sellerLoginData.accessToken);
    console.log('Seller verificado:', verifiedSeller.user.email);
    console.log('Seller data incluído:', verifiedSeller.seller ? 'OK' : 'FALHOU');

    console.log('\n11. Testando generateUniqueSlug()...');
    const slug1 = await authService.generateUniqueSlug('Pedro', 'Oliveira');
    console.log('Slug gerado (já existe):', slug1);
    const slug2 = await authService.generateUniqueSlug('João', 'Único');
    console.log('Slug gerado (novo):', slug2);

    console.log('\nLimpando dados de teste...');
    if (sellerId) {
      await query('DELETE FROM sellers WHERE id = $1', [sellerId]);
      console.log('Seller deletado');
    }
    if (sellerUser) {
      await userRepository.deleteById(sellerUser.id);
      console.log('User SELLER deletado');
    }
    if (buyerUser) {
      await userRepository.deleteById(buyerUser.id);
      console.log('User BUYER deletado');
    }

    console.log('\nTodos os testes do AuthService passaram!\n');
  } catch (error) {
    console.error('\nErro nos testes:', error.message);
    console.error('Stack:', error.stack);

    console.log('\nTentando limpar dados em caso de erro...');
    try {
      if (sellerId) {
        await query('DELETE FROM sellers WHERE id = $1', [sellerId]);
      }
      if (sellerUser) {
        await userRepository.deleteById(sellerUser.id);
      }
      if (buyerUser) {
        await userRepository.deleteById(buyerUser.id);
      }
    } catch (cleanupError) {
      console.error('Erro ao limpar:', cleanupError.message);
    }
  } finally {
    const { closePool } = require('../config/database');
    await closePool();
    console.log('Conexão com banco fechada');
  }
};

testAuthService();
