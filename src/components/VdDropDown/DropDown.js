import React from "react";
import Dropdown from "rc-dropdown";
import Menu, { Item as MenuItem, Divider } from "rc-menu";
import "rc-dropdown/assets/index.css";
import "rc-menu/assets/index.css";


function onSelect({ key }) {
  console.log(`${key} selected`);
}

function onVisibleChange(visible) {
  console.log(visible);
}
const items = ["one", "two", "divider", "three"];
const menu = (
  <Menu onSelect={onSelect}>
    {items.map((item, idx) => (
      item === "divider" ? <Divider /> : <MenuItem key={idx}>{item}</MenuItem>
    ))}
  </Menu>
);
const DropDown = () => {
  return (
    <>
      {" "}
      <div style={{ margin: 20 }}>
        <div style={{ height: 100 }} />
        <div>
          <Dropdown
            trigger={["click"]}
            overlay={menu}
            animation="slide-up"
            onVisibleChange={onVisibleChange}
          >
            <button style={{ width: 100 }}>open</button>
          </Dropdown>
        </div>
      </div>
    </>
  );
};

export default DropDown;
