<?php

namespace App\Services;


use Illuminate\Support\Facades\DB;

class ItemService
{
    public static function generateCode()
    {
        // Get the latest nota
        $lastCode = DB::table('items')
            ->whereNotNull('code')
            ->orderByDesc('id')
            ->value('code');

        // Extract the number part, default to 0
        $lastNumber = $lastCode ? (int) substr($lastCode, 2) : 0;

        // Increment the number
        $newNumber = $lastNumber + 1;

        // Format with leading zeros
        $formattedNumber = str_pad($newNumber, 8, '0', STR_PAD_LEFT);

        // Final nota
        return 'ITM-' . $formattedNumber;
    }
}
