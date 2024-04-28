import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Dropdown from "rc-dropdown";
import Tooltip from "rc-tooltip";

import {
  SideBars,
  SideBarsBtn,
  SideBarsDropDown,
  SideBarsUser,
} from "./dataSideBar";
import LogoImg from "../../asset/img/logo.svg";
import avatar from "../../asset/img/avatar.jpg";
import { changeSection, selectSection } from "../../features/ui/uiSlice";
import { Section } from "./Section";
import DropDown from "../DropDown";

import "./style.scss";

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
);

const SideBar = () => {
  const dispatch = useDispatch();
  const section = useSelector(selectSection);
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
                <div
                  className={`sidebar__icon ${
                    section === data.title && "sidebar__icon--active"
                  }`}
                >
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
