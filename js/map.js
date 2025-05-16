// Only run on the map page
if (document.getElementById('map')) {
  // Initialize map
  const map = L.map('map', {
    worldCopyJump: false,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1.0
  }).setView([20, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    noWrap: true
  }).addTo(map);

  // Helper function to safely parse numbers
  const safeParseInt = (value) => {
    if (value === '*' || value === '' || value === null || value === undefined) return 0;
    const parsed = parseInt(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Color scale for applications
  const colorScale = d3.scaleQuantize()
    .domain([0, 100]) // Adjust based on your data range
    .range(d3.schemeBlues[9]);

  // Categorize scholarship names
  const categorize = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('eta') || lowerName.includes('teaching')) return 'eta';
    if (lowerName.includes('open') || lowerName.includes('study') || lowerName.includes('research')) return 'open';
    return 'other';
  };

  // Get countries that have the selected program type
  const getCountriesWithProgram = (data, category) => {
    const countries = new Set();
    
    data.forEach(row => {
      if (category === 'all' || categorize(row.Scholarship) === category) {
        countries.add(row.Country);
      }
    });

    return countries;
  };

  // Get country stats for the selected category and year
  const getCountryStats = (data, country, category, year) => {
    const countryData = data.filter(row => row.Country === country);
    let stats = {
      applications: 0,
      awards: 0,
      programs: []
    };

    const appsCol = `${year} Applications`;
    const awardsCol = `${year} Awards`;

    if (category === 'all') {
      // For 'all', sum up all programs
      countryData.forEach(row => {
        stats.applications += safeParseInt(row[appsCol]);
        stats.awards += safeParseInt(row[awardsCol]);
        stats.programs.push(row.Scholarship);
      });
    } else {
      // For specific categories, only include matching programs
      countryData.forEach(row => {
        if (categorize(row.Scholarship) === category) {
          stats.applications += safeParseInt(row[appsCol]);
          stats.awards += safeParseInt(row[awardsCol]);
          stats.programs.push(row.Scholarship);
        }
      });
    }

    // Calculate acceptance rate only if there are applications
    stats.rate = stats.applications > 0 ? (stats.awards / stats.applications * 100).toFixed(1) : '0.0';
    return stats;
  };

  // Update map with new data
  const updateMap = (data, category, year) => {
    // Clear existing layers
    map.eachLayer(layer => {
      if (layer instanceof L.GeoJSON) {
        map.removeLayer(layer);
      }
    });

    const countriesWithProgram = getCountriesWithProgram(data, category);

    // Helper to get all country names in the CSV (for all programs/years)
    const allCsvCountries = new Set(data.map(row => row.Country));

    // Load world boundaries
    fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')
      .then(response => response.json())
      .then(topology => {
        const countries = topojson.feature(topology, topology.objects.countries);
        
        L.geoJSON(countries, {
          style: feature => {
            const countryName = feature.properties.name;
            const hasProgram = countriesWithProgram.has(countryName);
            const inCsv = allCsvCountries.has(countryName);
            return {
              fillColor: hasProgram ? '#3182bd' : (inCsv ? '#f0f0f0' : '#fff'),
              fillOpacity: hasProgram ? 0.7 : 0.3,
              weight: 1,
              color: '#666',
              opacity: 0.5
            };
          },
          onEachFeature: (feature, layer) => {
            const countryName = feature.properties.name;
            const hasProgram = countriesWithProgram.has(countryName);
            const inCsv = allCsvCountries.has(countryName);
            let tooltipContent = `<strong>${countryName}</strong><br>`;
            if (hasProgram) {
              const stats = getCountryStats(data, countryName, category, year);
              if (category === 'other') {
                tooltipContent += `Programs: ${stats.programs.join(', ')}`;
              } else {
                tooltipContent += `
                  Applications: ${stats.applications}<br>
                  Awards: ${stats.awards}<br>
                  Acceptance Rate: ${stats.rate}%
                `;
              }
            } else if (inCsv) {
              tooltipContent += `You can apply here! (No applications yet for this program/year)`;
            } else {
              tooltipContent += `No data available.`;
            }
            layer.bindTooltip(tooltipContent);
          }
        }).addTo(map);
      })
      .catch(error => {
        console.error('Error loading world map:', error);
      });
  };

  // Load and process data
  if (!window.csvPath) {
    console.error('CSV path not found. Make sure window.csvPath is set in baseof.html');
  } else {
    // Create data update timestamp element
    const updateInfo = document.createElement('div');
    updateInfo.className = 'map-update-info';
    updateInfo.style.position = 'absolute';
    updateInfo.style.bottom = '10px';
    updateInfo.style.left = '10px';
    updateInfo.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    updateInfo.style.padding = '5px 10px';
    updateInfo.style.borderRadius = '4px';
    updateInfo.style.fontSize = '12px';
    updateInfo.style.zIndex = '1000';
    document.getElementById('map').appendChild(updateInfo);
    console.log('Loading CSV from:', window.csvPath);

    // Fetch the CSV file to get its last modified date
    fetch(window.csvPath, {
      method: 'HEAD'
    })
    .then(response => {
      const lastModified = response.headers.get('Last-Modified');
      const date = new Date(lastModified);
      const updateInfo = document.querySelector('.map-update-info');
      if (updateInfo) {
        updateInfo.textContent = `Data last updated: ${date.toLocaleDateString()}`;
      }
    })
    .catch(error => {
      console.error('Error fetching CSV headers:', error);
    });

    Papa.parse(window.csvPath, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
      transform: value => value.trim(),
      complete: results => {
        if (results.errors.length > 0) {
          console.error('CSV parsing errors:', results.errors);
          console.log('First few rows of data:', results.data.slice(0, 3));
        } else {
          console.log('CSV loaded successfully:', results.data.length, 'rows');
          console.log('Sample row:', results.data[0]);
          window.fulbrightData = results.data;
          
          // Set data update timestamp
          const updateInfo = document.querySelector('.map-update-info');
          if (updateInfo) {
            const csvDate = new Date();
            updateInfo.textContent = `Data last updated: ${csvDate.toLocaleDateString()}`;
          }
          
          // Initial map update
          const initialYear = document.getElementById('yearSelectMap').value;
          updateMap(results.data, 'all', initialYear);

          // Handle category selection
          document.getElementById('catSelectMap').addEventListener('change', e => {
            const year = document.getElementById('yearSelectMap').value;
            updateMap(results.data, e.target.value, year);
          });

          // Handle year selection
          document.getElementById('yearSelectMap').addEventListener('change', e => {
            const category = document.getElementById('catSelectMap').value;
            updateMap(results.data, category, e.target.value);
          });
        }
      },
      error: (error) => {
        console.error('Error loading CSV:', error);
      }
    });
  }
} 