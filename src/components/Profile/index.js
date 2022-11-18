import React from "react";
import { FiMoreVertical } from "react-icons/fi";
import { BiChevronRight } from "react-icons/bi";
import User from "../User";
import avatar from "../../asset/img/avatar.jpg";
import Dropdown from "rc-dropdown";
import "./style.scss";
import Collapse, { Panel } from "rc-collapse";
import { AiOutlineUser } from "react-icons/ai";
import { MdAttachFile } from "react-icons/md";
import CardBody from "../CardBody";
import CardFile from "./components/CardFile";
import motionUtil from "./motionUtil";
import DropDown from "../DropDown/index";

const menu = ["Edit", "Action", "Divider", "Another action"];

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

const Profile = () => {
  return (
    <div className="profile">
      <div className="profile__title">
        <h4 className="profile__title-text">My Profile</h4>
        <Dropdown
          trigger={["click"]}
          overlay={<DropDown options={menu} />}
          animation="slide-up"
          onVisibleChange={"onVisibleChange"}
          overlayClassName={"dropdown"}
        >
          <FiMoreVertical className="profile__title-icon" />
        </Dropdown>
      </div>
      <User avatar={avatar} name={"Patricia Smith"} isActive={true} />
      <div className="profile__desc">
        <p className="profile__desc-text">
          If several languages coalesce, the grammar of the resulting language
          is more simple and regular than that of the individual.
        </p>
        <Collapse openMotion={motionUtil} accordion={true} defaultActiveKey={1}>
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
export default Profile;
