import './index.css'
import React from 'react'
import ReactDOM from "react-dom/client"
import { BrowserRouter } from 'react-router-dom'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ScrollToTop from "./compontents/ScrollToTop.jsx";
import App from './App.jsx'

import "@fontsource/plus-jakarta-sans"

import "react-circular-progressbar/dist/styles.css";

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ScrollToTop/>
    <App />
  </BrowserRouter>
)
