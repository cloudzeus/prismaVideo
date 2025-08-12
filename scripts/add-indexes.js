const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addIndexes() {
  try {
    console.log('Adding database indexes for better performance...');
    
    // Add indexes for Company model
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS companies_name_idx ON companies (name);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS companies_type_idx ON companies (type);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS companies_afm_idx ON companies (AFM);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS companies_email_idx ON companies (email);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS companies_phone01_idx ON companies (PHONE01);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS companies_city_idx ON companies (city);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS companies_country_idx ON companies (country);
    `;
    
    // Add indexes for User model
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS users_name_idx ON users (firstName, lastName);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS users_isActive_idx ON users (isActive);
    `;
    
    // Add indexes for Call model
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS calls_startTime_idx ON calls (startTime);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS calls_status_idx ON calls (status);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS calls_type_idx ON calls (type);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS calls_company_startTime_idx ON calls (companyId, startTime);
    `;
    
    console.log('✅ All indexes added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addIndexes(); 