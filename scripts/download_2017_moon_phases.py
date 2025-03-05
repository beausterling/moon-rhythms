import requests
import os
from datetime import datetime, timedelta
import swisseph as swe
import math

# Set up Swiss Ephemeris path
swe.set_ephe_path('ephe')

def get_new_moons_2017():
    """Calculate the first and last new moons of 2017 with exact hours"""
    # Start from beginning of 2017
    start_date = datetime(2017, 1, 1)
    # End at beginning of 2018
    end_date = datetime(2018, 1, 1)
    
    new_moons = []
    current_date = start_date
    
    while current_date < end_date:
        # Check every hour
        for hour in range(24):
            current_datetime = current_date + timedelta(hours=hour)
            
            # Convert to Julian Day
            jd = swe.julday(current_datetime.year, current_datetime.month, 
                          current_datetime.day, hour)
            
            # Calculate moon phase
            moon_data = swe.calc_ut(jd, swe.MOON)
            sun_data = swe.calc_ut(jd, swe.SUN)
            
            # Calculate the angle between Sun and Moon
            moon_phase = (moon_data[0][0] - sun_data[0][0]) % 360
            
            # If we're close to a new moon (phase near 0 or 360)
            if abs(moon_phase) < 1 or abs(moon_phase - 360) < 1:
                new_moons.append(current_datetime)
        
        current_date += timedelta(days=1)
    
    return new_moons[0], new_moons[-1]  # First and last new moons

def datetime_to_hour_number(dt):
    """Convert a datetime in 2017 to its hour number (1-8760)"""
    start_of_2017 = datetime(2017, 1, 1)
    diff = dt - start_of_2017
    return int(diff.total_seconds() / 3600) + 1  # +1 because hours are 1-based

def download_image(hour_number, output_dir):
    """Download a specific moon phase image"""
    base_url = 'https://svs.gsfc.nasa.gov/vis/a000000/a004500/a004537/frames/730x730_1x1_30p/'
    padded_number = str(hour_number).zfill(4)
    filename = f'moon.{padded_number}.jpg'
    url = base_url + filename
    output_path = os.path.join(output_dir, filename)
    
    if not os.path.exists(output_path):  # Only download if file doesn't exist
        try:
            response = requests.get(url)
            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                print(f'Downloaded {filename}')
            else:
                print(f'Failed to download {filename}')
        except Exception as e:
            print(f'Error downloading {filename}: {e}')

def main():
    # Create output directory
    output_dir = os.path.join('public', 'moon-phases')
    os.makedirs(output_dir, exist_ok=True)
    
    # Download all 8760 images (one for each hour of 2017)
    print("Downloading all moon phase images for 2017...")
    for hour in range(1, 8761):  # 8760 hours in a year
        download_image(hour, output_dir)
        if hour % 100 == 0:  # Progress update every 100 images
            print(f'Progress: {hour}/8760 images')
    
    # Get first and last new moons with exact hours
    first_new_moon, last_new_moon = get_new_moons_2017()
    
    # Convert to hour numbers
    start_hour = datetime_to_hour_number(first_new_moon)
    end_hour = datetime_to_hour_number(last_new_moon)
    
    print(f'First new moon of 2017: {first_new_moon} (hour {start_hour})')
    print(f'Last new moon of 2017: {last_new_moon} (hour {end_hour})')
    
    # Save these numbers for the animation
    with open(os.path.join('public', 'moon-phases', 'sequence.txt'), 'w') as f:
        f.write(f'{start_hour}\n{end_hour}')

if __name__ == '__main__':
    main() 