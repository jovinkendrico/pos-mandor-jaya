<?php

namespace App\Helpers;

class NumberToWords
{
    private static $ones = [
        '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
        'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
        'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'
    ];

    public static function convert($number)
    {
        if ($number == 0) {
            return 'nol';
        }

        $number = abs($number);

        if ($number < 20) {
            return self::$ones[$number];
        }

        if ($number < 100) {
            $tens = floor($number / 10);
            $units = $number % 10;
            return ($tens == 1 ? 'sepuluh' : self::$ones[$tens] . ' puluh') . ($units > 0 ? ' ' . self::$ones[$units] : '');
        }

        if ($number < 1000) {
            $hundreds = floor($number / 100);
            $remainder = $number % 100;
            return ($hundreds == 1 ? 'seratus' : self::$ones[$hundreds] . ' ratus') . ($remainder > 0 ? ' ' . self::convert($remainder) : '');
        }

        if ($number < 1000000) {
            $thousands = floor($number / 1000);
            $remainder = $number % 1000;
            return ($thousands == 1 ? 'seribu' : self::convert($thousands) . ' ribu') . ($remainder > 0 ? ' ' . self::convert($remainder) : '');
        }

        if ($number < 1000000000) {
            $millions = floor($number / 1000000);
            $remainder = $number % 1000000;
            return self::convert($millions) . ' juta' . ($remainder > 0 ? ' ' . self::convert($remainder) : '');
        }

        if ($number < 1000000000000) {
            $billions = floor($number / 1000000000);
            $remainder = $number % 1000000000;
            return self::convert($billions) . ' miliar' . ($remainder > 0 ? ' ' . self::convert($remainder) : '');
        }

        return 'number too large';
    }
}
