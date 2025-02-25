import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { LoadScript, StandaloneSearchBox } from "@react-google-maps/api";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function AstrologyForm() {
  const [formData, setFormData] = useState({
    name: "",
    birthdate: "",
    birthtime: "",
    location_name: "",
    lat: "",
    lng: "",
    place_id: "",
  });

  const [errors, setErrors] = useState({});
  const [searchBox, setSearchBox] = useState(null);

  const validateForm = () => {
    let newErrors = {};

    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = "Please enter a valid name (at least 2 characters).";
    }

    if (!formData.birthdate) {
      newErrors.birthdate = "Please select a valid birthdate.";
    } else {
      const selectedDate = new Date(formData.birthdate);
      if (isNaN(selectedDate.getTime()) || selectedDate > new Date()) {
        newErrors.birthdate = "Birthdate must be a valid past date.";
      }
    }

    if (!formData.birthtime) {
      newErrors.birthtime = "Please enter a valid birth time.";
    }

    if (!formData.location_name.trim()) {
      newErrors.location_name = "Please select a location from the dropdown.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onPlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places.length > 0) {
        const place = places[0];
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setFormData({
          ...formData,
          location_name: place.formatted_address,
          lat,
          lng,
          place_id: place.place_id,
        });
        setErrors((prev) => ({ ...prev, location_name: "" })); // Clear location error
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedBirthtime = `${formData.birthtime}:00`;

    try {
        const response = await fetch("/api/prokerala", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                birthdate: formData.birthdate,
                birthtime: formattedBirthtime,
                lat: formData.lat,
                lng: formData.lng,
            }),
        });
        const data = await response.json();

        if (response.ok) {
            console.log("Prokerala Response:", data);
            alert("Astrology data fetched successfully!");
        } else {
            console.error("Error:", data.error);
            alert("Failed to fetch astrology data.");
        }
    } catch (error) {
        console.error("Request failed:", error);
    }
};

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
    <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto">
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        className="w-full p-2 border rounded mb-2 bg-white text-black placeholder-gray-500"
      />
      <input
        type="date"
        value={formData.birthdate}
        onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
        required
        className="w-full p-2 border rounded mb-2 bg-white text-black"
      />
      <input
        type="time"
        value={formData.birthtime}
        onChange={(e) => setFormData({ ...formData, birthtime: e.target.value })}
        required
        className="w-full p-2 border rounded mb-2 bg-white text-black"
      />
      <StandaloneSearchBox onLoad={setSearchBox} onPlacesChanged={onPlacesChanged}>
        <input
          type="text"
          placeholder="Birth Location"
          className="w-full p-2 border rounded mb-2 bg-white text-black placeholder-gray-500"
        />
      </StandaloneSearchBox>
      <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
        Submit
      </button>
    </form>
    </LoadScript>
  );
}
