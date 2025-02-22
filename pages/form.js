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
    place_id: ""
  });
  const [searchBox, setSearchBox] = useState(null);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    let newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.birthdate) newErrors.birthdate = "Birthdate is required.";
    if (!formData.birthtime) {
      newErrors.birthtime = "Birthtime is required.";
    } else if (!/^\d{2}:\d{2}$/.test(formData.birthtime)) {
      newErrors.birthtime = "Invalid time format (HH:MM required).";
    }
    if (!formData.location_name) newErrors.location_name = "Birth location is required.";

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
          place_id: place.place_id 
        });
        setErrors((prev) => ({ ...prev, location_name: "" })); // Clear location error
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const formattedBirthtime = `${formData.birthtime}:00`;

    const submissionData = {
      ...formData,
      birthtime: formattedBirthtime, 
    };

    const { data, error } = await supabase.from("users").insert([submissionData]);

    if (error) {
      console.error("Error saving data:", error);
      alert("Something went wrong. Please try again.");
    } else {
      window.location.href = "/thank-you";
    }
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto">
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            setErrors((prev) => ({ ...prev, name: "" })); 
          }}
          required
          className={`w-full p-2 border rounded mb-2 ${errors.name ? "border-red-500" : ""}`}
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

        <input
          type="date"
          value={formData.birthdate}
          onChange={(e) => {
            setFormData({ ...formData, birthdate: e.target.value });
            setErrors((prev) => ({ ...prev, birthdate: "" }));
          }}
          required
          className={`w-full p-2 border rounded mb-2 ${errors.birthdate ? "border-red-500" : ""}`}
        />
        {errors.birthdate && <p className="text-red-500 text-sm">{errors.birthdate}</p>}

        <input
          type="time"
          value={formData.birthtime}
          onChange={(e) => {
            setFormData({ ...formData, birthtime: e.target.value });
            setErrors((prev) => ({ ...prev, birthtime: "" }));
          }}
          required
          className={`w-full p-2 border rounded mb-2 ${errors.birthtime ? "border-red-500" : ""}`}
        />
        {errors.birthtime && <p className="text-red-500 text-sm">{errors.birthtime}</p>}

        <StandaloneSearchBox onLoad={setSearchBox} onPlacesChanged={onPlacesChanged}>
          <input
            type="text"
            placeholder="Birth Location"
            className={`w-full p-2 border rounded mb-2 ${errors.location_name ? "border-red-500" : ""}`}
          />
        </StandaloneSearchBox>
        {errors.location_name && <p className="text-red-500 text-sm">{errors.location_name}</p>}

        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Submit</button>
      </form>
    </LoadScript>
  );
}
