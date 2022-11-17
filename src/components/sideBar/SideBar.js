import React from "react";
import { useDispatch } from "react-redux";

import LogoImg from "../../asset/img/logo.svg";
import avatar from "../../asset/img/avatar.jpg";
import {
  SideBars,
  SideBarsBtn,
  SideBarsDropDown,
  SideBarsUser,
} from "./dataSideBar";
import "./style.scss";
import Tooltip from "rc-tooltip";
import "rc-tooltip/assets/bootstrap.css";
import Dropdown from "rc-dropdown";
import { changeSection } from "../../features/ui/uiSlice";
import { Section } from "./Section";
import DropDown from "../DropDown";

const dropDown = (
  <DropDown
    options={SideBarsDropDown.map((item) => (
      <>
        <img src={item.img} alt="" />
        {item.title}
      </>
    ))}
  />
);
const user = (
  <DropDown
    className="dropdown__user-item"
    options={SideBarsUser.map((item, idx) =>
      item === "Divider" ? (
        item
      ) : (
        <React.Fragment key={idx}>
          <p>{item.title}</p>
          {item.icon && <item.icon />}
        </React.Fragment>
      )
    )}
  />
  // <Menu>
  //   {SideBarsUser.map((item, idx) =>
  //     item.title === "Divider" ? (
  //       <Divider key={idx} />
  //     ) : (
  //       <MenuItem key={idx}>
  //         <div className="dropdown__user-item">
  //           <p>{item.title}</p>
  //           <item.icon />
  //         </div>
  //       </MenuItem>
  //     )
  //   )}
  // </Menu>
);

const SideBar = () => {
  const dispatch = useDispatch();

  return (
    <div className="all">
      <div className="sidebar">
        <div className="sidebar__logo">
          <img src={LogoImg} alt="" />
        </div>
        <div className="sidebar__list">
          <div className="sidebar__item">
            {SideBars.map((data, idx) => (
              <Tooltip
                placement="top"
                trigger={"hover"}
                overlay={<span>{data.title}</span>}
                key={idx}
                overlayClassName={"over"}
                mouseLeaveDelay={0.1}
              >
                <div className="sidebar__icon">
                  <data.icon
                    onClick={() => dispatch(changeSection(data.title))}
                    className="icon"
                    key={idx}
                  />
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
        <div className="sidebar__list">
          <div className="sidebar__item">
            {SideBarsBtn.map((data, idx) =>
              idx === 0 ? (
                <Dropdown
                  trigger={["click"]}
                  overlay={dropDown}
                  animation="slide-up"
                  onVisibleChange={"onVisibleChange"}
                  key={idx}
                  overlayClassName={"dropdown"}
                >
                  <div className="sidebar__icon">
                    <data.icon className="icon" key={idx} />
                  </div>
                </Dropdown>
              ) : (
                <Tooltip
                  placement="right"
                  trigger={"hover"}
                  overlay={<span className="over">{data.title}</span>}
                  transitionName={"rc-tooltip-zoom"}
                  key={idx}
                >
                  <div className="sidebar__icon">
                    <data.icon className="icon" key={idx} />
                  </div>
                </Tooltip>
              )
            )}
          </div>
          <div className="sidebar__item avatar">
            <Dropdown
              trigger={["click"]}
              overlay={user}
              animation="slide-up"
              onVisibleChange={"onVisibleChange"}
              overlayClassName={"dropdown__user"}
            >
              <img src={avatar} alt="" />
            </Dropdown>
          </div>
        </div>
      </div>
      <Section />
    </div>
  );
};

export default SideBar;
