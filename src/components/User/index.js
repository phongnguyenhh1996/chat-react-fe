import React from "react";
import {
  BsPencilFill,
  BsFillRecordCircleFill,
  BsChevronDown,
} from "react-icons/bs";
import Dropdown from "rc-dropdown";
import "rc-dropdown/assets/index.css";
import "rc-menu/assets/index.css";
import Menu, { Item as MenuItem } from "rc-menu";
import "./style.scss";

const act = ["Available", "Busy"];

const dropDownAct = (
  <Menu>
    {act.map((item, idx) => (
      <MenuItem key={idx}>
        <div className="dropdown__item">{item}</div>
      </MenuItem>
    ))}
  </Menu>
);

const User = (props) => {
  const { avatar, name, className, isActive, isAct, isEdit } = props;
  return (
    <div className={`avatar avatar-user ${className}`}>
      <div className="avatar__proper">
        <img className="avatar__img" src={avatar} alt="" />
        {isEdit ? (
          <div className="edit">
            <BsPencilFill />
          </div>
        ) : (
          <div className="no-edit"></div>
        )}
      </div>
      <h5 className="avatar__name">{name}</h5>
      {isActive ? (
        <p className="actives">
          <BsFillRecordCircleFill className="actives__icon" />
          Active
        </p>
      ) : (
        <p className="no-actives"></p>
      )}
      {isAct ? (
        <Dropdown
          trigger={["click"]}
          overlay={dropDownAct}
          animation="slide-up"
          onVisibleChange={"onVisibleChange"}
          overlayClassName={"dropdown"}
        >
          <div className="act">
            Available <BsChevronDown />
          </div>
        </Dropdown>
      ) : (
        <div className="no-act"></div>
      )}
    </div>
  );
};

export default User;
