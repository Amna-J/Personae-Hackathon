// main.jsx or index.js
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // Check if this exists here
import App from './App'
import "./app.css";

import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* If you have this here, remove it from App.jsx */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)