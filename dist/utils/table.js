export function renderTable(headers, rows) {
    const widths = headers.map((header, index) => Math.max(header.length, ...rows.map((row) => (row[index] ?? "").length)));
    const renderRow = (row) => row.map((cell, index) => cell.padEnd(widths[index] ?? cell.length)).join("  ");
    return [renderRow(headers), renderRow(widths.map((width) => "-".repeat(width))), ...rows.map(renderRow)].join("\n");
}
//# sourceMappingURL=table.js.map