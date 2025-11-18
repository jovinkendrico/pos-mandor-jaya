# Commit Message: Implement Hierarchical Chart of Accounts and Bank/Cash Integration

## Summary
Implement hierarchical Chart of Accounts (COA) structure for building materials store (toko bangunan) with parent-child relationships, and integrate Bank/Cash with COA selection.

## Changes

### 1. Chart of Accounts - Hierarchical Structure
- **Removed `order` field** from chart_of_accounts table (migration, model, controller, seeder, frontend)
- **Implemented hierarchical COA structure** with parent-child relationships:
  - ASET (1xxx): Kas (1100) → Kas Kecil (1101), Kas Besar (1102), Bank BCA (1103), Bank Mandiri (1104)
  - ASET: Piutang (1200), Persediaan (1300), Uang Muka (1400), Aset Tetap (1500) with their children
  - KEWAJIBAN (2xxx): Hutang Lancar (2100), Hutang Jangka Panjang (2200) with children
  - MODAL (3xxx): Modal (3100) with children
  - PENDAPATAN (4xxx): Pendapatan (4100) with children
  - HPP (5xxx): HPP (5100) with children
  - BEBAN OPERASIONAL (6xxx): Beban Operasional (6100) with 10 children accounts
  - BEBAN NON OPERASIONAL (7xxx): Beban Non Operasional (7100) with children

### 2. Chart of Accounts - Frontend Views
- Created complete master Chart of Account views:
  - `resources/js/pages/master/chart-of-account/index.tsx` - Main index page
  - `resources/js/components/master/chart-of-accounts/chart-of-account-table.tsx` - Table with hierarchical display
  - `resources/js/components/master/chart-of-accounts/chart-of-account-form.tsx` - Form with parent selection
  - `resources/js/hooks/use-chart-of-accounts.tsx` - Form management hook
- Added Chart of Account to sidebar navigation
- Table displays parent-child hierarchy with indentation (└─ for children)

### 3. Bank/Cash - COA Integration
- **Database**: Added `chart_of_account_id` to banks table (migration)
- **Model**: Added `chartOfAccount()` relationship to Bank model
- **Controller**: 
  - Load chartOfAccount relationship in index
  - Send COA list (1100 and children) to view for dropdown
  - Auto-assign COA based on type (1101 for cash, 1103 for bank) as fallback
- **Frontend**:
  - Added COA selection dropdown in bank form
  - Display COA in bank table
  - Updated types to include `chart_of_account_id` and `chart_of_account`
- **Seeder**: Updated to use child accounts (1101, 1103, 1104)

### 4. Accounting Service Updates
- Updated all journal creation methods to use child accounts:
  - Sale: Uses 1101 (Kas Kecil) or bank->chartOfAccount, 4101 (Penjualan Barang Dagangan)
  - Purchase: Uses 5101 (Pembelian Barang), 2101 (Hutang Usaha)
  - Sale Return: Uses 4101 (Penjualan Barang Dagangan)
  - Purchase Return: Uses 5101 (Pembelian Barang), 2101 (Hutang Usaha)

### 5. Database Migrations
- `2025_11_18_032223_remove_order_from_chart_of_accounts_table.php` - Remove order field
- `2025_11_18_030356_add_chart_of_account_id_to_banks_table.php` - Add COA to banks

### 6. Cleanup
- Removed unused `accounting_entries` table and `AccountingEntry` model
- Removed `accountingEntries()` relationship from ChartOfAccount model
- Updated ChartOfAccountSeeder with complete hierarchical structure for toko bangunan

## Files Changed

### Backend
- `database/migrations/2025_11_18_032223_remove_order_from_chart_of_accounts_table.php` (new)
- `database/migrations/2025_11_18_030356_add_chart_of_account_id_to_banks_table.php` (new)
- `database/seeders/ChartOfAccountSeeder.php` (updated - hierarchical structure)
- `database/seeders/DatabaseSeeder.php` (updated - use child accounts)
- `app/Models/ChartOfAccount.php` (removed order field)
- `app/Models/Bank.php` (added chartOfAccount relationship)
- `app/Http/Controllers/ChartOfAccountController.php` (updated for Inertia, removed order)
- `app/Http/Controllers/BankController.php` (added COA integration)
- `app/Http/Requests/StoreChartOfAccountRequest.php` (removed order validation)
- `app/Http/Requests/UpdateChartOfAccountRequest.php` (removed order validation)
- `app/Http/Requests/StoreBankRequest.php` (added chart_of_account_id validation)
- `app/Http/Requests/UpdateBankRequest.php` (added chart_of_account_id validation)
- `app/Services/AccountingService.php` (updated to use child accounts)
- `routes/web.php` (added chart-of-accounts resource route)

### Frontend
- `resources/js/types/index.d.ts` (added ChartOfAccount types, updated Bank types)
- `resources/js/pages/master/chart-of-account/index.tsx` (new)
- `resources/js/components/master/chart-of-accounts/chart-of-account-table.tsx` (new)
- `resources/js/components/master/chart-of-accounts/chart-of-account-form.tsx` (new)
- `resources/js/hooks/use-chart-of-accounts.tsx` (new)
- `resources/js/components/master/banks/bank-form.tsx` (added COA selection)
- `resources/js/components/master/banks/bank-table.tsx` (added COA column)
- `resources/js/hooks/use-banks.tsx` (added chart_of_account_id)
- `resources/js/pages/master/bank/index.tsx` (added chartOfAccounts prop)
- `resources/js/components/app-sidebar.tsx` (added Chart of Account menu)

## Benefits
1. **Hierarchical COA Structure**: Better organization with parent-child relationships
2. **Toko Bangunan Specific**: COA structure tailored for building materials store
3. **Bank/Cash Integration**: Direct connection between banks and COA for accurate accounting
4. **Flexible Account Selection**: Users can manually select COA or use auto-assignment
5. **Better Reporting**: Hierarchical structure enables better financial reporting and analysis

## Migration Notes
- Run `php artisan migrate` to apply new migrations
- Run `php artisan db:seed --class=ChartOfAccountSeeder` to populate new COA structure
- Existing banks will need to be updated with chart_of_account_id (auto-assigned on next update)

