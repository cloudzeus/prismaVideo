require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if Contact table exists
    try {
      const contactCount = await prisma.contact.count();
      console.log(`✅ Contact table exists with ${contactCount} records`);
    } catch (error) {
      console.log('❌ Contact table error:', error.message);
    }
    
    // Test if ContactCompany table exists
    try {
      const companyCount = await prisma.contactCompany.count();
      console.log(`✅ ContactCompany table exists with ${companyCount} records`);
    } catch (error) {
      console.log('❌ ContactCompany table error:', error.message);
    }
    
    // Test if Company table exists
    try {
      const companyCount = await prisma.company.count();
      console.log(`✅ Company table exists with ${companyCount} records`);
    } catch (error) {
      console.log('❌ Company table error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 