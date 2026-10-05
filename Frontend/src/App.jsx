import {BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./compontents/Layout";

import Home from "./Pages/Home";
import Discover from "./Pages/Discover";
import MyLibrary from "./Pages/MyLibrary";
import Collection from "./Pages/Collection";
import Notes from "./Pages/Notes";
import NoteDetail from "./Pages/NoteDetail";
import Profile from "./Pages/Profile";

import "./index.css";
import "./App.css";
import BookDetail from "./Pages/BookDetail";
import Reader from "./compontents/Reader";
function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/Discover" element={<Discover />} />
          <Route path="/MyLibrary" element={<MyLibrary />} />
          <Route path="/Collection" element={<Collection />} />
          <Route path="/Notes" element={<Notes />} />
          <Route path="/NoteDetail" element={<NoteDetail />} />
          <Route path="/BookDetail/:bookId" element={<BookDetail />} />
          <Route path="/reader/:bookId"element={<Reader />}/>
          <Route path="/Profile"element={<Profile />}/>
        </Route>
      </Routes>
    </>
  );
}

export default App;
