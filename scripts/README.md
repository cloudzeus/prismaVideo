# ERP Company Import Script

This script imports companies from your ERP system into the local database.

## Setup

1. **Environment Variables**: Make sure you have a `.env` file in your project root with:
   ```bash
   DATABASE_URL="mysql://username:password@localhost:3306/database_name"
   ```

2. **Database**: Ensure your database is running and accessible

## Usage

```bash
npm run import:companies
```

## What it does

1. **Phase 1**: Imports customers (sodtype 13)
2. **Phase 2**: Imports suppliers (sodtype 12)

## API Endpoint

- **URL**: `https://kolleris.oncloud.gr/s1services/JS/mbmv.trdr/getCustomers`
- **Method**: POST
- **Credentials**: Service/Service

## Data Mapping

| ERP Field | Database Field | Notes |
|-----------|----------------|-------|
| TRDR | TRDR | Trader ID |
| CODE | CODE | Company Code |
| NAME | name | Company Name |
| jobtypetrd | JOBTYPE | Job Type |
| AFM | AFM | VAT Number (skips '000000000') |
| ADDRESS | address | Company Address |
| ZIP | ZIP | Postal Code |
| CITY | city | City |
| PHONE01 | PHONE01 | Phone Number |
| SODTYPE | SODTYPE | Set to 13 (customers) or 12 (suppliers) |
| COMPANY | COMPANY | Set to CODE or AFM |
| country | country | Always set to "Greece" |

## Features

- ✅ Batch processing (100 companies per batch)
- ✅ Duplicate detection (by TRDR, CODE, or AFM)
- ✅ Update existing vs create new
- ✅ Progress indicators
- ✅ Error handling and reporting
- ✅ Graceful termination handling

## Output

The script provides detailed progress updates and a final summary showing:
- New companies imported
- Existing companies updated
- Errors encountered
- Total processed 