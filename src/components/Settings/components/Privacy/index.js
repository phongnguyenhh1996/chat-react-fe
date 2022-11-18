import { dataPrivacy } from "./dataPrivacy";
import Dropdown from "rc-dropdown";
import { BiChevronDown } from "react-icons/bi";
import Switch from "react-switch";
import "./style.scss";
import { useState } from "react";
import DropDown from "./../../../DropDown";

const everyone = ["Everyone", "selected", "Nobody"];

const Privacy = () => {
  const [checked, setChecked] = useState(false);
  const handleChange = (nextChecked) => {
    setChecked(nextChecked);
  };
  return (
    <div className="privacy">
      {dataPrivacy.map((data, idx) => (
        <div className="privacy__item" key={idx}>
          <div className="privacy__item-name">{data.title}</div>
          {data.type === "Everyone" ? (
            <Dropdown
              trigger={["click"]}
              overlay={<DropDown options={everyone} />}
              animation="slide-up"
              onVisibleChange={"onVisibleChange"}
              overlayClassName={"dropdown"}
            >
              <div className="privacy__item-everyone">
                {data.type}
                <BiChevronDown />
              </div>
            </Dropdown>
          ) : (
            <Switch
              height={15}
              width={30}
              onColor="#7269ef"
              offColor="#f7f7ff"
              onHandleColor="#fff"
              offHandleColor={"#000"}
              handleDiameter={12}
              uncheckedIcon={false}
              checkedIcon={false}
              borderRadius={10}
              activeBoxShadow={null}
              className="privacy__item-switch"
              onChange={handleChange}
              checked={checked}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default Privacy;
