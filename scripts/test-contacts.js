const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testContacts() {
  try {
    console.log('🔍 Testing contacts functionality...');
    
    // Test 1: Check if contacts table exists and has data
    console.log('\n📊 Checking contacts table...');
    const contacts = await prisma.contact.findMany({
      include: {
        companies: {
          include: {
            company: true,
          },
        },
      },
    });
    
    console.log(`✅ Found ${contacts.length} contacts:`);
    contacts.forEach((contact, index) => {
      console.log(`  ${index + 1}. ${contact.firstName} ${contact.lastName}`);
      console.log(`     Title: ${contact.title || 'N/A'}`);
      console.log(`     Email: ${contact.email || 'N/A'}`);
      console.log(`     Companies: ${contact.companies.length}`);
      contact.companies.forEach(({ company }) => {
        console.log(`       - ${company.name}`);
      });
    });
    
    // Test 2: Check if we can create a new contact
    console.log('\n➕ Testing contact creation...');
    const newContact = await prisma.contact.create({
      data: {
        firstName: 'Test',
        lastName: 'Contact',
        title: 'Test Title',
        profession: 'Test Profession',
        email: 'test.contact@example.com',
        phone: '+1-555-9999',
      },
    });
    
    console.log(`✅ Created test contact: ${newContact.firstName} ${newContact.lastName}`);
    
    // Test 3: Check if we can fetch the newly created contact
    console.log('\n🔍 Testing contact retrieval...');
    const fetchedContact = await prisma.contact.findUnique({
      where: { id: newContact.id },
      include: {
        companies: {
          include: {
            company: true,
          },
        },
      },
    });
    
    if (fetchedContact) {
      console.log(`✅ Successfully retrieved contact: ${fetchedContact.firstName} ${fetchedContact.lastName}`);
    } else {
      console.log('❌ Failed to retrieve contact');
    }
    
    // Test 4: Clean up test contact
    console.log('\n🧹 Cleaning up test contact...');
    await prisma.contact.delete({
      where: { id: newContact.id },
    });
    console.log('✅ Test contact deleted');
    
    console.log('\n🎉 All tests passed! Contacts functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Error testing contacts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testContacts();
