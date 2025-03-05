#!/bin/bash

# Create the ephemeris directory if it doesn't exist
mkdir -p public/ephe

# Download planetary files from Astro.com's FTP server
# Note: These URLs are from the official Swiss Ephemeris documentation
EPHE_FILES=(
    "https://www.astro.com/ftp/swisseph/ephe/sepl_18.se1"
    "https://www.astro.com/ftp/swisseph/ephe/semo_18.se1"
    "https://www.astro.com/ftp/swisseph/ephe/sepl_24.se1"
    "https://www.astro.com/ftp/swisseph/ephe/semo_24.se1"
)

cd public/ephe

for url in "${EPHE_FILES[@]}"; do
    echo "Downloading ${url##*/}..."
    curl -O "$url"
done

# Copy existing files from swisseph-master/ephe
echo "Copying existing ephemeris files..."
cp ../../swisseph-master/ephe/*.se1 .
cp ../../swisseph-master/ephe/sefstars.txt .

echo "Setup complete. Swiss Ephemeris files are now in public/ephe/" 