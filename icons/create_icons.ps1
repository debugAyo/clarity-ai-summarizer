Add-Type -AssemblyName System.Drawing

# 128x128
$bmp128 = New-Object System.Drawing.Bitmap(128, 128)
$g128 = [System.Drawing.Graphics]::FromImage($bmp128)
$g128.FillRectangle([System.Drawing.Brushes]::DodgerBlue, 0, 0, 128, 128)
$font128 = New-Object System.Drawing.Font('Arial', 48, [System.Drawing.FontStyle]::Bold)
$g128.DrawString('CS', $font128, [System.Drawing.Brushes]::White, 15, 30)
$bmp128.Save("$PSScriptRoot\icon128.png")
$g128.Dispose()
$bmp128.Dispose()

# 48x48
$bmp48 = New-Object System.Drawing.Bitmap(48, 48)
$g48 = [System.Drawing.Graphics]::FromImage($bmp48)
$g48.FillRectangle([System.Drawing.Brushes]::DodgerBlue, 0, 0, 48, 48)
$font48 = New-Object System.Drawing.Font('Arial', 18, [System.Drawing.FontStyle]::Bold)
$g48.DrawString('CS', $font48, [System.Drawing.Brushes]::White, 5, 12)
$bmp48.Save("$PSScriptRoot\icon48.png")
$g48.Dispose()
$bmp48.Dispose()

# 16x16
$bmp16 = New-Object System.Drawing.Bitmap(16, 16)
$g16 = [System.Drawing.Graphics]::FromImage($bmp16)
$g16.FillRectangle([System.Drawing.Brushes]::DodgerBlue, 0, 0, 16, 16)
$bmp16.Save("$PSScriptRoot\icon16.png")
$g16.Dispose()
$bmp16.Dispose()

Write-Host "✅ Icons created successfully"
