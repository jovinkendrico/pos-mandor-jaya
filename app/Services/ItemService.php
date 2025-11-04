<?php

namespace App\Services;


use Illuminate\Support\Facades\DB;

class ItemService
{
    public static function generateCode()
    {
        $lastCode = DB::table('items')
            ->whereNotNull('code')
            ->orderByDesc('id')
            ->value('code');


        $lastNumber = $lastCode ? (int) substr($lastCode, 4) : 0;

        $newNumber = $lastNumber + 1;

        $formattedNumber = str_pad($newNumber, 8, '0', STR_PAD_LEFT);

        return 'ITM-' . $formattedNumber;
    }
}
