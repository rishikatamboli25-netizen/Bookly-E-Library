import React, { useEffect, useState } from "react";
import { IoChevronBack } from "react-icons/io5";
import { LuPencil, LuCheck, LuX } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Vite environment variable with localhost fallback
const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

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

        console.log("Fetching user profile...");

        const response = await axios.get(
          `${API_BASE}/api/users/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log(
          "Profile fetched successfully:",
          response.data
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
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [navigate]);


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

      console.log("Updating username:", tempName);

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

      console.log(
        "Username updated successfully:",
        response.data
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

      console.log("Updating yearly goal:", numericGoal);

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

      console.log(
        "Goal updated successfully:",
        response.data
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
      <section className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary">
          Loading profile...
        </div>
      </section>
    );
  }


  // ==========================================
  // UI
  // ==========================================
  return (
    <section className="min-h-screen bg-background px-7 py-7">

      {/* ==========================================
          HEADER
      ========================================== */}
      <div
        onClick={() => navigate(-1)}
        className="
          flex
          w-fit
          cursor-pointer
          items-center
          gap-3
          text-[clamp(17px,2vw,24px)]
          font-semibold
          text-text-primary
        "
      >
        <IoChevronBack size={24} />

        <span>Profile</span>
      </div>


      {/* ==========================================
          PROFILE CONTENT
      ========================================== */}
      <div className="mx-auto mt-10 w-full max-w-3xl">


        {/* ==========================================
            PROFILE PHOTO
        ========================================== */}
        <div className="flex justify-center">

          <div
            className="
              h-28
              w-28
              overflow-hidden
              rounded-full
              border-2
              border-border-light
            "
          >
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>

        </div>


        {/* ==========================================
            PROFILE DETAILS
        ========================================== */}
        <div
          className="
            mt-10
            overflow-hidden
            rounded-2xl
            border
            border-border-light
            bg-background-card
          "
        >


          {/* ==========================================
              NAME
          ========================================== */}
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-border-light
              px-5
              py-5
            "
          >

            <div className="flex-1">

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
                  className="
                    mt-1
                    w-full
                    bg-transparent
                    text-sm
                    font-medium
                    text-text-primary
                    outline-none
                    border-b
                    border-brand
                    pb-1
                  "
                  autoFocus
                />

              ) : (

                <p className="mt-1 text-sm font-medium text-text-primary">
                  {name || "Not set"}
                </p>

              )}

            </div>


            {/* NAME ACTIONS */}
            <div className="flex items-center gap-2 ml-4">

              {editingName && (
                <button
                  onClick={cancelNameEdit}
                  disabled={savingName}
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-full
                    text-text-secondary
                    hover:bg-red-50
                    hover:text-red-500
                    transition-colors
                  "
                  title="Cancel"
                >
                  <LuX size={17} />
                </button>
              )}


              <button
                onClick={
                  editingName
                    ? saveName
                    : startEditingName
                }
                disabled={savingName}
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  text-text-secondary
                  transition-colors
                  hover:bg-background
                  hover:text-text-primary
                  disabled:opacity-50
                "
                title={
                  editingName
                    ? "Save"
                    : "Edit name"
                }
              >

                {savingName ? (
                  <span className="text-xs">
                    ...
                  </span>
                ) : editingName ? (
                  <LuCheck size={17} />
                ) : (
                  <LuPencil size={17} />
                )}

              </button>

            </div>

          </div>


          {/* ==========================================
              EMAIL
          ========================================== */}
          <div
            className="
              border-b
              border-border-light
              px-5
              py-5
            "
          >

            <p className="text-xs font-medium text-text-secondary">
              Email
            </p>

            <p className="mt-1 text-sm font-medium text-text-primary">
              {email || "Not available"}
            </p>

          </div>


          {/* ==========================================
              YEARLY GOAL
          ========================================== */}
          <div
            className="
              flex
              items-center
              justify-between
              px-5
              py-5
            "
          >

            <div>

              <p className="text-xs font-medium text-text-secondary">
                Yearly Goal
              </p>


              {editingGoal ? (

                <div className="flex items-center gap-2 mt-1">

                  <input
                    type="number"
                    min="1"
                    value={tempGoal}
                    onChange={(e) =>
                      setTempGoal(e.target.value)
                    }
                    className="
                      w-24
                      bg-transparent
                      text-sm
                      font-medium
                      text-text-primary
                      outline-none
                      border-b
                      border-brand
                      pb-1
                    "
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


            {/* GOAL ACTIONS */}
            <div className="flex items-center gap-2">

              {editingGoal && (
                <button
                  onClick={cancelGoalEdit}
                  disabled={savingGoal}
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-full
                    text-text-secondary
                    hover:bg-red-50
                    hover:text-red-500
                    transition-colors
                  "
                  title="Cancel"
                >
                  <LuX size={17} />
                </button>
              )}


              <button
                onClick={
                  editingGoal
                    ? saveGoal
                    : startEditingGoal
                }
                disabled={savingGoal}
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  text-text-secondary
                  transition-colors
                  hover:bg-background
                  hover:text-text-primary
                  disabled:opacity-50
                "
                title={
                  editingGoal
                    ? "Save"
                    : "Edit goal"
                }
              >

                {savingGoal ? (
                  <span className="text-xs">
                    ...
                  </span>
                ) : editingGoal ? (
                  <LuCheck size={17} />
                ) : (
                  <LuPencil size={17} />
                )}

              </button>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
};

export default Profile;