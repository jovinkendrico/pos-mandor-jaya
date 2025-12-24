<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ImportService
{
    /**
     * Parse Excel file and return array of rows as associative arrays
     */
    public function parseExcel(UploadedFile $file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = [];
        
        // Get the highest row and column
        $highestRow = $worksheet->getHighestRow();
        $highestColumn = $worksheet->getHighestColumn();
        
        // Get header row (first row)
        $header = [];
        $columnIndex = Coordinate::columnIndexFromString($highestColumn);
        for ($col = 1; $col <= $columnIndex; $col++) {
            $colLetter = Coordinate::stringFromColumnIndex($col);
            $cellValue = $worksheet->getCell($colLetter . '1')->getValue();
            $header[] = $cellValue ? trim((string)$cellValue) : '';
        }
        
        // Normalize header keys to lowercase
        $headerKeys = array_map(function($value) {
            return trim(strtolower($value));
        }, $header);
        
        // Read data rows (starting from row 2)
        for ($row = 2; $row <= $highestRow; $row++) {
            $rowData = [];
            
            for ($col = 1; $col <= $columnIndex; $col++) {
                $colLetter = Coordinate::stringFromColumnIndex($col);
                $cellValue = $worksheet->getCell($colLetter . $row)->getValue();
                $value = $cellValue !== null ? trim((string)$cellValue) : '';
                
                // Map to header key if available
                if (isset($headerKeys[$col - 1])) {
                    $rowData[$headerKeys[$col - 1]] = $value;
                }
            }
            
            // Only add row if it has at least one non-empty value
            if (!empty(array_filter($rowData))) {
                $rows[] = $rowData;
            }
        }
        
        return $rows;
    }

    /**
     * Generate Excel template file
     */
    public function generateExcelTemplate(array $headers, array $sampleRows = []): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Set headers
        $colIndex = 1;
        foreach ($headers as $header) {
            $colLetter = Coordinate::stringFromColumnIndex($colIndex);
            $sheet->setCellValue($colLetter . '1', $header);
            $colIndex++;
        }
        
        // Set sample rows if provided
        $row = 2;
        foreach ($sampleRows as $sampleRow) {
            $colIndex = 1;
            foreach ($sampleRow as $value) {
                $colLetter = Coordinate::stringFromColumnIndex($colIndex);
                $sheet->setCellValue($colLetter . $row, $value);
                $colIndex++;
            }
            $row++;
        }
        
        // Auto-size columns
        for ($i = 1; $i < $colIndex; $i++) {
            $colLetter = Coordinate::stringFromColumnIndex($i);
            $sheet->getColumnDimension($colLetter)->setAutoSize(true);
        }
        
        // Save to temporary file
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_template_') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempFile);
        
        return $tempFile;
    }
}

