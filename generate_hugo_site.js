#!/usr/bin/env node
/**
 * generate_hugo_site.js
 *
 * A Node.js script to scaffold a Hugo site for the Fulbright Dashboard,
 * including automatic CSV placement and interactive table visualization.
 */

const fs   = require('fs');
const path = require('path');

// Project file definitions
const files = {
  // Hugo configuration
  'config.toml': `
baseURL = "/"
title = "Fulbright Dashboard"
theme = "fulbright-theme"
enableGitInfo = false
`,

  // Base HTML template with DataTables, Chart.js, and Papa Parse
  'themes/fulbright-theme/layouts/_default/baseof.html': `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ .Title }} - {{ .Site.Title }}</title>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="stylesheet" href="https://cdn.datatables.net/1.13.4/css/jquery.dataTables.min.css">
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
  <script src="https://cdn.datatables.net/1.13.4/js/jquery.dataTables.min.js"></script>
</head>
<body>
  {{ block "main" . }}{{ end }}
</body>
</html>
`,

  // Home page layout with filters and table
  'themes/fulbright-theme/layouts/index.html': `
{{ define "main" }}
<h1>Fulbright Dashboard</h1>
<div class="filters">
  <label for="yearSelect">Year:</label>
  <select id="yearSelect">
    <option value="2023-2024">2023-2024</option>
    <option value="2024-2025">2024-2025</option>
    <option value="2025-2026">2025-2026</option>
  </select>
  <label for="catSelect">Category:</label>
  <select id="catSelect">
    <option value="all">All</option>
    <option value="eta">English Teaching</option>
    <option value="open">Open Study</option>
    <option value="other">Other Programs</option>
  </select>
</div>
<table id="data-table" class="display" style="width:100%">
  <thead>
    <tr>
      <th>Country</th>
      <th>Applications</th>
      <th>Awards</th>
      <th>Acceptance Rate</th>
    </tr>
  </thead>
</table>
<script src="/js/dashboard.js"></script>
{{ end }}
`,

  // About page layout
  'themes/fulbright-theme/layouts/about/single.html': `
{{ define "main" }}
<h1>About This Dashboard</h1>
{{ .Content }}
{{ end }}
`,

  // About page content
  'content/about/_index.md': `
---
title: "About"
---
This dashboard visualizes Fulbright scholarship and ETA statistics across countries using interactive tables and charts.
`,

  // Client-side JS: load CSV, filter, aggregate, and create DataTable
  'themes/fulbright-theme/static/js/dashboard.js': `
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
`,

  // Basic styling
  'themes/fulbright-theme/static/css/style.css': `
body { font-family: Arial, sans-serif; margin: 2rem; }
h1 { color: #334e59; }
.filters { margin-bottom: 1rem; }
label { margin-right: 0.5rem; }
#data-table { width: 100%; }
`
};

// Write all files to disk
Object.entries(files).forEach(([relPath, content]) => {
  const fullPath = path.join(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trimStart(), 'utf8');
  console.log(`Wrote ${relPath}`);
});

// Copy CSV if present
const srcCsv = path.join(process.cwd(), 'fulbright_all_countries.csv');
const destCsv = path.join(process.cwd(), 'themes/fulbright-theme/static/fulbright_all_countries.csv');
if (fs.existsSync(srcCsv)) {
  fs.copyFileSync(srcCsv, destCsv);
  console.log('Copied fulbright_all_countries.csv to static folder');
} else {
  console.warn('Warning: fulbright_all_countries.csv not found at project root. Please place it manually in static.');
}

console.log(`\n🎉 Scaffold complete! Run 'hugo server -D' and visit http://localhost:1313`);
