 import React, { useEffect, useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { LuPencil, LuCheck, LuX, LuLogOut } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_BASE_URL || "http://localhost:5000";

const Profile = () => {
  const navigate = useNavigate();

  // ==========================================
  // USER DATA
  // ==========================================
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [yearlyGoal, setYearlyGoal] = useState(0);

  // ==========================================
  // TEMP EDIT VALUES
  // ==========================================
  const [tempName, setTempName] = useState("");
  const [tempGoal, setTempGoal] = useState("");

  // ==========================================
  // EDIT STATES
  // ==========================================
  const [editingName, setEditingName] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);

  // ==========================================
  // LOADING STATES
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ==========================================
  // FETCH PROFILE
  // ==========================================
  useEffect(() => {
    const getProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/");
          return;
        }

        const response = await axios.get(
          `${API_BASE}/api/users/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const user = response.data.user;

        setName(user.username || "");
        setEmail(user.email || "");
        setYearlyGoal(user.goal || 0);

        setTempName(user.username || "");
        setTempGoal(user.goal || "");
      } catch (error) {
        console.error(
          "Error fetching profile:",
          error.response?.data || error
        );

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [navigate]);

  // ==========================================
  // LOGOUT
  // ==========================================
  const handleLogout = () => {
    setLoggingOut(true);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  // ==========================================
  // START EDIT NAME
  // ==========================================
  const startEditingName = () => {
    setTempName(name);
    setEditingName(true);
  };

  // ==========================================
  // CANCEL NAME EDIT
  // ==========================================
  const cancelNameEdit = () => {
    setTempName(name);
    setEditingName(false);
  };

  // ==========================================
  // SAVE NAME
  // ==========================================
  const saveName = async () => {
    if (!tempName.trim()) {
      alert("Name cannot be empty.");
      return;
    }

    try {
      setSavingName(true);

      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${API_BASE}/api/users/profile`,
        {
          username: tempName.trim(),
          goal: yearlyGoal,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedUser = response.data.user;

      setName(updatedUser.username);
      setEmail(updatedUser.email || email);
      setYearlyGoal(updatedUser.goal);

      setTempName(updatedUser.username);
      setEditingName(false);

      // Keep localStorage user data in sync
      const oldUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...oldUser,
          username: updatedUser.username,
          email: updatedUser.email,
          goal: updatedUser.goal,
        })
      );
    } catch (error) {
      console.error(
        "Error updating username:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update name."
      );
    } finally {
      setSavingName(false);
    }
  };

  // ==========================================
  // START EDIT GOAL
  // ==========================================
  const startEditingGoal = () => {
    setTempGoal(yearlyGoal);
    setEditingGoal(true);
  };

  // ==========================================
  // CANCEL GOAL EDIT
  // ==========================================
  const cancelGoalEdit = () => {
    setTempGoal(yearlyGoal);
    setEditingGoal(false);
  };

  // ==========================================
  // SAVE GOAL
  // ==========================================
  const saveGoal = async () => {
    const numericGoal = Number(tempGoal);

    if (
      !numericGoal ||
      numericGoal < 1 ||
      !Number.isInteger(numericGoal)
    ) {
      alert("Please enter a valid number of books.");
      return;
    }

    try {
      setSavingGoal(true);

      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${API_BASE}/api/users/profile`,
        {
          username: name,
          goal: numericGoal,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedUser = response.data.user;

      setName(updatedUser.username);
      setEmail(updatedUser.email || email);
      setYearlyGoal(updatedUser.goal);

      setTempGoal(updatedUser.goal);
      setEditingGoal(false);

      // Keep localStorage user data in sync
      const oldUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...oldUser,
          username: updatedUser.username,
          email: updatedUser.email,
          goal: updatedUser.goal,
        })
      );
    } catch (error) {
      console.error(
        "Error updating goal:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update yearly goal."
      );
    } finally {
      setSavingGoal(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-text-secondary">
          Loading profile...
        </div>
      </section>
    );
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <section className="min-h-screen bg-background px-4 py-5 sm:px-7 sm:py-7">
      {/* HEADER */}
      <div
        onClick={() => navigate(-1)}
        className="flex w-fit cursor-pointer items-center gap-2.5 text-[clamp(17px,2vw,24px)] font-semibold text-text-primary"
      >
        <IoChevronBack size={24} />
        <span>Profile</span>
      </div>

      {/* PROFILE CONTENT */}
      <div className="mx-auto mt-8 w-full max-w-3xl sm:mt-10">

        {/* PROFILE PHOTO */}
        <div className="flex justify-center">
          <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-border-light sm:h-28 sm:w-28">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* PROFILE DETAILS */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-border-light bg-background-card sm:mt-10">

          {/* NAME */}
          <div className="flex items-center justify-between border-b border-border-light px-4 py-4 sm:px-5 sm:py-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-secondary">
                Name
              </p>

              {editingName ? (
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) =>
                    setTempName(e.target.value)
                  }
                  className="mt-1 w-full border-b border-brand bg-transparent pb-1 text-sm font-medium text-text-primary outline-none"
                  autoFocus
                />
              ) : (
                <p className="mt-1 truncate text-sm font-medium text-text-primary">
                  {name || "Not set"}
                </p>
              )}
            </div>

            <div className="ml-4 flex shrink-0 items-center gap-1">
              {editingName && (
                <button
                  type="button"
                  onClick={cancelNameEdit}
                  disabled={savingName}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Cancel"
                >
                  <LuX size={17} />
                </button>
              )}

              <button
                type="button"
                onClick={
                  editingName
                    ? saveName
                    : startEditingName
                }
                disabled={savingName}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-background hover:text-text-primary disabled:opacity-50"
                title={
                  editingName ? "Save" : "Edit name"
                }
              >
                {savingName ? (
                  <span className="text-xs">...</span>
                ) : editingName ? (
                  <LuCheck size={17} />
                ) : (
                  <LuPencil size={17} />
                )}
              </button>
            </div>
          </div>

          {/* EMAIL */}
          <div className="border-b border-border-light px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-xs font-medium text-text-secondary">
              Email
            </p>

            <p className="mt-1 break-all text-sm font-medium text-text-primary">
              {email || "Not available"}
            </p>
          </div>

          {/* YEARLY GOAL */}
          <div className="flex items-center justify-between px-4 py-4 sm:px-5 sm:py-5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-secondary">
                Yearly Goal
              </p>

              {editingGoal ? (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={tempGoal}
                    onChange={(e) =>
                      setTempGoal(e.target.value)
                    }
                    className="w-20 border-b border-brand bg-transparent pb-1 text-sm font-medium text-text-primary outline-none sm:w-24"
                    autoFocus
                  />

                  <span className="text-sm text-text-secondary">
                    Books
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-sm font-medium text-text-primary">
                  {yearlyGoal}{" "}
                  {yearlyGoal === 1 ? "Book" : "Books"}
                </p>
              )}
            </div>

            <div className="ml-4 flex shrink-0 items-center gap-1">
              {editingGoal && (
                <button
                  type="button"
                  onClick={cancelGoalEdit}
                  disabled={savingGoal}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Cancel"
                >
                  <LuX size={17} />
                </button>
              )}

              <button
                type="button"
                onClick={
                  editingGoal
                    ? saveGoal
                    : startEditingGoal
                }
                disabled={savingGoal}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-background hover:text-text-primary disabled:opacity-50"
                title={
                  editingGoal ? "Save" : "Edit goal"
                }
              >
                {savingGoal ? (
                  <span className="text-xs">...</span>
                ) : editingGoal ? (
                  <LuCheck size={17} />
                ) : (
                  <LuPencil size={17} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* LOGOUT */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-medium text-red-500 transition-all duration-200 hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LuLogOut size={17} />
          {loggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </section>
  );
};

export default Profile;



