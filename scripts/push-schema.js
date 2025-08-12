require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');

try {
  console.log('Loading environment variables from .env.local...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  console.log('Running Prisma db push...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('Schema pushed successfully!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} 