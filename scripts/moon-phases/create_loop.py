import os
import shutil
from datetime import datetime, timedelta
import swisseph as swe
from pathlib import Path

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
    
    # We'll check every hour in the last month of 2017
    # Start from December 1st, 2017
    best_match = None
    min_diff = float('inf')
    best_hours = None
    
    # Check every hour in December 2017
    for hours in range(8040, 8760):  # Last ~30 days of 2017
        current_jd = jd + (hours / 24.0)
        current_phase = calculate_phase_angle(current_jd)
        
        phase_diff = abs(current_phase - initial_phase)
        if phase_diff > 180:
            phase_diff = 360 - phase_diff
            
        if hours % 24 == 0:  # Print progress every day
            print(f"Checking at {hours} hours ({hours/24:.1f} days): phase diff = {phase_diff:.2f}°")
        
        if phase_diff < min_diff:
            min_diff = phase_diff
            best_match = hours
            
        # If we find an extremely close match (less than 0.5 degrees), we can stop
        if phase_diff < 0.5:
            break
    
    if min_diff > 3.0:  # Allow up to 3 degrees difference
        print(f"Best match had too large a phase difference: {min_diff:.2f}°")
        return None, None
    
    # Convert hours to image numbers (images are numbered from the end of the year)
    # Available images are 8661-8760
    start_image = 8760 - (8760 - 8661)  # Start from the first available image
    end_image = 8760  # End at the last available image
    
    print(f"\nBest match found:")
    print(f"Hours from start: {best_match}")
    print(f"Days from start: {best_match/24:.1f}")
    print(f"Phase difference: {min_diff:.2f}°")
    
    return start_image, end_image

def create_loop_sequence(start_img, end_img, source_dir, output_dir):
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Get the workspace directory (2 levels up from this script)
    workspace_dir = Path(__file__).parent.parent.parent
    
    # Convert paths to absolute
    source_dir = workspace_dir / source_dir
    output_dir = workspace_dir / output_dir
    
    # Initialize counter for new sequential numbering
    new_index = 1
    
    # Copy and rename images
    for i in range(start_img, end_img + 1):  # Include the end image
        # Source file path (using original numbering)
        src_file = source_dir / f"moon.{str(i).zfill(4)}.jpg"
        
        # Destination file path (using new sequential numbering)
        dst_file = output_dir / f"moon.{str(new_index).zfill(4)}.jpg"
        
        if src_file.exists():
            shutil.copy2(src_file, dst_file)
            new_index += 1
        else:
            print(f"Warning: Source file not found: {src_file}")
    
    print(f"\nLoop sequence created successfully:")
    print(f"Total images: {new_index - 1}")
    print(f"Images copied from {start_img} to {end_img}")
    print(f"Output directory: {output_dir}")

if __name__ == "__main__":
    # First new moon of 2017: image 1894
    # Last new moon of 2017: image 8424
    create_loop_sequence(
        start_img=1894,
        end_img=8424,
        source_dir="public/moon-phases",
        output_dir="public/moon-phases-loop"
    ) 