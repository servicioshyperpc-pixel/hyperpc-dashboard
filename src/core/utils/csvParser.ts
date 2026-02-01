export interface CsvRow {
  [key: string]: string;
}

export function parseCsv(csvText: string): CsvRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: CsvRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: CsvRow = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }
  
  return rows;
}

export function parseExcel(file: File): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        // Simple CSV-like parsing for demo
        const rows = parseCsv(text);
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
}

export function validateUploadData(data: CsvRow[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (data.length === 0) {
    errors.push('El archivo está vacío');
    return { valid: false, errors };
  }
  
  const requiredFields = ['sku', 'quantity'];
  const firstRow = data[0];
  
  requiredFields.forEach(field => {
    if (!(field in firstRow)) {
      errors.push(`Falta campo requerido: ${field}`);
    }
  });
  
  data.forEach((row, index) => {
    if (!row.sku) errors.push(`Fila ${index + 1}: SKU vacío`);
    if (!row.quantity || isNaN(Number(row.quantity))) {
      errors.push(`Fila ${index + 1}: Cantidad inválida`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}
