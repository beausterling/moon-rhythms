import os
import requests
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

# Create output directory
output_dir = Path("public/moon-phases")
output_dir.mkdir(parents=True, exist_ok=True)

def download_image(hour):
    """Download a single moon phase image for the given hour."""
    # NASA's image URL format
    url = f"https://svs.gsfc.nasa.gov/vis/a000000/a004500/a004537/frames/730x730_1x1_30p/moon.{hour:04d}.jpg"
    output_path = output_dir / f"moon.{hour:04d}.jpg"
    
    # Skip if file exists and has content
    if output_path.exists() and output_path.stat().st_size > 0:
        print(f"Skipping existing file: {output_path}")
        return
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            f.write(response.content)
        print(f"Downloaded: {output_path}")
        
        # Be nice to NASA's servers
        time.sleep(0.5)
        
    except Exception as e:
        print(f"Error downloading hour {hour}: {e}")

def main():
    # Start from 4216 and continue to 8760
    start_hour = 4216
    total_hours = 8760
    
    print(f"Starting download from hour {start_hour} to {total_hours}...")
    
    # Use thread pool to speed up downloads while being respectful
    with ThreadPoolExecutor(max_workers=4) as executor:
        executor.map(download_image, range(start_hour, total_hours + 1))
    
    print("Download complete!")

if __name__ == "__main__":
    main() 