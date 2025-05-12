// dashboard.js

// Helper: categorize program
function categorize(prog) {
  const p = prog.toLowerCase();
  if (p.includes('teaching assistant') || p.includes('debate coach')) return 'eta';
  if (p.includes('open study') || p.includes('open research')) return 'open';
  return 'other';
}

let rawData = [];
let table;

function loadAndRender() {
  Papa.parse('/fulbright_all_countries.csv', {
    header: true,
    download: true,
    skipEmptyLines: true,
    complete: results => {
      rawData = results.data;
      renderTable();
    }
  });
}

function renderTable() {
  const year = document.getElementById('yearSelect').value;
  const cat  = document.getElementById('catSelect').value;

  // Aggregate by country
  const agg = {};
  rawData.forEach(row => {
    const country = row.Country;
    const progCat = categorize(row.Program);
    if (cat !== 'all' && progCat !== cat) return;
    const apps = parseInt(row[year + ' Applications'])||0;
    const awds = parseInt(row[year + ' Awards'])||0;
    if (!agg[country]) agg[country] = { apps:0, awds:0 };
    agg[country].apps += apps;
    agg[country].awds += awds;
  });

  const tableData = Object.entries(agg).map(([country, v]) => {
    const rate = v.apps ? ((v.awds/v.apps)*100).toFixed(1)+'%' : '-';
    return [country, v.apps, v.awds, rate];
  });

  if (table) table.clear().rows.add(tableData).draw();
  else {
    table = $('#data-table').DataTable({
      data: tableData,
      columns: [
        { title: 'Country' },
        { title: 'Applications' },
        { title: 'Awards' },
        { title: 'Acceptance Rate' }
      ],
      order: [[1,'desc']]
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('yearSelect').addEventListener('change', renderTable);
  document.getElementById('catSelect').addEventListener('change', renderTable);
  loadAndRender();
});
