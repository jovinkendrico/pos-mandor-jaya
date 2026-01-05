@echo off
set "FOLDER_DOWNLOAD=%USERPROFILE%\Downloads"
set "PRINTER_NAME=EPSON LX-310 ESCP"

echo ===========================================
echo    MANDOR JAYA - AUTO PRINT DOT MATRIX
echo ===========================================
echo Menunggu file nota di folder Downloads...

:loop
:: Cek apakah ada file nota (sale atau purchase)
if exist "%FOLDER_DOWNLOAD%\sale-*.txt" goto :print
if exist "%FOLDER_DOWNLOAD%\purchase-*.txt" goto :print

:: Tunggu 2 detik sebelum cek lagi
timeout /t 2 >nul
goto :loop

:print
echo.
echo Menemukan nota baru! Sedang mengirim ke %PRINTER_NAME%...

:: Mengirim file langsung ke printer (Cara paling cepat & presisi untuk Dot Matrix)
:: Menggunakan COPY /B agar font asli printer yang keluar
for %%F in ("%FOLDER_DOWNLOAD%\sale-*.txt" "%FOLDER_DOWNLOAD%\purchase-*.txt") do (
    copy /b "%%F" "\\localhost\%PRINTER_NAME%"
    if %errorlevel% equ 0 (
        echo Berhasil mencetak: %%~nxF
        del "%%F"
    ) else (
        echo.
        echo GAGAL! Pastikan printer sudah di-SHARE dengan nama: %PRINTER_NAME%
        echo Tips: Klik kanan printer ^> Printer Properties ^> Sharing ^> Share this printer.
        pause
    )
)

echo.
echo Kembali memantau nota baru...
goto :loop
