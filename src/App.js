import React from "react";
import { Routes, Route, Navigate, redirect } from "react-router-dom";

import "./App.scss";

// import SideBar from "./components/SideBar";
import Dashboard from "./view/Dashboard";
import Login from "./view/Login";

const Authentication = ({ children }) => {
  const token = window.localStorage.getItem("token");
  if (!token) return <Navigate replace to="/login" />;

  return children;
};

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Authentication>
            <Dashboard />
          </Authentication>
        }
      />
      <Route
        loader={() => {
          if (window.localStorage.getItem("token")) return redirect("/");
        }}
        path="/login"
        element={<Login />}
      />
    </Routes>
  );
}

export default App;
