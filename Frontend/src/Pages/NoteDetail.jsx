import React, { useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

// Vite environment variable with localhost fallback
const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

const NoteDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialNote = location.state?.note;

  const [note, setNote] = useState(initialNote);

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(initialNote?.text || "");
  const [editedPage, setEditedPage] = useState(initialNote?.page || "");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ==========================================
  // If note doesn't exist
  // ==========================================
  if (!note) {
    return (
      <section className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">Note not found.</p>

        <button
          onClick={() => navigate("/Notes")}
          className="bg-brand text-white px-5 py-2 rounded-full"
        >
          Back to Notes
        </button>
      </section>
    );
  }

  // ==========================================
  // Format date
  // ==========================================
  const formattedDate = note.createdAt
    ? new Date(note.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "Unknown";

  // ==========================================
  // EDIT NOTE
  // ==========================================
  const handleEdit = () => {
    setEditedText(note.text || "");
    setEditedPage(note.page || "");
    setIsEditing(true);
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================
  const handleCancelEdit = () => {
    setEditedText(note.text || "");
    setEditedPage(note.page || "");
    setIsEditing(false);
  };

  // ==========================================
  // SAVE NOTE
  // ==========================================
  const handleSave = async () => {
    if (!editedText.trim()) {
      alert("Note cannot be empty.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${API_BASE}/api/users/updatenote/${note._id}`,
        {
          text: editedText,
          page: editedPage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Note updated successfully:", response.data);

      // Update frontend note
      setNote((prev) => ({
        ...prev,
        ...response.data.note,
      }));

      setIsEditing(false);
    } catch (error) {
      console.error(
        "Failed to update note:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update note."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE NOTE
  // ==========================================
  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      const token = localStorage.getItem("token");

      const response = await axios.delete(
        `${API_BASE}/api/users/deletenote/${note._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Note deleted successfully:", response.data);

      navigate("/Notes");
    } catch (error) {
      console.error(
        "Failed to delete note:",
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete note."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <section className="p-7 pt-0">

        {/* ==========================================
            HEADER
        ========================================== */}
        <div
          className="
            h-[10vh]
            flex
            items-center
            justify-between
            text-[clamp(12px,5vw,22px)]
            font-semibold
            sticky
            top-0
            z-10
            bg-background-main
          "
        >
          {/* Back */}
          <div className="flex items-center gap-2 text-text-primary">
            <button
              onClick={() => navigate("/Notes")}
              className="
                p-2
                rounded-full
                hover:bg-gray-100
                transition
              "
            >
              <IoArrowBack />
            </button>

            <div>Notes Detail</div>
          </div>

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-6 text-text-secondary">

              {/* Edit */}
              <button
                onClick={handleEdit}
                className="
                  hover:text-brand
                  transition
                "
                title="Edit note"
              >
                <FiEdit />
              </button>

              {/* Delete */}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="
                  hover:text-red-500
                  transition
                  disabled:opacity-50
                "
                title="Delete note"
              >
                <RiDeleteBin6Line />
              </button>

            </div>
          )}
        </div>


        {/* ==========================================
            BOOK CARD
        ========================================== */}
        <div className="py-10 flex gap-4">

          <img
            className="w-[8vw] min-w-[70px] object-cover rounded-md"
            src={`https://archive.org/services/img/${note.book?.identifier}`}
            alt={note.book?.title || "Book"}
          />

          <div>

            <div
              className="
                font-semibold
                text-[clamp(18px,4vw,26px)]
                text-text-primary
              "
            >
              {note.book?.title}
            </div>

            {/* PAGE */}
            {!isEditing ? (
              <p
                className="
                  text-text-secondary
                  text-[clamp(10px,2vw,20px)]
                  py-2
                "
              >
                Page No: {note.page}
              </p>
            ) : (
              <div className="mt-3">

                <label className="text-sm text-text-secondary">
                  Page No.
                </label>

                <input
                  type="number"
                  value={editedPage}
                  onChange={(e) => setEditedPage(e.target.value)}
                  className="
                    block
                    mt-1
                    w-32
                    px-3
                    py-2
                    rounded-lg
                    border
                    border-gray-300
                    outline-none
                    focus:border-brand
                  "
                />

              </div>
            )}

          </div>
        </div>


        {/* ==========================================
            NOTE
        ========================================== */}
        <div className="max-w-5xl">

          {!isEditing ? (
            <div
              className="
                text-text-primary
                text-[clamp(14px,2vw,18px)]
                leading-8
                whitespace-pre-wrap
              "
            >
              {note.text}
            </div>
          ) : (
            <div>

              <label className="block mb-2 font-medium text-text-primary">
                Edit Note
              </label>

              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={10}
                className="
                  w-full
                  resize-y
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  p-4
                  text-text-primary
                  outline-none
                  focus:border-brand
                  focus:ring-2
                  focus:ring-brand/20
                "
                placeholder="Write your note..."
              />

              {/* Edit buttons */}
              <div className="flex justify-end gap-3 mt-4">

                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="
                    px-5
                    py-2
                    rounded-full
                    border
                    border-gray-300
                    text-text-secondary
                    hover:bg-gray-100
                    transition
                  "
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="
                    px-5
                    py-2
                    rounded-full
                    bg-brand
                    text-white
                    hover:opacity-90
                    transition
                    disabled:opacity-50
                  "
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

              </div>

            </div>
          )}

        </div>


        {/* ==========================================
            FOOTER / CREATED AT
        ========================================== */}
        {!isEditing && (
          <div
            className="
              w-fit
              fixed
              bottom-3
              right-2
              flex
              py-1
              border
              border-gray-300
              bg-slate-200
              px-3
              rounded-lg
            "
          >
            <p
              className="
                text-[clamp(6px,2vw,12px)]
                text-text-primary
              "
            >
              Created at{" "}

              <span className="font-medium">
                {formattedDate}
              </span>
            </p>
          </div>
        )}

      </section>
    </>
  );
};

export default NoteDetail;