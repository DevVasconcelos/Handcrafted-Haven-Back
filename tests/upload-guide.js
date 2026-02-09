const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Sistema de Upload de Imagens - Guia de Testes ===\n');

console.log('ATENÇÃO: Para testar o upload, você precisa:');
console.log('1. Configurar BLOB_READ_WRITE_TOKEN no arquivo .env');
console.log('2. Obter um token JWT fazendo login como SELLER\n');

console.log('--- Passo 1: Configurar Vercel Blob Token ---');
console.log('Acesse: https://vercel.com/dashboard');
console.log('Navegue até Storage → Create Blob Store');
console.log('Copie o token e adicione no .env:\n');
console.log('BLOB_READ_WRITE_TOKEN=vercel_blob_rw_SEU_TOKEN_AQUI\n');

console.log('--- Passo 2: Obter Token JWT ---');
console.log('Execute os seguintes comandos no terminal:\n');

console.log('# Login como SELLER');
console.log('curl -X POST http://localhost:4000/api/auth/login \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"email":"joao@email.com","password":"senha123"}\'');
console.log('\n# Copie o accessToken da resposta\n');

console.log('--- Passo 3: Testar Upload de Imagem Única ---');
console.log('curl -X POST http://localhost:4000/api/upload/single \\');
console.log('  -H "Authorization: Bearer SEU_TOKEN_JWT" \\');
console.log('  -F "image=@/caminho/para/sua/imagem.jpg" \\');
console.log('  -F "folder=products"\n');

console.log('--- Passo 4: Testar Upload de Múltiplas Imagens ---');
console.log('curl -X POST http://localhost:4000/api/upload/multiple \\');
console.log('  -H "Authorization: Bearer SEU_TOKEN_JWT" \\');
console.log('  -F "images=@/caminho/imagem1.jpg" \\');
console.log('  -F "images=@/caminho/imagem2.jpg" \\');
console.log('  -F "folder=products"\n');

console.log('--- Passo 5: Listar Imagens Enviadas ---');
console.log('curl -X GET "http://localhost:4000/api/upload/list?folder=products" \\');
console.log('  -H "Authorization: Bearer SEU_TOKEN_JWT"\n');

console.log('--- Passo 6: Deletar Imagem ---');
console.log('curl -X DELETE http://localhost:4000/api/upload/single \\');
console.log('  -H "Authorization: Bearer SEU_TOKEN_JWT" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"pathname":"products/abc123.jpg"}\'');
console.log('\n# Use o pathname retornado no upload\n');

console.log('--- Exemplo de Teste Completo com Node.js ---\n');

const testScript = `
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testUpload() {
  const JWT_TOKEN = 'SEU_TOKEN_JWT_AQUI';
  
  const formData = new FormData();
  formData.append('image', fs.createReadStream('./test-image.jpg'));
  formData.append('folder', 'products');
  
  try {
    const response = await axios.post(
      'http://localhost:4000/api/upload/single',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': \`Bearer \${JWT_TOKEN}\`
        }
      }
    );
    
    console.log('Upload bem-sucedido:');
    console.log('URL:', response.data.data.url);
    console.log('Pathname:', response.data.data.pathname);
  } catch (error) {
    console.error('Erro no upload:', error.response?.data || error.message);
  }
}

testUpload();
`;

console.log(testScript);

console.log('\n--- Informações Importantes ---');
console.log('• Apenas usuários SELLER podem fazer upload');
console.log('• Tamanho máximo: 5MB por arquivo');
console.log('• Formatos: JPEG, PNG, WebP, GIF');
console.log('• Máximo: 10 arquivos por vez\n');

console.log('Para mais informações, consulte: docs/VERCEL_BLOB.md\n');

rl.question('Pressione Enter para sair...', () => {
  rl.close();
  process.exit(0);
});
