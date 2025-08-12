import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default company
  const company = await prisma.company.upsert({
    where: { id: 'default-company' },
    update: {},
    create: {
      id: 'default-company',
      COMPANY: 'ACME001',
      LOCKID: 'LOCK001',
      SODTYPE: 'CORPORATE',
      name: 'Acme Corporation',
      type: 'client',
      address: '123 Business Street',
      city: 'New York',
      country: 'USA',
      phone: '+1-555-0123',
      email: 'contact@acme.com',
      website: 'https://acme.com',
      default: true,
    },
  });

  console.log('✅ Company created:', company.name);

  // Create departments
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { id: 'dept-it' },
      update: {},
      create: {
        id: 'dept-it',
        name: 'Information Technology',
        description: 'IT and software development department',
        companyId: company.id,
      },
    }),
    prisma.department.upsert({
      where: { id: 'dept-hr' },
      update: {},
      create: {
        id: 'dept-hr',
        name: 'Human Resources',
        description: 'HR and recruitment department',
        companyId: company.id,
      },
    }),
    prisma.department.upsert({
      where: { id: 'dept-sales' },
      update: {},
      create: {
        id: 'dept-sales',
        name: 'Sales & Marketing',
        description: 'Sales and marketing operations',
        companyId: company.id,
      },
    }),
  ]);

  console.log('✅ Departments created:', departments.map(d => d.name));

  // Hash password for admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Create default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'Administrator',
      companyId: company.id,
      departmentId: departments[0].id, // IT department
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create sample users
  const sampleUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'manager@acme.com' },
      update: {},
      create: {
        email: 'manager@acme.com',
        password: await bcrypt.hash('manager123', 12),
        firstName: 'John',
        lastName: 'Manager',
        role: 'Manager',
        companyId: company.id,
        departmentId: departments[1].id, // HR department
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'user@acme.com' },
      update: {},
      create: {
        email: 'user@acme.com',
        password: await bcrypt.hash('user123', 12),
        firstName: 'Jane',
        lastName: 'User',
        role: 'Employee',
        companyId: company.id,
        departmentId: departments[2].id, // Sales department
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Sample users created:', sampleUsers.map(u => u.email));

  // Update department managers
  await prisma.department.update({
    where: { id: departments[0].id },
    data: { managerId: adminUser.id },
  });

  await prisma.department.update({
    where: { id: departments[1].id },
    data: { managerId: sampleUsers[0].id },
  });

  console.log('✅ Department managers assigned');

  // Create sample calls
  const sampleCalls = await Promise.all([
    prisma.call.create({
      data: {
        title: 'Weekly Team Meeting',
        description: 'Regular weekly team sync meeting',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        type: 'meeting',
        status: 'scheduled',
        password: 'meeting123',
        companyId: company.id,
        createdById: adminUser.id,
      },
    }),
    prisma.call.create({
      data: {
        title: 'Product Demo',
        description: 'Demo of new product features',
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        type: 'webinar',
        status: 'scheduled',
        password: 'demo456',
        companyId: company.id,
        createdById: sampleUsers[0].id,
      },
    }),
  ]);

  console.log('✅ Sample calls created:', sampleCalls.map(c => c.title));

  // Add participants to calls
  await Promise.all([
    prisma.participant.create({
      data: {
        callId: sampleCalls[0].id,
        userId: adminUser.id,
        role: 'host',
      },
    }),
    prisma.participant.create({
      data: {
        callId: sampleCalls[0].id,
        userId: sampleUsers[0].id,
        role: 'participant',
      },
    }),
    prisma.participant.create({
      data: {
        callId: sampleCalls[0].id,
        userId: sampleUsers[1].id,
        role: 'participant',
      },
    }),
    prisma.participant.create({
      data: {
        callId: sampleCalls[1].id,
        userId: sampleUsers[0].id,
        role: 'host',
      },
    }),
    prisma.participant.create({
      data: {
        callId: sampleCalls[1].id,
        userId: adminUser.id,
        role: 'participant',
      },
    }),
  ]);

  console.log('✅ Participants added to calls');

  // Create sample contacts
  const sampleContacts = await Promise.all([
    prisma.contact.create({
      data: {
        firstName: 'John',
        lastName: 'Smith',
        title: 'CEO',
        profession: 'Business Executive',
        email: 'john.smith@example.com',
        phone: '+1-555-0101',
        mobile: '+1-555-0102',
        address: '123 Business Ave',
        city: 'New York',
        zip: '10001',
        country: 'USA',
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        title: 'Marketing Director',
        profession: 'Marketing Professional',
        email: 'sarah.johnson@example.com',
        phone: '+1-555-0201',
        mobile: '+1-555-0202',
        address: '456 Marketing St',
        city: 'Los Angeles',
        zip: '90210',
        country: 'USA',
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Michael',
        lastName: 'Brown',
        title: 'Software Engineer',
        profession: 'Software Developer',
        email: 'michael.brown@example.com',
        phone: '+1-555-0301',
        mobile: '+1-555-0302',
        address: '789 Tech Blvd',
        city: 'San Francisco',
        zip: '94102',
        country: 'USA',
      },
    }),
  ]);

  console.log('✅ Sample contacts created:', sampleContacts.map(c => `${c.firstName} ${c.lastName}`));

  // Associate some contacts with companies
  await Promise.all([
    prisma.contactCompany.create({
      data: {
        contactId: sampleContacts[0].id,
        companyId: company.id,
      },
    }),
    prisma.contactCompany.create({
      data: {
        contactId: sampleContacts[1].id,
        companyId: company.id,
      },
    }),
  ]);

  console.log('✅ Contact-company associations created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Default credentials:');
  console.log('Admin: admin@acme.com / admin123');
  console.log('Manager: manager@acme.com / manager123');
  console.log('User: user@acme.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 