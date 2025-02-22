import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ThankYouPage() {
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;

    const { error } = await supabase.from("feedback").insert([{ message: feedback }]);

    if (error) {
      console.error("Error submitting feedback:", error);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Thank you!</h1>
      <p className="text-lg">Welcome to MoonRhythms.io</p>

      {!submitted ? (
        <>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Offer Feedback (optional)"
            className="w-full max-w-lg mx-auto p-2 border border-gray-300 rounded bg-white text-black placeholder-gray-400"
          />
          <button onClick={handleSubmit} className="mt-4 bg-blue-500 text-white p-2 rounded">
            Submit Feedback
          </button>
        </>
      ) : (
        <p className="mt-4 text-green-600">Thanks for your feedback! 😊</p>
      )}
    </div>
  );
}
