/**
 * RFC 4180 Compliant CSV Parser & Serializer for SIRAGRO Admin imports and exports.
 */

/**
 * Parses raw CSV text into a 2D array of string cells.
 * Correctly handles commas inside quotes, escaped quotes (""), and newlines.
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  const sanitized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < sanitized.length; i++) {
    const char = sanitized[i];
    const nextChar = sanitized[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentCell += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      // End of cell
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if (char === "\n" && !insideQuotes) {
      // End of row
      currentRow.push(currentCell.trim());
      // Only push non-empty rows
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  // Push final trailing cell/row if present
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Converts CSV text into an array of typed objects based on header row.
 */
export function csvToObjects(text: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const parsed = parseCSV(text);
  if (parsed.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = parsed[0];
  const headers = rawHeaders.map((h) => h.toLowerCase().trim());
  const rows: Record<string, string>[] = [];

  for (let r = 1; r < parsed.length; r++) {
    const row = parsed[r];
    const record: Record<string, string> = {};
    headers.forEach((header, colIndex) => {
      record[header] = row[colIndex] !== undefined ? row[colIndex] : "";
    });
    rows.push(record);
  }

  return { headers, rows };
}

/**
 * Converts a list of records to CSV string with proper quoting.
 */
export function objectsToCSV(
  headers: string[],
  rows: Record<string, unknown>[]
): string {
  const escapeCell = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCell(row[h])).join(",")
  );

  return [headerLine, ...dataLines].join("\n");
}

