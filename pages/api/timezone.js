import axios from 'axios';

export default async function handler(req, res) {
  const { lat, lng, timestamp } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing required parameters: lat and lng' });
  }
  
  try {
    // Use the Google Maps Time Zone API to get the timezone offset
    const timestampSeconds = timestamp || Math.floor(Date.now() / 1000);
    
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/timezone/json`,
      {
        params: {
          location: `${lat},${lng}`,
          timestamp: timestampSeconds,
          key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        }
      }
    );
    
    const data = response.data;
    
    if (data.status === "OK") {
      // Calculate the UTC offset in hours
      const totalOffsetMinutes = (data.rawOffset + data.dstOffset) / 60;
      const hours = Math.floor(Math.abs(totalOffsetMinutes) / 60);
      const minutes = Math.abs(totalOffsetMinutes) % 60;
      
      // Format as UTC+/-HH:MM for display
      const sign = totalOffsetMinutes >= 0 ? "+" : "-";
      const formattedHours = hours.toString().padStart(2, "0");
      const formattedMinutes = minutes.toString().padStart(2, "0");
      
      const utcOffset = `UTC${sign}${formattedHours}:${formattedMinutes}`;
      
      // Format as +/-HH:MM for ISO 8601 (without the "UTC" prefix)
      const isoOffset = `${sign}${formattedHours}:${formattedMinutes}`;
      
      return res.status(200).json({ 
        utcOffset,
        isoOffset,
        timeZoneId: data.timeZoneId,
        timeZoneName: data.timeZoneName
      });
    } else {
      return res.status(400).json({ error: `Timezone API error: ${data.status}` });
    }
  } catch (error) {
    console.error('Error fetching timezone data:', error);
    return res.status(500).json({ error: 'Failed to fetch timezone data' });
  }
} 