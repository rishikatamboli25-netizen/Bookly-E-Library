import React, { useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useLocation, useNavigate } from "react-router-dom";

import BookCover from "../compontents/BookCover";
import { api, getFriendlyError } from "../utils/api";
import { clearCachedUserData } from "../utils/userData";

const NOTES_RESOURCE = "notes";

const getOriginalCoverBook = (book) => {
  if (!book) {
    return null;
  }

  if (book.coverUrl) {
    return book;
  }

  if (!book.identifier) {
    return book;
  }

  return {
    ...book,
    coverUrl: `https://raw.githubusercontent.com/standardebooks/${book.identifier}/master/src/epub/images/cover.svg`,
  };
};

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
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("error");

  if (!note) {
    return (
      <section className="flex min-h-[calc(100dvh+2rem)] w-full items-center justify-center px-3 py-8 sm:px-5 lg:px-6">
        <div className="w-full max-w-md text-center">
          <h2 className="text-xl font-semibold text-text-primary">
            Note not found
          </h2>

          <p className="mt-2 text-sm leading-6 text-text-secondary">
            This note is no longer available here. Return to Notes and open it
            again.
          </p>

          <button
            type="button"
            onClick={() => navigate("/Notes")}
            className="mt-6 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Back to Notes
          </button>
        </div>
      </section>
    );
  }

  const coverBook = getOriginalCoverBook(note.book);

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

  const showFeedback = (message, type = "error") => {
    setFeedback(message);
    setFeedbackType(type);
  };

  const handleEdit = () => {
    setEditedText(note.text || "");
    setEditedPage(note.page || "");
    setFeedback("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedText(note.text || "");
    setEditedPage(note.page || "");
    setFeedback("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedText.trim() || saving) {
      showFeedback("A note cannot be empty.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      showFeedback("Please sign in again before updating this note.");
      return;
    }

    setSaving(true);
    setFeedback("");

    try {
      const response = await api.put(
        `/api/users/updatenote/${note._id}`,
        {
          text: editedText.trim(),
          page: editedPage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedNote = response.data?.note;

      setNote((previous) => ({
        ...previous,
        ...(updatedNote || {}),
      }));

      clearCachedUserData({
        token,
        resource: NOTES_RESOURCE,
      });

      setIsEditing(false);
      showFeedback("Note updated successfully.", "success");
    } catch (error) {
      showFeedback(
        getFriendlyError(
          error,
          "We couldn't update this note right now. Please try again."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      showFeedback("Please sign in again before deleting this note.");
      return;
    }

    setDeleting(true);
    setFeedback("");

    try {
      await api.delete(`/api/users/deletenote/${note._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      clearCachedUserData({
        token,
        resource: NOTES_RESOURCE,
      });

      navigate("/Notes", {
        replace: true,
      });
    } catch (error) {
      showFeedback(
        getFriendlyError(
          error,
          "We couldn't delete this note right now. Please try again."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="min-h-[calc(100dvh+2rem)] w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-6">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="sticky top-0 z-20 flex min-h-[64px] items-center justify-between gap-4 bg-background-main/95 py-2 backdrop-blur-sm sm:min-h-[72px]">
          <button
            type="button"
            onClick={() => navigate("/Notes")}
            className="flex min-w-0 items-center gap-2 rounded-lg text-text-primary transition hover:opacity-75"
            aria-label="Back to notes"
          >
            <IoArrowBack className="shrink-0 text-lg sm:text-xl" />

            <span className="truncate text-lg font-semibold sm:text-2xl">
              Note Detail
            </span>
          </button>

          {!isEditing && (
            <div className="flex shrink-0 items-center gap-1 text-text-secondary sm:gap-2">
              <button
                type="button"
                onClick={handleEdit}
                className="rounded-full p-2.5 transition hover:bg-brand-light hover:text-brand"
                title="Edit note"
                aria-label="Edit note"
              >
                <FiEdit size={18} />
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full p-2.5 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                title="Delete note"
                aria-label="Delete note"
              >
                <RiDeleteBin6Line size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`mt-3 rounded-xl border px-4 py-3 text-sm leading-6 ${
              feedbackType === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-border-light bg-background-card text-text-secondary"
            }`}
            role="status"
          >
            {feedback}
          </div>
        )}

        {/* Book Header */}
        <div className="mt-6 flex flex-col gap-5 sm:mt-8 sm:flex-row sm:items-start sm:gap-7 lg:gap-8">
          <div className="w-24 shrink-0 sm:w-28 lg:w-32">
            <div className="aspect-[2/3] overflow-hidden rounded-lg bg-gray-100 shadow-sm">
              <BookCover
                book={coverBook}
                alt={note.book?.title || "Book cover"}
                loading="eager"
                priority
                sizes="128px"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold leading-tight text-text-primary sm:text-2xl lg:text-3xl">
              {note.book?.title || "Untitled Book"}
            </h1>

            {note.book?.author && (
              <p className="mt-1.5 text-sm text-text-secondary sm:text-base">
                {note.book.author}
              </p>
            )}

            {/* Metadata */}
            {!isEditing ? (
              <div className="mt-5 space-y-2 text-sm sm:text-base">
                <p className="text-text-secondary">
                  <span className="font-medium text-text-primary">
                    Page No:
                  </span>{" "}
                  {note.page ?? "N/A"}
                </p>

                <p className="text-text-secondary">
                  <span className="font-medium text-text-primary">
                    Created at:
                  </span>{" "}
                  {formattedDate}
                </p>
              </div>
            ) : (
              <div className="mt-5">
                <label
                  htmlFor="note-page"
                  className="text-sm font-medium text-text-primary"
                >
                  Page No.
                </label>

                <input
                  id="note-page"
                  type="number"
                  value={editedPage}
                  onChange={(event) => setEditedPage(event.target.value)}
                  className="mt-2 block w-28 rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="my-7 border-t border-border-light sm:my-9" />

        {/* Note */}
        <div className="max-w-4xl pb-24">
          {!isEditing ? (
            <article>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-6 bg-brand" />

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
                  Your Note
                </p>
              </div>

              <div className="whitespace-pre-wrap text-[15px] leading-8 text-text-primary sm:text-base sm:leading-8">
                {note.text || "No note text saved."}
              </div>
            </article>
          ) : (
            <div>
              <label
                htmlFor="note-content"
                className="mb-3 block text-sm font-semibold text-text-primary"
              >
                Edit Note
              </label>

              <textarea
                id="note-content"
                value={editedText}
                onChange={(event) => setEditedText(event.target.value)}
                rows={10}
                className="w-full resize-y rounded-xl border border-border-light bg-white p-4 text-sm leading-7 text-text-primary outline-none transition placeholder:text-text-secondary focus:border-brand focus:ring-2 focus:ring-brand/10 sm:text-base"
                placeholder="Write your note..."
              />

              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="w-full rounded-full border border-border-light px-5 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NoteDetail;