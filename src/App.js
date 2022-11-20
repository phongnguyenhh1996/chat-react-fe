import React from "react";
import "./App.scss";

import SideBar from "./components/SideBar";
import Chat from "./components/chat/main";

function App() {
  return (
    <>
      <div className="container-page">
        <SideBar />
        <Chat />
      </div>
    </>
  );
}

export default App;
