import numpy as np
from PIL import Image, ImageDraw
import os
import math

def create_base_moon_texture(size=512):
    # Create a new image with an alpha channel
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # Draw the basic moon circle
    padding = 4  # Small padding to avoid edge artifacts
    draw.ellipse([padding, padding, size-padding, size-padding], 
                 fill=(200, 200, 200, 255))  # Light grey for moon surface
    
    # Add some texture
    pixels = np.array(image)
    noise = np.random.normal(0, 10, (size, size))
    
    # Apply noise only to the moon surface
    mask = pixels[:,:,3] > 0
    for i in range(3):  # Apply to RGB channels
        pixels[:,:,i][mask] = np.clip(pixels[:,:,i][mask] + noise[mask], 0, 255)
    
    # Convert back to image
    textured_moon = Image.fromarray(pixels.astype('uint8'))
    return textured_moon

def create_moon_phase(phase_angle, size=512):
    """
    Create a moon phase image for a given angle (0-360 degrees)
    """
    # Create or load base texture
    base = create_base_moon_texture(size)
    
    # Create a mask for the phase
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    
    # Convert phase angle to radians
    angle = math.radians(phase_angle)
    
    # Calculate the terminator curve
    center = size // 2
    radius = (size // 2) - 4  # Slightly smaller than the moon to avoid edge artifacts
    
    if 0 <= phase_angle <= 180:
        # Waxing phases (New to Full)
        illuminated_fraction = (1 - math.cos(angle)) / 2
        x = center + radius * math.cos(angle - math.pi/2)
        points = [(center, 0), (center, size)]
        if phase_angle != 90:
            for y in range(size):
                rel_y = (y - center) / radius
                if abs(rel_y) <= 1:
                    x_offset = radius * math.sqrt(1 - rel_y**2)
                    if phase_angle < 90:
                        x_pos = center + x_offset
                    else:
                        x_pos = center - x_offset
                    points.insert(-1, (x_pos, y))
    else:
        # Waning phases (Full to New)
        illuminated_fraction = (1 + math.cos(angle)) / 2
        x = center + radius * math.cos(angle - math.pi/2)
        points = [(center, 0), (center, size)]
        if phase_angle != 270:
            for y in range(size):
                rel_y = (y - center) / radius
                if abs(rel_y) <= 1:
                    x_offset = radius * math.sqrt(1 - rel_y**2)
                    if phase_angle < 270:
                        x_pos = center - x_offset
                    else:
                        x_pos = center + x_offset
                    points.insert(-1, (x_pos, y))
    
    # Draw the phase mask
    draw.polygon(points, fill=255)
    
    # Apply the mask to the base image
    result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    result.paste(base, mask=mask)
    
    return result

def generate_all_phases(output_dir):
    """
    Generate 30 moon phase images
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate phases
    for i in range(30):
        phase_angle = (i * 360) / 30
        output_path = os.path.join(output_dir, f'phase-{i}.png')
        moon_phase = create_moon_phase(phase_angle)
        moon_phase.save(output_path, 'PNG')
        print(f'Generated {output_path}')

if __name__ == '__main__':
    output_dir = '../../public/images/moon-phases'
    generate_all_phases(output_dir)
    print('Moon phase generation complete!') 