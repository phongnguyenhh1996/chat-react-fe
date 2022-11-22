import React from "react";
import Chat from "../../components/chat/main";
import SideBar from "../../components/SideBar";

const Dashboard = () => {
  return (
    <div className="container-page">
      <SideBar />
      <Chat />
    </div>
  );
};

export default Dashboard;
