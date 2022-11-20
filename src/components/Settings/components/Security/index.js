import React, { useState } from "react";
import Switch from "react-switch";

import "./style.scss";

const Security = () => {
  const [checked, setChecked] = useState(false);
  const handleChange = (nextChecked) => {
    setChecked(nextChecked);
  };
  return (
    <div className="security">
      <div className="security__item">
        <div className="security__item-name">Show security notification</div>
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
      </div>
    </div>
  );
};

export default Security;
