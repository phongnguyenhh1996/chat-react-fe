import React from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import "./App.scss";

import Dashboard from "./view/Dashboard";
import { ReactComponent } from "./asset/img/icons.svg";
import ThreeJsGame from "./view/Dashboard/ThreeJsGame";

function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <ReactComponent />
      <Routes>
        <Route path="/" element={<ThreeJsGame />} />
      </Routes>
    </Router>
  );
}

export default App;
