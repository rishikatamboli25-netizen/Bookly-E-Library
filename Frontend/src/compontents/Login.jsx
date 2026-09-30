import axios from "axios";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const API_BASE =
  import.meta.env.VITE_BASE_URL || "http://localhost:5000";

const Login = ({ login }) => {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // email -> decide whether login or registration
  // login -> existing user password
  // register -> new user username + password
  const [step, setStep] = useState("email");

  const [showGoalPopup, setShowGoalPopup] = useState(false);
  const [yearlyGoal, setYearlyGoal] = useState(12);

  const email = watch("email");

  // =========================
  // CHECK EMAIL
  // =========================
  const handleEmailContinue = async (data) => {
    try {
      clearErrors("root");

      const normalizedEmail = data.email.trim().toLowerCase();

      const response = await axios.post(
        `${API_BASE}/api/auth/check-email`,
        {
          email: normalizedEmail,
        }
      );

      if (response.data.exists) {
        setStep("login");
      } else {
        setStep("register");
      }
    } catch (error) {
      console.error("Email check error:", error);

      setError("root", {
        type: "server",
        message:
          error.response?.data?.message ||
          "Unable to check email. Please try again.",
      });
    }
  };

  // =========================
  // REGISTER
  // =========================
  const handleRegister = async (data) => {
    try {
      clearErrors("root");

      const response = await axios.post(
        `${API_BASE}/api/auth/register`,
        {
          username: data.username,
          email: data.email.trim().toLowerCase(),
          password: data.password,
        }
      );

      localStorage.setItem("token", response.data.token);

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      // Registration complete
      setShowGoalPopup(true);
    } catch (error) {
      console.error("Registration error:", error);

      setError("root", {
        type: "server",
        message:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
      });
    }
  };

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async (data) => {
    try {
      clearErrors("root");

      const response = await axios.post(
        `${API_BASE}/api/auth/login`,
        {
          email: data.email.trim().toLowerCase(),
          password: data.password,
        }
      );

      localStorage.setItem("token", response.data.token);

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      // Login complete
      login(false);
    } catch (error) {
      console.error("Login error:", error);

      setError("root", {
        type: "server",
        message:
          error.response?.data?.message ||
          "Login failed. Please try again.",
      });
    }
  };

  // =========================
  // STEP SUBMIT
  // =========================
  const onSubmit = async (data) => {
    if (step === "email") {
      await handleEmailContinue(data);
      return;
    }

    if (step === "login") {
      await handleLogin(data);
      return;
    }

    if (step === "register") {
      await handleRegister(data);
    }
  };

  // =========================
  // BACK TO EMAIL
  // =========================
  const handleBack = () => {
    clearErrors();
    setStep("email");

    reset({
      email,
    });
  };

  // =========================
  // SKIP YEARLY GOAL
  // =========================
  const handleSkipGoal = () => {
    setShowGoalPopup(false);
    login(false);
  };

  // =========================
  // SET YEARLY GOAL
  // =========================
  const handleSetGoal = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("Authentication token not found");
        return;
      }

      const response = await axios.put(
        `${API_BASE}/api/users/goal`,
        {
          goal: yearlyGoal,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

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
      {/* =========================
          AUTH MODAL
      ========================= */}
      {!showGoalPopup && (
        <div className="fixed inset-0 z-40 flex min-h-screen w-full items-center justify-center bg-black/20 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-brand p-5 sm:p-7 text-text-white shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
            {/* Header */}
            <div className="mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-semibold">
                {step === "email" && "Welcome to Bookly"}
                {step === "login" && "Welcome back"}
                {step === "register" && "Create your account"}
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-white/70">
                {step === "email" &&
                  "Enter your email to continue"}

                {step === "login" &&
                  "Enter your password to access your library"}

                {step === "register" &&
                  "Complete your registration to get started"}
              </p>
            </div>

            {/* =========================
                FORM
            ========================= */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-4">

                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={step !== "email"}
                    className="w-full rounded-xl bg-white p-3 text-sm text-black outline-none disabled:cursor-not-allowed disabled:opacity-70"
                    {...register("email", {
                      required: {
                        value: true,
                        message: "Email is required",
                      },
                      pattern: {
                        value:
                          /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message:
                          "Please enter a valid email address",
                      },
                    })}
                  />

                  {errors.email && (
                    <p className="mt-1 text-xs text-red-300">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* LOGIN PASSWORD */}
                {step === "login" && (
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-sm"
                    >
                      Password
                    </label>

                    <input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full rounded-xl bg-white p-3 text-sm text-black outline-none"
                      {...register("password", {
                        required: {
                          value: true,
                          message: "Password is required",
                        },
                      })}
                    />

                    {errors.password && (
                      <p className="mt-1 text-xs text-red-300">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                )}

                {/* REGISTER USERNAME */}
                {step === "register" && (
                  <>
                    <div>
                      <label
                        htmlFor="username"
                        className="mb-1.5 block text-sm"
                      >
                        Name
                      </label>

                      <input
                        id="username"
                        type="text"
                        placeholder="Enter your name"
                        autoComplete="name"
                        className="w-full rounded-xl bg-white p-3 text-sm text-black outline-none"
                        {...register("username", {
                          required: {
                            value: true,
                            message: "Username is required",
                          },
                          minLength: {
                            value: 3,
                            message:
                              "Username must be at least 3 characters",
                          },
                          maxLength: {
                            value: 20,
                            message:
                              "Username must be less than 20 characters",
                          },
                          pattern: {
                            value: /^[a-zA-Z0-9_]+$/,
                            message:
                              "Username can only contain letters, numbers and underscore",
                          },
                        })}
                      />

                      {errors.username && (
                        <p className="mt-1 text-xs text-red-300">
                          {errors.username.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="mb-1.5 block text-sm"
                      >
                        Password
                      </label>

                      <input
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        autoComplete="new-password"
                        className="w-full rounded-xl bg-white p-3 text-sm text-black outline-none"
                        {...register("password", {
                          required: {
                            value: true,
                            message: "Password is required",
                          },
                          minLength: {
                            value: 8,
                            message:
                              "Password must be at least 8 characters",
                          },
                        })}
                      />

                      {errors.password && (
                        <p className="mt-1 text-xs text-red-300">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="mb-1.5 block text-sm"
                      >
                        Confirm Password
                      </label>

                      <input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        className="w-full rounded-xl bg-white p-3 text-sm text-black outline-none"
                        {...register("confirmPassword", {
                          required: {
                            value: true,
                            message:
                              "Please confirm your password",
                          },
                          validate: (value) =>
                            value === watch("password") ||
                            "Passwords do not match",
                        })}
                      />

                      {errors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-300">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* SERVER ERROR */}
                {errors.root && (
                  <div className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs text-red-300">
                    {errors.root.message}
                  </div>
                )}

                {/* =========================
                    ACTIONS
                ========================= */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 h-12 w-full rounded-xl bg-white font-semibold text-brand transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Please wait..."
                    : step === "email"
                    ? "Continue"
                    : step === "login"
                    ? "Login"
                    : "Create Account"}
                </button>

                {/* BACK */}
                {step !== "email" && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-xs text-white/70 transition-colors hover:text-white"
                  >
                    ← Use a different email
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================
          YEARLY GOAL POPUP
      ========================= */}
      {showGoalPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border-light bg-background-card p-6 sm:p-7 shadow-2xl">

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

              {/* Numbers */}
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
                <div className="h-5 shrink-0" />

                {Array.from(
                  { length: 50 },
                  (_, index) => index + 1
                ).map((number) => (
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
                ))}

                <div className="h-5 shrink-0" />
              </div>
            </div>

            {/* Selected Goal */}
            <p className="mt-3 text-center text-xs text-text-secondary">
              {yearlyGoal}{" "}
              {yearlyGoal === 1 ? "book" : "books"} per year
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