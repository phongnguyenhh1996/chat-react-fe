import React from "react";
import { Routes, Route, Navigate, redirect } from "react-router-dom";

import "./App.scss";

// import SideBar from "./components/SideBar";
import Dashboard from "./view/Dashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
