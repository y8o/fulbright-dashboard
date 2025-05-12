// map.js

// Categorize each scholarship name into one of our four buckets
function categorize(name){
    const n = name.toLowerCase();
    if (n.includes('teaching assistant') || n.includes('debate coach')) return 'eta';
    if (n.includes('open study')     || n.includes('open research')) return 'open';
    return 'other';
  }
  
  // A simple color ramp for # of applicants
  function getColor(d) {
    return d > 500  ? '#800026' :
           d > 200  ? '#BD0026' :
           d > 100  ? '#E31A1C' :
           d >  50  ? '#FC4E2A' :
           d >  20  ? '#FD8D3C' :
           d >  10  ? '#FEB24C' :
           d >   0  ? '#FED976' :
                      '#EEE';
  }
  
  let map, geoLayer;
  
  document.addEventListener('DOMContentLoaded', () => {
    // 1) Initialize Leaflet map
    map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 5
    }).addTo(map);
  
    // 2) When dropdown changes, re-render
    document.getElementById('catSelectMap').addEventListener('change', renderMap);
  
    // 3) Load the CSV data once
    Papa.parse(window.csvPath, {
      download: true,
      skipEmptyLines: true,
      complete: results => {
        window.fulbrightData = results.data;
        renderMap();
      },
      error: err => console.error('CSV load error:', err)
    });
  });
  
  function renderMap() {
    const cat = document.getElementById('catSelectMap').value;
    const agg = {};
  
    // Aggregate 2023–24 apps and awards by country & category
    window.fulbrightData.forEach(r => {
      const country = r.Country;
      const progCat = categorize(r.Scholarship);
      if (cat !== 'all' && progCat !== cat) return;
  
      const apps = parseInt(r['2023-2024 Applications']) || 0;
      const awds = parseInt(r['2023-2024 Awards'])       || 0;
  
      if (!agg[country]) agg[country] = { apps: 0, awds: 0 };
      agg[country].apps += apps;
      agg[country].awds += awds;
    });
  
    // Remove old layer if present
    if (geoLayer) {
      map.removeLayer(geoLayer);
    }
  
    // Fetch world boundaries and draw
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(topoData => {
        const worldGeo = topojson.feature(topoData, topoData.objects.countries);
  
        geoLayer = L.geoJson(worldGeo, {
          style: feature => {
            const cnt = agg[feature.properties.name];
            const d = cnt ? cnt.apps : 0;
            return {
              fillColor: getColor(d),
              fillOpacity: cnt ? 0.6 : 0.2,
              color: '#444',
              weight: 1
            };
          },
          onEachFeature: (feature, layer) => {
            const cnt = agg[feature.properties.name] || {apps:0,awds:0};
            const rate = cnt.apps
              ? ((cnt.awds / cnt.apps) * 100).toFixed(1) + '%'
              : '–';
            layer.bindTooltip(
              `<strong>${feature.properties.name}</strong><br/>
               Applications: ${cnt.apps}<br/>
               Awards: ${cnt.awds}<br/>
               Acceptance Rate: ${rate}`,
              { sticky: true }
            );
          }
        }).addTo(map);
      })
      .catch(err => console.error('TopoJSON load error:', err));
  }
  // static/js/map.js

function categorize(name){
  const n = name.toLowerCase();
  if (n.includes('teaching assistant') || n.includes('debate coach')) return 'eta';
  if (n.includes('open study')     || n.includes('open research')) return 'open';
  return 'other';
}

function getColor(d) {
  return d > 500  ? '#800026' :
         d > 200  ? '#BD0026' :
         d > 100  ? '#E31A1C' :
         d >  50  ? '#FC4E2A' :
         d >  20  ? '#FD8D3C' :
         d >  10  ? '#FEB24C' :
         d >   0  ? '#FED976' :
                    '#EEE';
}

let map, geoLayer;

document.addEventListener('DOMContentLoaded', () => {
  // only proceed if #map exists on the page
  const container = document.getElementById('map');
  if (!container) return;

  map = L.map('map').setView([20,0],2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:5 }).addTo(map);

  document.getElementById('catSelectMap').addEventListener('change', renderMap);

  Papa.parse(window.csvPath, {
    header: true,
    download: true,
    skipEmptyLines: true,
    complete: ({ data }) => {
      window.fulbrightData = data;
      renderMap();
    },
    error: err => console.error('CSV load error:', err)
  });
});

function renderMap(){
  const cat = document.getElementById('catSelectMap').value;
  const agg = {};

  window.fulbrightData.forEach(r => {
    const ctry = r.Country;
    const pc = categorize(r.Scholarship);
    if (cat !== 'all' && pc !== cat) return;

    const apps = parseInt(r['2023-2024 Applications']) || 0;
    const awds = parseInt(r['2023-2024 Awards'])       || 0;
    if (!agg[ctry]) agg[ctry] = { apps:0, awds:0 };
    agg[ctry].apps += apps;
    agg[ctry].awds += awds;
  });

  if (geoLayer) map.removeLayer(geoLayer);

  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(r => r.json())
    .then(topo => {
      const world = topojson.feature(topo, topo.objects.countries);
      geoLayer = L.geoJson(world, {
        style: f => {
          const d = agg[f.properties.name]?.apps || 0;
          return {
            fillColor: getColor(d),
            fillOpacity: d ? 0.6 : 0.2,
            color: '#444', weight:1
          };
        },
        onEachFeature: (f, layer) => {
          const c = agg[f.properties.name] || { apps:0, awds:0 };
          const rate = c.apps ? ((c.awds/c.apps)*100).toFixed(1)+'%' : '–';
          layer.bindTooltip(
            `<strong>${f.properties.name}</strong><br/>
             Applications: ${c.apps}<br/>
             Awards: ${c.awds}<br/>
             Rate: ${rate}`, { sticky:true }
          );
        }
      }).addTo(map);
    })
    .catch(err => console.error('TopoJSON load error:', err));
}
