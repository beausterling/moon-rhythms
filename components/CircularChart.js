import React, { useEffect, useRef } from 'react';
import { Box } from '@chakra-ui/react';

// Planet symbols
const planetSymbols = {
  'Sun': '☉',
  'Moon': '☽',
  'Mercury': '☿',
  'Venus': '♀',
  'Mars': '♂',
  'Jupiter': '♃',
  'Saturn': '♄',
  'Uranus': '♅',
  'Neptune': '♆',
  'Pluto': '♇'
};

// Zodiac symbols and colors
const zodiacData = {
  'Aries': { symbol: '♈', color: '#FF5733' },
  'Taurus': { symbol: '♉', color: '#8BC34A' },
  'Gemini': { symbol: '♊', color: '#FFEB3B' },
  'Cancer': { symbol: '♋', color: '#03A9F4' },
  'Leo': { symbol: '♌', color: '#FF9800' },
  'Virgo': { symbol: '♍', color: '#795548' },
  'Libra': { symbol: '♎', color: '#9C27B0' },
  'Scorpio': { symbol: '♏', color: '#F44336' },
  'Sagittarius': { symbol: '♐', color: '#673AB7' },
  'Capricorn': { symbol: '♑', color: '#607D8B' },
  'Aquarius': { symbol: '♒', color: '#00BCD4' },
  'Pisces': { symbol: '♓', color: '#4CAF50' }
};

const CircularChart = ({ chartData }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!chartData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw chart background
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw zodiac wheel
    drawZodiacWheel(ctx, centerX, centerY, radius);
    
    // Draw houses
    drawHouses(ctx, centerX, centerY, radius, chartData.houses);
    
    // Draw planets
    drawPlanets(ctx, centerX, centerY, radius, chartData.planets);
    
    // Draw aspects
    drawAspects(ctx, centerX, centerY, radius, chartData.planets, chartData.aspects);
    
  }, [chartData]);
  
  // Function to draw the zodiac wheel
  const drawZodiacWheel = (ctx, centerX, centerY, radius) => {
    const zodiacSigns = Object.keys(zodiacData);
    const segmentAngle = (2 * Math.PI) / 12;
    
    zodiacSigns.forEach((sign, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = (index + 1) * segmentAngle;
      
      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      // Fill with light color
      ctx.fillStyle = `${zodiacData[sign].color}33`; // 20% opacity
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw zodiac symbol
      const symbolAngle = startAngle + segmentAngle / 2;
      const symbolX = centerX + (radius - 20) * Math.cos(symbolAngle);
      const symbolY = centerY + (radius - 20) * Math.sin(symbolAngle);
      
      ctx.font = '16px Arial';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(zodiacData[sign].symbol, symbolX, symbolY);
    });
  };
  
  // Function to draw houses
  const drawHouses = (ctx, centerX, centerY, radius, houses) => {
    if (!houses || houses.length === 0) return;
    
    const innerRadius = radius * 0.7;
    
    houses.forEach((house) => {
      // Calculate position based on house number
      const angle = ((house.number - 1) * 30) * (Math.PI / 180);
      
      // Draw house line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      );
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw house number
      const numberX = centerX + innerRadius * 0.5 * Math.cos(angle);
      const numberY = centerY + innerRadius * 0.5 * Math.sin(angle);
      
      ctx.font = '12px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(house.number.toString(), numberX, numberY);
    });
  };
  
  // Function to draw planets
  const drawPlanets = (ctx, centerX, centerY, radius, planets) => {
    if (!planets || planets.length === 0) return;
    
    planets.forEach((planet) => {
      // Calculate position based on longitude
      const angle = planet.longitude * (Math.PI / 180);
      
      // Calculate distance from center based on house (simplified)
      const distance = radius * (0.4 + (parseInt(planet.house) % 3) * 0.1);
      
      const planetX = centerX + distance * Math.cos(angle);
      const planetY = centerY + distance * Math.sin(angle);
      
      // Draw planet symbol
      ctx.font = '16px Arial';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(planetSymbols[planet.name], planetX, planetY);
      
      // Draw small circle around planet
      ctx.beginPath();
      ctx.arc(planetX, planetY, 12, 0, 2 * Math.PI);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  };
  
  // Function to draw aspects
  const drawAspects = (ctx, centerX, centerY, radius, planets, aspects) => {
    if (!aspects || aspects.length === 0 || !planets || planets.length === 0) return;
    
    // Create a map of planet names to their positions
    const planetPositions = {};
    planets.forEach((planet) => {
      const angle = planet.longitude * (Math.PI / 180);
      const distance = radius * (0.4 + (parseInt(planet.house) % 3) * 0.1);
      
      planetPositions[planet.name] = {
        x: centerX + distance * Math.cos(angle),
        y: centerY + distance * Math.sin(angle)
      };
    });
    
    // Draw lines for aspects
    aspects.forEach((aspect) => {
      const planet1Pos = planetPositions[aspect.planet1];
      const planet2Pos = planetPositions[aspect.planet2];
      
      if (planet1Pos && planet2Pos) {
        ctx.beginPath();
        ctx.moveTo(planet1Pos.x, planet1Pos.y);
        ctx.lineTo(planet2Pos.x, planet2Pos.y);
        
        // Set line style based on aspect type
        switch (aspect.type) {
          case 'Conjunction':
            ctx.strokeStyle = '#FF0000';
            break;
          case 'Opposition':
            ctx.strokeStyle = '#FF6600';
            break;
          case 'Trine':
            ctx.strokeStyle = '#00CC00';
            break;
          case 'Square':
            ctx.strokeStyle = '#9900CC';
            break;
          case 'Sextile':
            ctx.strokeStyle = '#0066FF';
            break;
          default:
            ctx.strokeStyle = '#999999';
        }
        
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]); // Dashed line
        ctx.stroke();
        ctx.setLineDash([]); // Reset to solid line
      }
    });
  };
  
  return (
    <Box 
      width="100%" 
      height="100%" 
      display="flex" 
      justifyContent="center" 
      alignItems="center"
      p={4}
    >
      <canvas 
        ref={canvasRef} 
        width={500} 
        height={500} 
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </Box>
  );
};

export default CircularChart; 