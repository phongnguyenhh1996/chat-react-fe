import React from "react";
import { Routes, Route} from "react-router-dom";

import "./App.scss";

import Dashboard from "./view/Dashboard";
import {ReactComponent} from './asset/img/icons.svg'

function App() {
  return (
    <>
    <ReactComponent/>
    <Routes>
      <Route path="/" element={<Dashboard />} />
    </Routes>
    </>
  );
}

export default App;