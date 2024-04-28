import React from "react";
import Menu, { Item as MenuItem, Divider } from "rc-menu";

import "./style.scss";

const DropDown = (props) => {
  return (
    <Menu>
      {props.options.map((item, idx) =>
        item === "Divider" ? (
          <Divider key={idx} />
        ) : (
          <MenuItem key={idx}>
            <div className={`dropdown__item ${props.className}`}>{item}</div>
          </MenuItem>
        )
      )}
    </Menu>
  );
};

export default DropDown;
