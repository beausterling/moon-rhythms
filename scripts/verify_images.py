import os
from pathlib import Path

def verify_images():
    image_dir = Path("public/moon-phases")
    expected_images = 8760  # Total hours in a year
    
    # Track file sizes
    file_sizes = {}
    missing_files = []
    suspicious_files = []
    
    print(f"Verifying moon phase images in {image_dir}...")
    
    # Check each expected image
    for hour in range(1, expected_images + 1):
        filename = f"moon.{hour:04d}.jpg"
        filepath = image_dir / filename
        
        if not filepath.exists():
            missing_files.append(hour)
            continue
            
        size = filepath.stat().st_size
        file_sizes[hour] = size
        
        # Check for significant size differences with neighboring files
        if hour > 1:
            prev_size = file_sizes.get(hour - 1)
            if prev_size and abs(size - prev_size) > 20000:  # 20KB threshold
                suspicious_files.append((hour, size, prev_size))
    
    # Report results
    print("\nVerification Results:")
    print(f"Total files expected: {expected_images}")
    print(f"Files present: {len(file_sizes)}")
    
    if missing_files:
        print("\nMissing files:")
        print(", ".join(str(h) for h in missing_files))
    
    if suspicious_files:
        print("\nSuspicious file size changes:")
        for hour, size, prev_size in suspicious_files:
            print(f"Hour {hour}: {prev_size/1024:.1f}KB -> {size/1024:.1f}KB")
    
    if not missing_files and not suspicious_files:
        print("\nAll files present and sizes appear consistent!")

if __name__ == "__main__":
    verify_images() 