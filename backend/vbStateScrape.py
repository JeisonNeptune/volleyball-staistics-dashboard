import requests
from bs4 import BeautifulSoup
import pandas as pd
import os
import re

# Create folder for output CSVs
output_dir = './backend/data/team_stats'
os.makedirs(output_dir, exist_ok=True)

# List or range of NCAA stat pages to scrape
stat_ids = list(range(525, 535))
base_url = 'https://www.ncaa.com/stats/volleyball-men/d1/current/team/'

for stat_id in stat_ids:
    url = base_url + str(stat_id)
    print(f"📊 Scraping {url}...")

    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    # Use the table header row (first <th>) to identify the stat name
    table = soup.find('table')
    if not table:
        print(f"❌ No table found for stat ID {stat_id}")
        continue

    header_row = table.find('tr')
    if header_row:
        ths = header_row.find_all('th')
        stat_name_guess = ths[3].text.strip() if len(ths) > 3 else f"Stat_{stat_id}"
    else:
        stat_name_guess = f"Stat_{stat_id}"

    # Clean stat name for filename
    safe_name = re.sub(r'[^\w\s-]', '', stat_name_guess).replace(" ", "_")

    # Extract data
    headers = [th.text.strip() for th in table.find_all('th')]
    rows = []
    for tr in table.find_all('tr')[1:]:
        cells = [td.text.strip() for td in tr.find_all('td')]
        if len(cells) == len(headers):
            rows.append(cells)

    df = pd.DataFrame(rows, columns=headers)

    # Save to a unique file per stat
    output_path = os.path.join(output_dir, f"{safe_name}.csv")
    df.to_csv(output_path, index=False)
    print(f"✅ Saved: {output_path}")
