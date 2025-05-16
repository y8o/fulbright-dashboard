# Fulbright Dashboard

The Fulbright Dashboard is an interactive web application for exploring Fulbright program statistics and global coverage. Users can analyze applications, awards, and acceptance rates by country, region, year, and program type, as well as visualize program availability on a world map.

## Features

- **Dynamic Filters:** Filter data by year, region, and program type (Open Study/Research, English Teaching Assistant, Other).
- **Aggregated and Detailed Views:** View country-level summaries or drill down by program and country.
- **Interactive Map:** Visualize Fulbright program coverage worldwide, with filters for program type and year.
- **Responsive UI:** Clean, user-friendly interface built with Hugo and DataTables.

## Getting Started

### Prerequisites

- [Hugo](https://gohugo.io/getting-started/install/) (static site generator)
- [Node.js](https://nodejs.org/) (optional, for advanced asset management)
- Modern web browser

### Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/fulbright-dashboard.git
    cd fulbright-dashboard
    ```

2. **Run the development server:**
    ```bash
    hugo server -D
    ```
    Visit [http://localhost:1313/](http://localhost:1313/) in your browser.

3. **CSV Data:**
    - The dashboard loads its data from `static/fulbright_all_countries.csv`. Update this file to refresh the data.
    - To automatically download and update the data, use the `data_scraping.py` script which uses Selenium to scrape the latest data from the Fulbright website. The script requires:
      - Python 3.x
      - Selenium WebDriver
      - ChromeDriver (for Chrome browser)
      - Required Python packages: `selenium`, `pandas`
    - Run the script using: `python data_scraping.py`

## Project Structure

```
fulbright-dashboard/
├── content/                # Hugo content pages
├── static/                 # Static assets (CSV, JS, etc.)
│   └── fulbright_all_countries.csv
├── themes/
│   └── fulbright-theme/
│       └── layouts/_default/
│           ├── baseof.html
│           ├── home.html
│           └── ...
│       └── layouts/map/
│           └── list.html
├── config.toml             # Hugo site configuration
└── README.md
```

## Customization

- **Update Data:** Replace `static/fulbright_all_countries.csv` with your own data (ensure headers match the existing format).
- **Change Program Types:** Edit the `categorize` function in `home.html` to adjust how programs are classified.
- **Styling:** Modify CSS in `static/css/style.css` or within the theme.

## Deployment

To build the site for production:
```bash
hugo
```
The generated static site will be in the `public/` folder.

## License

MIT License

---

**Questions or suggestions?**  
Open an issue or submit a pull request!