from selenium import webdriver
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pandas as pd
import time

# 1) Headless Firefox
options = Options()
options.add_argument("--headless")
service = Service("/home/lou/Applications/geckodriver")
driver = webdriver.Firefox(service=service, options=options)

driver.get("https://us.fulbrightonline.org/study-research-eta-statistics")
time.sleep(3)

# 2) Remove any cookie/OneTrust overlays
driver.execute_script("""
  document.querySelectorAll('[id^="onetrust"], .ot-cookie-policy-link').forEach(el => el.remove());
  document.body.style.overflow = 'auto';
""")
time.sleep(1)

wait = WebDriverWait(driver, 10)
all_rows = []

# 3) Find every country panel
countries = wait.until(EC.presence_of_all_elements_located((
    By.CSS_SELECTOR, "div.countryContent[data-id]"
)))

for country in countries:
    country_id = country.get_attribute("data-id")
    country_name = country.find_element(By.CSS_SELECTOR, ".head").text.strip()
    if not country_name:
        continue

    # 4) Expand via site JS
    driver.execute_script("showCountryContent(arguments[0])", country)
    time.sleep(0.8)  # allow injection

    # 5) Scrape each programContent block for this country
    blocks = driver.find_elements(
        By.CSS_SELECTOR,
        f"div.programContent[data-countryid='{country_id}']"
    )

    for b in blocks:
        name = b.find_element(By.CSS_SELECTOR, ".headTitle").text.strip()
        if not name:
            continue

        cells = b.find_elements(
            By.CSS_SELECTOR,
            ".res-item-block.text-center, .res-item-block-dott.text-center"
        )
        vals = [c.text.strip() for c in cells]
        if len(vals) != 6:
            continue

        all_rows.append([
            country_name, name,
            vals[0], vals[1],
            vals[2], vals[3],
            vals[4], vals[5],
        ])

# 6) Build DataFrame
df = pd.DataFrame(
    all_rows,
    columns=[
        "Country",
        "Scholarship",
        "2023-2024 Applications","2023-2024 Awards",
        "2024-2025 Applications","2024-2025 Awards",
        "2025-2026 Applications","2025-2026 Awards",
    ]
)

# 7) Save to CSV
df.to_csv("fulbright_all_countries.csv", index=False)
print(f"Scraped {len(df)} rows across {df['Country'].nunique()} countries.")

driver.quit()