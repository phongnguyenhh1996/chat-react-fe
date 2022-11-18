import React from "react";
import "./style.scss";

const dataHelp = ["FAQs", "Contact", "Terms & Privacy policy"];

const Help = () => {
  return (
    <div className="help">
      {dataHelp.map((data, idx) => (
        <div className="help__item" key={idx}>
          <div className="help__item-name">{data}</div>
        </div>
      ))}
    </div>
  );
};

export default Help;
