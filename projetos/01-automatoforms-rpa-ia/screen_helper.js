const { execSync } = require('child_process');

function getScreenBounds() {
  try {
    const psScript = "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null; $w = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea; Write-Output ($w.Width.ToString() + 'x' + $w.Height.ToString())";
    const out = execSync(`powershell -NoProfile -Command "${psScript}"`, { encoding: 'utf-8', timeout: 3000 }).trim();
    const parts = out.split('x');
    if (parts.length === 2) {
      const width = parseInt(parts[0], 10);
      const height = parseInt(parts[1], 10);
      if (width > 500 && height > 300) {
        return { width, height };
      }
    }
  } catch (e) {
    console.warn('[ScreenBounds] Usando resolução padrão:', e.message);
  }
  return { width: 2560, height: 1392 }; // Resolução nativa QHD do professor
}

function posicionarJanelaPorTitulo(tituloBusca, x, y, largura, altura) {
  try {
    const ps = `
[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null
$code = @'
using System;
using System.Runtime.InteropServices;
public class WinUtil {
    [DllImport("user32.dll")]
    public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
}
'@
Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue

$procs = Get-Process | Where-Object { $_.ProcessName -like '*chrome*' -and $_.MainWindowTitle -like '*${tituloBusca}*' -and $_.MainWindowHandle -ne 0 }
foreach ($p in $procs) {
    [WinUtil]::ShowWindow($p.MainWindowHandle, 1) | Out-Null
    [WinUtil]::MoveWindow($p.MainWindowHandle, ${x}, ${y}, ${largura}, ${altura}, $true) | Out-Null
}
`;
    execSync(`powershell -NoProfile -Command "${ps.replace(/\r?\n/g, ' ')}"`, { encoding: 'utf-8', timeout: 4000 });
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { getScreenBounds, posicionarJanelaPorTitulo };
