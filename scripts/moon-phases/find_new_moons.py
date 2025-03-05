import swisseph as swe
import datetime

def find_new_moons(year):
    # Set ephemeris path
    swe.set_ephe_path('ephe')
    
    # Initialize search parameters
    start_date = datetime.datetime(year, 1, 1)
    last_new_moon_date = datetime.datetime(year, 12, 18)  # Last new moon of 2017
    
    # Convert to Julian Day
    start_jd = swe.julday(start_date.year, start_date.month, start_date.day)
    last_new_moon_jd = swe.julday(last_new_moon_date.year, last_new_moon_date.month, last_new_moon_date.day)
    
    # Find first new moon
    first_new_moon = swe.solcross(swe.MOON, start_jd, swe.FLG_SWIEPH)
    first_new_moon_dt = swe.revjul(first_new_moon)
    
    # Convert to image numbers (assuming images are hourly)
    first_new_moon_hour = int((first_new_moon - start_jd) * 24)
    last_new_moon_hour = int((last_new_moon_jd - start_jd) * 24)
    
    print(f"First new moon of {year}:")
    print(f"Date: {int(first_new_moon_dt[0])}-{int(first_new_moon_dt[1]):02d}-{int(first_new_moon_dt[2]):02d}")
    print(f"Julian Day: {first_new_moon:.2f}")
    print(f"Image number: {first_new_moon_hour}")
    print("\nLast new moon of {year}:")
    print(f"Date: {last_new_moon_date.year}-{last_new_moon_date.month:02d}-{last_new_moon_date.day:02d}")
    print(f"Julian Day: {last_new_moon_jd:.2f}")
    print(f"Image number: {last_new_moon_hour}")

if __name__ == "__main__":
    find_new_moons(2017) 