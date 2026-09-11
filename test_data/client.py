import requests
from bs4 import BeautifulSoup

BASE_URL = "https://noaadata.apps.nsidc.org/NOAA/G02135/south/daily/geotiff/"

def find_latest_geotiff():
    response = requests.get(BASE_URL)

    soup = BeautifulSoup(response.text, "html.parser")

    years = []
    
    for link in soup.find_all("a"):
        href = (link.get("href"))

        if href and href.rstrip("/").isdigit():
            years.append(int(href.rstrip("/")))

    latest_year = max(years)

    year_url = f"{BASE_URL}{latest_year}/"

    response = requests.get(year_url)
    soup = BeautifulSoup(response.text, "html.parser")

    print("Latest year:", latest_year)

find_latest_geotiff()

"""
our Python file
      ↓
requests.get()
      ↓
NSIDC server
      ↓
HTTP response
"""