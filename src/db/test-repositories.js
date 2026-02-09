const userRepository = require('./repositories/userRepository');
const sellerRepository = require('./repositories/sellerRepository');
const { query } = require('./query');

const testRepositories = async () => {
  let createdUser = null;
  let createdSeller = null;
  const randomEmail = `joao.teste.${Date.now()}@example.com`;

  try {
    console.log('Iniciando testes dos repositories...\n');

    console.log('1. Testando UserRepository.create()...');
    createdUser = await userRepository.create({
      firstName: 'João',
      lastName: 'Silva',
      email: randomEmail,
      password: 'hashedpassword123',
      role: 'SELLER',
      avatar: 'https://i.pravatar.cc/150?u=joao',
      newsletter: true,
    });
    console.log('Usuário criado:', createdUser.id, createdUser.email);

    console.log('\n2. Testando UserRepository.findByEmail()...');
    const foundByEmail = await userRepository.findByEmail(randomEmail);
    console.log('Usuário encontrado por email:', foundByEmail?.email);

    console.log('\n3. Testando UserRepository.findById()...');
    const foundById = await userRepository.findById(createdUser.id);
    console.log('Usuário encontrado por ID:', foundById?.id);

    console.log('\n4. Testando UserRepository.update()...');
    const updatedUser = await userRepository.update(createdUser.id, {
      firstName: 'João Atualizado',
      newsletter: false,
    });
    console.log('Usuário atualizado:', updatedUser.firstName, 'newsletter:', updatedUser.newsletter);

    console.log('\n5. Testando SellerRepository.create()...');
    createdSeller = await sellerRepository.create({
      userId: createdUser.id,
      slug: `joao-silva-artesao-${Date.now()}`,
      location: 'São Paulo, SP',
      specialty: 'Cerâmica',
      bio: 'Artesão de cerâmica com 10 anos de experiência.',
      memberSince: 2020,
      gradient: 'from-blue-500 to-purple-600',
    });
    console.log('Seller criado:', createdSeller.id, createdSeller.slug);

    console.log('\n6. Testando SellerRepository.findByUserId()...');
    const sellerByUserId = await sellerRepository.findByUserId(createdUser.id);
    console.log('Seller encontrado por userId:', sellerByUserId?.user_id);

    console.log('\n7. Testando SellerRepository.findBySlug()...');
    const sellerBySlug = await sellerRepository.findBySlug(createdSeller.slug);
    console.log('Seller encontrado por slug:', sellerBySlug?.slug, 'firstName:', sellerBySlug?.first_name);

    console.log('\n8. Testando SellerRepository.getStats()...');
    const stats = await sellerRepository.getStats(createdSeller.id);
    console.log('Stats do seller:', stats);

    console.log('\n9. Testando SellerRepository.slugExists()...');
    const slugExists = await sellerRepository.slugExists(createdSeller.slug);
    console.log('Slug existe:', slugExists);

    console.log('\n10. Testando UserRepository.findByRole()...');
    const sellers = await userRepository.findByRole('SELLER');
    console.log('Sellers encontrados:', sellers.length);

    console.log('\nLimpando dados de teste...');
    if (createdSeller) {
      await query('DELETE FROM sellers WHERE id = $1', [createdSeller.id]);
      console.log('Seller deletado');
    }
    if (createdUser) {
      const deleted = await userRepository.deleteById(createdUser.id);
      console.log('Usuário deletado:', deleted);
    }

    console.log('\nTodos os testes passaram com sucesso!\n');
  } catch (error) {
    console.error('\nErro nos testes:', error.message);
    console.error('Stack:', error.stack);

    console.log('\nTentando limpar dados em caso de erro...');
    try {
      if (createdSeller) {
        await query('DELETE FROM sellers WHERE id = $1', [createdSeller.id]);
      }
      if (createdUser) {
        await userRepository.deleteById(createdUser.id);
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

testRepositories();
