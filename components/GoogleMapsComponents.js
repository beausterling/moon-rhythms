import React, { useState, useEffect } from 'react';
import { LoadScript, StandaloneSearchBox } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function GoogleMapsComponents({ children, onPlacesChanged, setSearchBox }) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    console.log("GoogleMapsComponents mounted");
    return () => console.log("GoogleMapsComponents unmounted");
  }, []);

  // Function to recursively find and wrap the location input
  const findAndWrapLocationInput = (child) => {
    // Base case: not a valid React element
    if (!React.isValidElement(child)) {
      return child;
    }

    // Check if this is the location input directly
    if (
      child.type === 'input' || 
      (child.props && child.props.placeholder === "Search for your birth location")
    ) {
      console.log("Found location input:", child);
      return (
        <StandaloneSearchBox 
          onLoad={(ref) => {
            console.log("SearchBox loaded");
            setSearchBox(ref);
          }} 
          onPlacesChanged={() => {
            console.log("Places changed");
            onPlacesChanged();
          }}
        >
          {child}
        </StandaloneSearchBox>
      );
    }

    // If it has children, recursively process them
    if (child.props && child.props.children) {
      const newChildren = React.Children.map(
        child.props.children, 
        childElement => findAndWrapLocationInput(childElement)
      );
      
      // Return a clone with the processed children
      return React.cloneElement(child, { ...child.props }, newChildren);
    }

    // No match, return as is
    return child;
  };

  // Process the form to find and wrap the location input
  const processedChildren = React.Children.map(children, child => {
    return findAndWrapLocationInput(child);
  });

  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={["places"]}
      onLoad={() => {
        console.log("Google Maps API loaded");
        setIsLoaded(true);
      }}
      onError={(error) => {
        console.error("Google Maps API error:", error);
      }}
    >
      {processedChildren}
    </LoadScript>
  );
} 