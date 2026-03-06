<?php

namespace Database\Seeders;

use App\Models\Member;
use App\Models\MemberLoan;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\JournalEntryDetail;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MemberOpeningBalanceSeeder extends Seeder
{
    /**
     * Opening balances for 16 members (piutang anggota).
     * Journal: Dr. Piutang Karyawan (1202) / Cr. Laba Ditahan (3103)
     */
    public function run(): void
    {
        $openingDate = '2026-03-01'; // Tanggal saldo awal
        $adminId     = 1;           // ID user admin/system

        $members = [
            ['name' => 'Silpa',    'amount' => 500000],
            ['name' => 'Dika',   'amount' => 2000000],
            ['name' => 'Legiman',         'amount' => 500000],
            ['name' => 'Toni', 'amount' => 1300000],
            ['name' => 'Irfan',     'amount' => 1000000],
            ['name' => 'Asmadi',          'amount' => 1200000],
            ['name' => 'Jailani',          'amount' => 1000000],
            ['name' => 'Nuriani',        'amount' => 250000],
            ['name' => 'Bambang',         'amount' => 900000],
        ];

        // Get COA accounts
        $piutangAccount   = ChartOfAccount::where('code', '1202')->where('is_active', true)->first();
        $retainedEarnings = ChartOfAccount::where('code', '3101')->where('is_active', true)->first();

        if (!$piutangAccount) {
            $this->command->error('Akun Piutang Karyawan (1202) tidak ditemukan!');
            return;
        }
        if (!$retainedEarnings) {
            $this->command->error('Akun Laba Ditahan (3103) tidak ditemukan!');
            return;
        }

        $totalCreated = 0;

        foreach ($members as $memberData) {
            DB::transaction(function () use ($memberData, $openingDate, $adminId, $piutangAccount, $retainedEarnings, &$totalCreated) {
                // Create or find member
                $member = Member::firstOrCreate(
                    ['name' => $memberData['name']],
                    [
                        'created_by' => $adminId,
                        'updated_by' => $adminId,
                    ]
                );

                // Generate loan number
                $loanNumber = MemberLoan::generateLoanNumber();

                // Create loan record
                $loan = MemberLoan::create([
                    'loan_number'        => $loanNumber,
                    'member_id'          => $member->id,
                    'loan_date'          => $openingDate,
                    'amount'             => $memberData['amount'],
                    'bank_id'            => null,
                    'notes'              => 'Saldo awal pinjaman anggota',
                    'status'             => 'confirmed',
                    'is_opening_balance' => true,
                    'created_by'         => $adminId,
                    'updated_by'         => $adminId,
                ]);

                // Create journal entry
                $journalNumber = JournalEntry::generateJournalNumber();
                $journal = JournalEntry::create([
                    'journal_number' => $journalNumber,
                    'journal_date'   => $openingDate,
                    'description'    => "Saldo Awal Pinjaman - {$member->name} #{$loanNumber}",
                    'reference_type' => 'MemberLoan',
                    'reference_id'   => $loan->id,
                    'status'         => 'posted',
                ]);

                // Debit: Piutang Karyawan
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journal->id,
                    'chart_of_account_id' => $piutangAccount->id,
                    'debit'               => $memberData['amount'],
                    'credit'              => 0,
                    'description'         => "Saldo awal piutang {$member->name}",
                ]);

                // Credit: Laba Ditahan
                JournalEntryDetail::create([
                    'journal_entry_id'    => $journal->id,
                    'chart_of_account_id' => $retainedEarnings->id,
                    'debit'               => 0,
                    'credit'              => $memberData['amount'],
                    'description'         => "Saldo awal piutang {$member->name}",
                ]);

                $totalCreated++;
                $this->command->info("✓ {$member->name} — Rp " . number_format($memberData['amount'], 0, ',', '.'));
            });
        }

        $total = collect($members)->sum('amount');
        $this->command->info('');
        $this->command->info("Selesai: {$totalCreated} anggota dibuat.");
        $this->command->info('Total piutang: Rp ' . number_format($total, 0, ',', '.'));
    }
}
