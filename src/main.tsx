import './index.css'

import { BrowserRouter, Route, Routes } from 'react-router'

import App from './App.tsx'
import AppV2 from './AppV2.tsx'
import React from 'react'
import ReactDOM from 'react-dom/client'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/v2" element={<AppV2 />} />
    </Routes>
  </BrowserRouter>,
)
