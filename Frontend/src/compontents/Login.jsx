import axios from "axios";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const Login = ({ login }) => {
const {
register,
handleSubmit,
setError,
watch,
clearErrors,
formState: { errors, isSubmitting },
} = useForm();

const [showGoalPopup, setShowGoalPopup] = useState(false);
const [yearlyGoal, setYearlyGoal] = useState(12);

const email = watch("email");

// Check if email already exists
useEffect(() => {
if (!email) {
clearErrors("email");
return;
}

console.log("Change Detected, Checking Email");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) return;

const timer = setTimeout(async () => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/auth/check-email",
      { email }
    );

    if (response.data.exists) {
      setError("email", {
        type: "manual",
        message: "Email already registered",
      });
    } else {
      clearErrors("email");
    }
  } catch (error) {
    console.error("Email check error:", error);
  }
}, 500);

return () => clearTimeout(timer);


}, [email, setError, clearErrors]);

// Register User
const onSubmit = async (data) => {
try {
const response = await axios.post(
"http://localhost:5000/api/auth/register",
data
);


  console.log(response.data);

  // Save authentication data
  localStorage.setItem("token", response.data.token);
  localStorage.setItem(
    "user",
    JSON.stringify(response.data.user)
  );

  // Show yearly goal popup
  setShowGoalPopup(true);
} catch (err) {
  console.error("There is Some Error:", err);
}


};



// Skip Yearly Goal
const handleSkipGoal = () => {
setShowGoalPopup(false);


// Close login/register popup
login(false);
};


const handleSetGoal = async () => {
  console.log("Setting your goal...");

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Authentication token not found");
      return;
    }


    const response = await axios.put(
      "http://localhost:5000/api/users/goal",
      {
        goal: yearlyGoal,
      },
      {
        headers : {
          Authorization : `Bearer ${token}`,
        },
      }
    );

    console.log("Goal updated:", response.data);

    // Update localStorage with updated user
    localStorage.setItem(
      "user",
      JSON.stringify(response.data.user)
    );

    console.log("Request successful");

    setShowGoalPopup(false);

    login(false);

  } catch (error) {
    console.error(
      "Error updating goal:",
      error.response?.data || error.message
    );
  }
};





return (
<>
{/* Registration Modal */} <div className="absolute inset-0 z-40 h-screen w-full backdrop-blur-sm"> <div className="absolute left-1/2 top-1/2 h-fit w-[30vw] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-brand px-4 pb-4 text-text-white shadow-[0_20px_40px_rgba(0,0,0,0.8)] shadow-white"> <div className="justify-self-center p-4 text-[1.5rem] font-semibold">
Let's get you registered </div>


      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-3">
          {/* Email */}
          <div className="mt-3">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              className="w-full rounded-lg p-2 py-3 text-black outline-brand focus:outline-2"
              type="text"
              placeholder="Enter your mail"
              {...register("email", {
                required: {
                  value: true,
                  message: "Email is required",
                },

                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address",
                },
              })}
            />

            {errors.email && (
              <div className="text-sm font-thin text-red-400">
                {errors.email.message}
              </div>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username">Name</label>

            <input
              id="username"
              className="w-full rounded-lg p-2 py-3 text-black outline-brand focus:outline-2"
              type="text"
              placeholder="Enter your name"
              {...register("username", {
                required: {
                  value: true,
                  message: "username is required",
                },

                minLength: {
                  value: 3,
                  message: "Username must be at least 3 characters",
                },

                maxLength: {
                  value: 20,
                  message: "Username must be less than 20 characters",
                },

                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message:
                    "Username can only contain letters, numbers and underscore",
                },
              })}
            />

            {errors.username && (
              <div className="text-sm font-thin text-red-400">
                {errors.username.message}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            disabled={isSubmitting}
            type="submit"
            className="mt-3 flex h-[6vh] w-full items-center justify-center rounded-lg bg-white font-semibold text-brand"
          >
            {isSubmitting ? "Loading" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  </div>


  {/* Yearly Goal Popup */}
{showGoalPopup && (

  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm">
    <div className="w-full max-w-sm rounded-2xl border border-border-light bg-background-card p-7 shadow-2xl">
      {/* Heading */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-text-primary">
          Set your yearly goal
        </h2>


    <p className="mt-2 text-sm text-text-secondary">
      How many books do you want to read this year?
    </p>
  </div>

  {/* Goal Picker */}
  <div className="relative mx-auto mt-7 h-20 w-32 overflow-hidden">
    {/* Top Fade */}
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-background-card to-transparent" />

    {/* Bottom Fade */}
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-background-card to-transparent" />

    {/* Scrollable Numbers */}
    <div
      className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      onScroll={(e) => {
        const container = e.currentTarget;
        const itemHeight = 40;

        const index = Math.round(
          container.scrollTop / itemHeight
        );

        const selectedNumber = Math.min(
          Math.max(index + 1, 1),
          50
        );

        setYearlyGoal(selectedNumber);
      }}
    >
      {/* Top Spacer */}
      <div className="h-5 shrink-0" />

      {Array.from({ length: 50 }, (_, index) => index + 1).map(
        (number) => (
          <div
            key={number}
            className={`flex h-10 snap-center items-center justify-center text-lg font-semibold transition-all ${
              yearlyGoal === number
                ? "scale-110 text-text-primary"
                : "text-text-secondary/40"
            }`}
          >
            {number}
          </div>
        )
      )}

      {/* Bottom Spacer */}
      <div className="h-5 shrink-0" />
    </div>
  </div>

  {/* Selected Goal */}
  <p className="mt-3 text-center text-xs text-text-secondary">
    {yearlyGoal} {yearlyGoal === 1 ? "book" : "books"} per year
  </p>

  {/* Actions */}
  <div className="mt-6 flex justify-center gap-3">
    <button
      type="button"
      onClick={handleSkipGoal}
      className="rounded-lg border border-border-light px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-background"
    >
      Skip
    </button>

    <button
      type="button"
      onClick={handleSetGoal}
      className="rounded-lg bg-brand px-5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
    >
      Set
    </button>
  </div>
</div>


  </div>
)}
</>


);
};

export default Login;
