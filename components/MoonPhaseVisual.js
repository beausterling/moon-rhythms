import { Box, Image } from '@chakra-ui/react';

export default function MoonPhaseVisual({ phaseAngle }) {
  // Convert phase angle to image index (0-29)
  const getPhaseIndex = (angle) => {
    // Normalize angle to 0-360
    const normalizedAngle = angle % 360;
    // Convert to 0-29 range
    return Math.round((normalizedAngle / 360) * 29);
  };

  const phaseIndex = getPhaseIndex(phaseAngle);

  return (
    <Box
      width="200px"
      height="200px"
      position="relative"
      margin="0 auto"
    >
      <Image
        src={`/images/moon-phases/phase-${phaseIndex}.png`}
        alt={`Moon phase ${phaseAngle.toFixed(1)}°`}
        width="100%"
        height="100%"
        objectFit="contain"
        loading="eager"
      />
    </Box>
  );
} 