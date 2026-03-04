export type ExportCell = string | number | boolean | null | undefined;
export type ExportRow = Record<string, ExportCell>;

function formatTimestampForFile(date: Date = new Date()): string {
  const iso = date.toISOString().replace(/[-:]/g, '');
  return iso.slice(0, 15); // YYYYMMDDTHHMMSS
}

function sanitizeFileSegment(segment: string): string {
  return segment
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function escapeCsvValue(value: ExportCell): string {
  if (value === null || value === undefined) return '';
  const normalized = String(value);
  if (/[",\n;]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildExportFilename(baseName: string, extension: 'csv' | 'pdf'): string {
  const safeBase = sanitizeFileSegment(baseName) || 'export';
  return `${safeBase}_${formatTimestampForFile()}.${extension}`;
}

export function exportRowsToCsv(baseName: string, columns: Array<{ key: string; label: string }>, rows: ExportRow[]) {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(';');
  const body = rows
    .map((row) => columns.map((column) => escapeCsvValue(row[column.key])).join(';'))
    .join('\n');

  const content = `\uFEFF${header}\n${body}`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(buildExportFilename(baseName, 'csv'), blob);
}

function escapeHtml(value: ExportCell): string {
  const stringValue = value === null || value === undefined ? '' : String(value);
  return stringValue
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getPrintStyles() {
  return `
    <style>
      @page { size: A4 portrait; margin: 16mm; }
      body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
      h1 { font-size: 18px; margin: 0 0 4px; }
      p { margin: 0 0 12px; color: #6b7280; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
      th { background: #f9fafb; font-weight: 600; }
      .meta { margin-bottom: 12px; font-size: 11px; color: #4b5563; }
      .nowrap { white-space: nowrap; }
    </style>
  `;
}

export function printRowsAsPdf(
  baseName: string,
  title: string,
  subtitle: string,
  columns: Array<{ key: string; label: string; nowrap?: boolean }>,
  rows: ExportRow[]
) {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');
  if (!win) return;

  const headerHtml = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const rowHtml = rows
    .map((row) => {
      const cells = columns
        .map((column) => {
          const classes = column.nowrap ? ' class="nowrap"' : '';
          return `<td${classes}>${escapeHtml(row[column.key])}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        ${getPrintStyles()}
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
        <div class="meta">Arquivo: ${escapeHtml(buildExportFilename(baseName, 'pdf'))}</div>
        <table>
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${rowHtml}</tbody>
        </table>
      </body>
    </html>
  `;

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
