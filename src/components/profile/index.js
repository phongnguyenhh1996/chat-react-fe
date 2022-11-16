import React from "react";
import { FiMoreVertical } from "react-icons/fi";
import { BiChevronRight } from "react-icons/bi";
import User from "../User";
import Avatar from "../../asset/img/avatar.jpg";
import Dropdown from "rc-dropdown";
import Menu, { Item as MenuItem, Divider } from "rc-menu";
import "rc-dropdown/assets/index.css";
import "rc-menu/assets/index.css";
import "./style.scss";
import "rc-collapse/assets/index.css";
import Collapse, { Panel } from "rc-collapse";
import { AiOutlineUser } from "react-icons/ai";
import { MdAttachFile } from "react-icons/md";
import CardBody from "../CardBody";
import CardFile from "../CardFile";

const menu = ["Edit", "Action", "Divider", "Another action"];

const dropDownMenu = (
  <Menu>
    {menu.map((item, idx) =>
      item === "Divider" ? (
        <Divider key={idx} />
      ) : (
        <MenuItem key={idx}>
          <div className="dropdown__item">{item}</div>
        </MenuItem>
      )
    )}
  </Menu>
);
const expandIcon = (props) => (
  <BiChevronRight
    style={{
      verticalAlign: "-.125em",
      transition: "transform .2s",
      transform: `rotate(${props.isActive ? -90 : 0}deg)`,
      float: "right",
    }}
  />
);

export const Profile = () => {
  return (
    <div className="profile">
      <div className="profile__title">
        <h4 className="profile__title-text">My Profile</h4>
        <Dropdown
          trigger={["click"]}
          overlay={dropDownMenu}
          animation="slide-up"
          onVisibleChange={"onVisibleChange"}
          overlayClassName={"dropdown"}
        >
          <FiMoreVertical className="profile__title-icon" />
        </Dropdown>
      </div>
      <User avatar={Avatar} name={"Patricia Smith"} isActive={true} />
      <div className="profile__desc">
        <p className="profile__desc-text">
          If several languages coalesce, the grammar of the resulting language
          is more simple and regular than that of the individual.
        </p>
        <Collapse accordion={true}>
          <Panel
            header={
              <div className="profile__header-text">
                <AiOutlineUser className="profile__header-icon" />
                About
              </div>
            }
            headerClass="profile__header"
            expandIcon={expandIcon}
          >
            <CardBody />
          </Panel>
          <Panel
            header={
              <div className="profile__header-text">
                <MdAttachFile className="profile__header-icon" />
                Attached Files
              </div>
            }
            headerClass="profile__header"
            expandIcon={expandIcon}
          >
            <CardFile />
          </Panel>
        </Collapse>
      </div>
    </div>
  );
};
