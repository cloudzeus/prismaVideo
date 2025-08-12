const { PrismaClient } = require('@prisma/client');
const iconv = require('iconv-lite');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://root:Prof%4015%401f1femsk@5.189.130.31:3333/videoPrisma"
    }
  }
});

const ERP_API_URL = 'https://kolleris.oncloud.gr/s1services/JS/mbmv.trdr/getCustomers';

async function importCompanies(sodtype, type) {
  console.log(`\n🚀 Starting import for ${type} (sodtype: ${sodtype})...`);
  
  try {
    // Make API request to ERP system
    const response = await fetch(ERP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Charset': 'utf-8, windows-1253, iso-8859-7',
      },
      body: JSON.stringify({
        username: 'Service',
        password: 'Service',
        sodtype: sodtype
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the response as arrayBuffer to handle raw bytes
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('🔍 Raw API response buffer length:', buffer.length);
    console.log('🔍 First 100 bytes:', buffer.toString('hex').substring(0, 200));
    
    // Convert from ANSI 1253 (Windows-1253) to UTF-8
    let convertedText;
    try {
      convertedText = iconv.decode(buffer, 'win1253');
      console.log('✅ Successfully converted from win1253 to UTF-8');
    } catch (error) {
      console.log('⚠️ win1253 conversion failed, trying iso-8859-7...');
      try {
        convertedText = iconv.decode(buffer, 'iso-8859-7');
        console.log('✅ Successfully converted from iso-8859-7 to UTF-8');
      } catch (error2) {
        console.log('⚠️ iso-8859-7 conversion failed, trying cp1253...');
        try {
          convertedText = iconv.decode(buffer, 'cp1253');
          console.log('✅ Successfully converted from cp1253 to UTF-8');
        } catch (error3) {
          console.log('❌ All encoding conversions failed, using original buffer as UTF-8');
          convertedText = buffer.toString('utf8');
        }
      }
    }
    
    // Show sample of converted text
    console.log('🔍 Converted text sample (first 500 chars):');
    console.log(convertedText.substring(0, 500));
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(convertedText);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError.message);
      console.log('🔍 Response encoding might be wrong');
      throw new Error('Invalid JSON response from API');
    }
    
    if (!data.success) {
      throw new Error(`API Error: ${data.error}`);
    }

    console.log(`✅ Received ${data.Total} ${type} from ERP system`);
    console.log(`📊 Response code: ${data.responsecode}`);
    
    if (!data.result || !Array.isArray(data.result)) {
      throw new Error('No result array in response');
    }

    const companies = data.result;
    console.log(`📝 Processing ${companies.length} companies...`);

    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Process companies in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(companies.length / batchSize)} (${batch.length} companies)`);
      
      for (const company of batch) {
        try {
          // Map only essential ERP fields to our database fields with proper encoding conversion
          const companyData = {
            TRDR: company.TRDR?.toString() || null,
            CODE: company.CODE?.toString() || null,
            name: company.NAME || '',
            type: type, // 'client' or 'supplier'
            address: company.ADDRESS || null,
            city: company.CITY || null,
            country: 'Greece', // Default to Greece for Greek companies
            ZIP: company.ZIP || null,
            AFM: company.AFM === '000000000' ? null : company.AFM || null,
            JOBTYPE: company.jobtypetrd || null,
            PHONE01: company.PHONE01 || null,
            SODTYPE: sodtype.toString(),
            COMPANY: company.CODE?.toString() || company.AFM || null,
            // Set default values for required fields
            default: false,
          };

          // Check if company already exists by TRDR or CODE
          const existingCompany = await prisma.company.findFirst({
            where: {
              OR: [
                { TRDR: companyData.TRDR },
                { CODE: companyData.CODE },
                { AFM: companyData.AFM }
              ].filter(condition => condition.AFM !== null || condition.TRDR !== null || condition.CODE !== null)
            }
          });

          if (existingCompany) {
            // Update existing company
            await prisma.company.update({
              where: { id: existingCompany.id },
              data: companyData
            });
            updatedCount++;
            process.stdout.write('.');
          } else {
            // Create new company
            await prisma.company.create({
              data: companyData
            });
            importedCount++;
            process.stdout.write('+');
          }
        } catch (error) {
          console.error(`\n❌ Error processing company ${company.TRDR || company.CODE}:`, error.message);
          errorCount++;
        }
      }
      
      // Small delay between batches to be respectful to the database
      if (i + batchSize < companies.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n\n📈 Import Summary for ${type}:`);
    console.log(`✅ New companies imported: ${importedCount}`);
    console.log(`🔄 Existing companies updated: ${updatedCount}`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    console.log(`📊 Total processed: ${importedCount + updatedCount + errorCount}`);

    return { importedCount, updatedCount, errorCount };

  } catch (error) {
    console.error(`\n💥 Error importing ${type}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🏢 ERP Company Import Script');
  console.log('============================');
  
  try {
    // First import: Customers (sodtype 13)
    console.log('\n🛒 PHASE 1: Importing Customers...');
    const customersResult = await importCompanies(13, 'client');
    
    // Second import: Suppliers (sodtype 12)
    console.log('\n🏭 PHASE 2: Importing Suppliers...');
    const suppliersResult = await importCompanies(12, 'supplier');
    
    // Final summary
    console.log('\n🎉 IMPORT COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log(`📊 Total Summary:`);
    console.log(`   Customers: ${customersResult.importedCount} imported, ${customersResult.updatedCount} updated`);
    console.log(`   Suppliers: ${suppliersResult.importedCount} imported, ${suppliersResult.updatedCount} updated`);
    console.log(`   Total Errors: ${customersResult.errorCount + suppliersResult.errorCount}`);
    
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Database connection closed');
  }
}

// Handle script termination gracefully
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Script interrupted by user');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Script terminated');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the script
main().catch(async (error) => {
  console.error('\n💥 Unhandled error:', error);
  await prisma.$disconnect();
  process.exit(1);
}); 