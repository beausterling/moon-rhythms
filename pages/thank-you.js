import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/router";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ThankYouPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    // Check if we have a user email in session storage
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
    }
  }, []);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;

    const { error } = await supabase.from("feedback").insert([{ message: feedback }]);

    if (error) {
      console.error("Error submitting feedback:", error);
    } else {
      setSubmitted(true);
    }
  };

  const viewChart = () => {
    if (userEmail) {
      router.push(`/chart?email=${encodeURIComponent(userEmail)}`);
    } else {
      // If no email, just go to chart page without query param
      router.push("/chart");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Thank you!</h1>
      <p className="text-lg mb-6">Welcome to MoonRhythms.io</p>

      {!submitted ? (
        <>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Offer Feedback (optional)"
            className="w-full max-w-lg mx-auto p-2 border border-gray-300 rounded bg-white text-black placeholder-gray-400 mb-4"
          />
          <button onClick={handleSubmit} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition">
            Submit Feedback
          </button>
        </>
      ) : (
        <p className="mt-4 text-green-600 mb-6">Thanks for your feedback! 😊</p>
      )}

      <div className="mt-8 flex flex-col items-center w-full">
        <button 
          onClick={viewChart} 
          className="bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 transition shadow-md"
        >
          View Your Birth Chart
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Click to see your personalized astrological birth chart
        </p>
      </div>
    </div>
  );
}
