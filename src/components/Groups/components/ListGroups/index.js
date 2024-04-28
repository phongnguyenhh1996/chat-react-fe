import React from "react";
import { useSelector } from "react-redux";

import { selectGroup, selectSearch } from "./../../../../features/groups/group";

import "./style.scss";

const ListGroup = () => {
  const dataGroups = useSelector(selectGroup);
  const search = useSelector(selectSearch);

  return (
    <div className="group">
      <ul className="group__list">
        {dataGroups
          .filter((data) =>
            data.name.toLowerCase().includes(search.toLowerCase())
          )
          .map((data, idx) => (
            <li className="group__list-item" key={idx}>
              <h2 className="group__list-logo">{data.name[0].toUpperCase()}</h2>
              <h5 className="group__list-name">#{data.name}</h5>
              {data.email.length <= 9 ? (
                <span className="group__list-member">{data.email.length}</span>
              ) : (
                <span className="group__list-member">9+</span>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default ListGroup;
