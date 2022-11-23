import React from "react";
import Scrollbars from "react-custom-scrollbars-2";
import { BiChevronRight } from "react-icons/bi";
import Collapse, { Panel } from "rc-collapse";

import User from "../User";
import avatar from "../../asset/img/avatar.jpg";
import Help from "./components/Help";
import Privacy from "./components/Privacy";
import Security from "./components/Security";
import CardBody from "../CardBody";

import "./style.scss";
import { useSelector } from "react-redux";
import { selectProfile } from "./../../features/profile/profile";

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
const Setting = () => {
  const dataAbout = useSelector(selectProfile);
  return (
    <div className="settings">
      <h4 className="settings__title">Setting</h4>
      <User avatar={avatar} name={dataAbout.name} isEdit={true} />
      <Scrollbars
        autoHeight
        autoHeightMax={500}
        autoHide
        autoHideDuration={200}
      >
        <div className="settings__desc">
          <Collapse accordion={true} defaultActiveKey={0}>
            <Panel
              header={
                <div className="settings__header-text">Personal Info</div>
              }
              headerClass="settings__header"
              expandIcon={expandIcon}
            >
              <CardBody isEdit={true} />
            </Panel>
            <Panel
              header={<div className="settings__header-text">Privacy</div>}
              headerClass="settings__header"
              expandIcon={expandIcon}
            >
              <Privacy />
            </Panel>
            <Panel
              header={<div className="settings__header-text">Security</div>}
              headerClass="settings__header"
              expandIcon={expandIcon}
            >
              <Security />
            </Panel>
            <Panel
              header={<div className="settings__header-text">Help</div>}
              headerClass="settings__header"
              expandIcon={expandIcon}
            >
              <Help />
            </Panel>
          </Collapse>
        </div>
      </Scrollbars>
    </div>
  );
};

export default Setting;
