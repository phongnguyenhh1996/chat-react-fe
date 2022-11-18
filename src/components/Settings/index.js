import React from "react";
import User from "../User";
import avatar from "../../asset/img/avatar.jpg";
import "./style.scss";
import Collapse, { Panel } from "rc-collapse";
import CardBody from "../CardBody";
import { BiChevronRight } from "react-icons/bi";
import Privacy from "../Privacy";
import Scrollbars from "react-custom-scrollbars-2";
import Security from "../Security";
import Help from "../Help";

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
export const Setting = () => {
  return (
    <div className="settings">
      <h4 className="settings__title">Setting</h4>
      <User avatar={avatar} name={"Patricia Smith"} isEdit={true} />
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
