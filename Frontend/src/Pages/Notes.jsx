import React, { useEffect, useState } from "react";
import book from "../assets/image/book.jpg";
import { IoChevronBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Vite environment variable with localhost fallback
const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

const Notes = ({ note }) => {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const getNotes = async (req, res) => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_BASE}/api/users/getnotes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setNotes(response.data);
      } catch (error) {
        console.error("Failed to fetch notes: ", error);
      }
    };

    getNotes();
  }, []);

  const handleClick = (item) => {
    console.log(item);
    navigate("/Notedetail", {
      state: {
        note: item,
      },
    });
  };

  if (notes.length == 0) {
    console.log("NO notes");
    return (
      <>
        <section className="h-full w-full flex items-center justify-center">
          <div className="flex flex-col items-center justify-center h-[30vh] w-[25vw] rounded-2xl bg-gray-100">
            <div className="text-[1.6rem] text-brand font-semibold">
              No Notes Found
            </div>
            <div className="text-[1rem] text-gray-500">
              Start Reading to create notes
            </div>
            <button
              className="bg-brand w-fit px-4 py-1 rounded-full text-white mt-2"
              onClick={() => navigate("/discover")}
            >
              Explore Books
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <section className="px-20 pt-7">
        <div
          onClick={() => navigate(-1)}
          className="flex w-fit cursor-pointer items-center gap-2 text-[clamp(16px,3vw,26px)] font-semibold text-text-primary"
        >
          <IoChevronBack />
          <span>Your Notes</span>
        </div>
      </section>

      {/* Notes Card */}
      <section className="w-[70vw] justify-self-center pt-7">
        {notes?.map((item, index) => (
          <div
            key={index}
            onClick={() => handleClick(item)}
            className="w-full my-6 flex justify-between bg-background-card border border-border-light rounded-lg p-4 cursor-pointer"
          >
            <div className="flex gap-4">
              <img
                className="h-[17vh]"
                src={`https://archive.org/services/img/${item.book.identifier}`}
                alt="Book"
              />

              <div>
                <h2 className="text-text-primary font-semibold text-[clamp(13px,3vw,26px)]">
                  {item.book.title}
                </h2>

                <p className="text-text-secondary text-[clamp(8px,2vw,16px)] py-1">
                  Page No: {item.page}
                </p>
              </div>
            </div>

            <div className="text-[clamp(8px,2vw,16px)] text-text-secondary">
              {new Date(item.createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </div>
          </div>
        ))}
      </section>
    </>
  );
};

export default Notes;