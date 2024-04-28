import React from "react";

import "./style.scss";

const Avatar = (props) => {
  return (
    <div className={`avatar ${props.className}`}>
      <img src={props.img} alt="" />
      {props.isOnline ? (
        <span className="on-line"></span>
      ) : (
        <span className="off-line"></span>
      )}
    </div>
  );
};

export default Avatar;
