import os
import sys
import math
from datetime import datetime, timedelta
import swisseph as swe

def calculate_phase_angle(jd):
    """Calculate the phase angle of the moon for a given Julian Day."""
    flags = swe.FLG_SWIEPH
    ret_moon = swe.calc_ut(jd, swe.MOON, flags)
    moon_lon = ret_moon[0][0]  # First element of first tuple is longitude
    
    ret_sun = swe.calc_ut(jd, swe.SUN, flags)
    sun_lon = ret_sun[0][0]  # First element of first tuple is longitude
    
    phase_angle = (moon_lon - sun_lon) % 360
    return phase_angle

def find_loop_point(start_date, images_dir):
    """
    Find the optimal loop point in the sequence of moon images.
    Returns the start and end image numbers for the best loop.
    """
    # Calculate initial phase angle
    jd = swe.julday(start_date.year, start_date.month, start_date.day, 
                    start_date.hour + start_date.minute/60.0)
    initial_phase = calculate_phase_angle(jd)
    print(f"Initial phase angle: {initial_phase:.2f}°")
    
    # Lunar synodic month is approximately 29.53 days
    synodic_month = 29.53 * 24  # Convert to hours
    
    # We'll check around the synodic month time
    check_range = 72  # Check ±72 hours around the synodic month
    best_match = None
    min_diff = float('inf')
    
    base_hours = int(synodic_month)
    for hours in range(base_hours - check_range, base_hours + check_range):
        if hours % 6 != 0:  # Check every 6 hours
            continue
            
        current_jd = jd + (hours / 24.0)
        current_phase = calculate_phase_angle(current_jd)
        
        phase_diff = abs(current_phase - initial_phase)
        if phase_diff > 180:
            phase_diff = 360 - phase_diff
            
        print(f"Checking at {hours} hours ({hours/24:.1f} days): phase diff = {phase_diff:.2f}°")
        
        if phase_diff < min_diff:
            min_diff = phase_diff
            best_match = hours
    
    if min_diff > 6.0:  # Allow up to 6 degrees difference
        print(f"Best match had too large a phase difference: {min_diff:.2f}°")
        return None, None
    
    # Round to nearest day for cleaner transitions
    best_match = round(best_match / 24) * 24
    
    # Convert hours to image numbers (images are numbered from the end of the year)
    total_images = 8761  # Total number of images in the year
    start_image = total_images - best_match
    end_image = total_images
    
    print(f"\nBest match found:")
    print(f"Days: {best_match/24:.1f}")
    print(f"Phase difference: {min_diff:.2f}°")
    
    return start_image, end_image

def main():
    # Set the ephemeris path to our local directory
    ephe_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'ephe')
    swe.set_ephe_path(ephe_path)
    
    # Starting from January 1, 2017, 00:00 UT
    start_date = datetime(2017, 1, 1, 0, 0)
    images_dir = '../../public/moon-phases'
    
    start_img, end_img = find_loop_point(start_date, images_dir)
    
    if start_img is None:
        print("Could not find a suitable loop point.")
        return
    
    print(f"Optimal loop found:")
    print(f"Start image: moon.{str(start_img).zfill(4)}.jpg")
    print(f"End image: moon.{str(end_img).zfill(4)}.jpg")
    print(f"Total images in loop: {end_img - start_img + 1}")
    print(f"Total days: {(end_img - start_img + 1) / 24:.1f}")

if __name__ == '__main__':
    main() 