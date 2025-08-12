require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDepartments() {
  try {
    console.log('Checking departments in database...');
    
    // Check if departments table exists
    try {
      const departmentCount = await prisma.department.count();
      console.log(`✅ Department table exists with ${departmentCount} records`);
      
      if (departmentCount > 0) {
        // Get all departments
        const departments = await prisma.department.findMany({
          include: {
            company: {
              select: {
                id: true,
                name: true,
              }
            },
            parent: {
              select: {
                id: true,
                name: true,
              }
            },
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            _count: {
              select: {
                users: true,
                children: true,
              }
            }
          }
        });
        
        console.log('\n📋 All departments:');
        departments.forEach((dept, index) => {
          console.log(`${index + 1}. ${dept.name} (ID: ${dept.id})`);
          console.log(`   Company: ${dept.company.name} (ID: ${dept.company.id})`);
          console.log(`   Parent: ${dept.parent ? dept.parent.name : 'Top Level'}`);
          console.log(`   Manager: ${dept.manager ? `${dept.manager.firstName} ${dept.manager.lastName}` : 'None'}`);
          console.log(`   Users: ${dept._count.users}, Children: ${dept._count.children}`);
          console.log(`   Created: ${dept.createdAt}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log('❌ Department table error:', error.message);
    }
    
    // Check companies to see which one we're working with
    try {
      const companies = await prisma.company.findMany({
        select: {
          id: true,
          name: true,
          default: true,
        },
        take: 5
      });
      
      console.log('\n🏢 Sample companies:');
      companies.forEach(company => {
        console.log(`- ${company.name} (ID: ${company.id}) ${company.default ? '[DEFAULT]' : ''}`);
      });
    } catch (error) {
      console.log('❌ Company table error:', error.message);
    }
    
    // Check users to see their company and role
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          companyId: true,
          departmentId: true,
        },
        take: 5
      });
      
      console.log('\n👥 Sample users:');
      users.forEach(user => {
        console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`  Role: ${user.role}, Company: ${user.companyId}, Department: ${user.departmentId || 'None'}`);
      });
    } catch (error) {
      console.log('❌ User table error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDepartments(); 