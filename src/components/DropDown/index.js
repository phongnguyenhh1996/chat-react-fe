import Menu, { Item as MenuItem, Divider } from "rc-menu";
import React from "react";

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
