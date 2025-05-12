// dashboard.js

// Helpers
function categorize(name) {
  const n = name.toLowerCase();
  if (n.includes('teaching assistant') || n.includes('debate coach'))   return 'eta';
  if (n.includes('open study') || n.includes('open research'))         return 'open';
  return 'other';
}

// State
let rawData = [];
let table;

// Load CSV on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log("📥 Loading CSV…");
  Papa.parse('/fulbright_all_countries.csv', {
    header: true,
    download: true,
    skipEmptyLines: true,
    complete: ({ data }) => {
      console.log("✅ CSV parsed, rows:", data.length);
      rawData = data;
      setupFilters();
      renderTable();
    },
    error: err => console.error("❌ CSV load error:", err),
  });
});

// Wire up filter change handlers
function setupFilters() {
  document.getElementById('yearSelect')
          .addEventListener('change', renderTable);
  document.getElementById('catSelect')
          .addEventListener('change', renderTable);
}

// Main rendering routine
function renderTable() {
  if (!rawData.length) return;

  const year     = document.getElementById('yearSelect').value;
  const category = document.getElementById('catSelect').value;

  // Aggregation: { country: { apps: n, awds: m } }
  const agg = {};

  rawData.forEach(row => {
    const ctry = row.Country;
    const catg = categorize(row.Scholarship);
    if (category !== 'all' && catg !== category) return;

    // Pull out the two relevant columns for that year
    const apps = parseInt(row[`${year} Applications`]) || 0;
    const awds = parseInt(row[`${year} Awards`])       || 0;

    if (!agg[ctry]) agg[ctry] = { apps:0, awds:0 };
    agg[ctry].apps += apps;
    agg[ctry].awds += awds;
  });

  // Build table data
  const tableData = Object.entries(agg).map(([ctry, vals]) => {
    const rate = vals.apps > 0
      ? ((vals.awds / vals.apps) * 100).toFixed(1) + '%'
      : '-';
    return [ctry, vals.apps, vals.awds, rate];
  });

  // Initialize / update DataTable
  if (!table) {
    table = $('#data-table').DataTable({
      data: tableData,
      columns: [
        { title: 'Country' },
        { title: 'Applications', className: 'dt-body-right' },
        { title: 'Awards',       className: 'dt-body-right' },
        { title: 'Acceptance Rate', className: 'dt-body-right' },
      ],
      order: [[1, 'desc']],  // sort by Applications descending
    });
  } else {
    table.clear();
    table.rows.add(tableData);
    table.draw();
  }
}
