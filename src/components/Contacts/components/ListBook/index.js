import React from "react";
import { FiMoreVertical } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import Dropdown from "rc-dropdown";

import {
  selectContact,
  removeContact,
  selectSearch,
} from "../../../../features/contacts/contact";
import DropDown from "../../../DropDown";
import { dataCheck } from "./dataCheck";

import "./style.scss";

const ListBook = (props) => {
  const dispatch = useDispatch();
  const contact = useSelector(selectContact);
  const search = useSelector(selectSearch);

  const handleOnChangeCheck = (e) => {
    if (e.target.checked) {
      props.addEmail(e.target.name);
    } else {
      props.removeEmail(e.target.name);
    }
  };

  const onSelect = (type, email) => {
    if (type !== "Remove") return;

    dispatch(removeContact(email));
  };

  let filteredContact = contact.filter((data) =>
    data.name.toLowerCase().includes(search.toLowerCase())
  );

  const contactByAlphabet = {};

  filteredContact.sort((a, b) => {
    if (a.name.toUpperCase() < b.name.toUpperCase()) {
      return -1;
    }
    if (a.name.toUpperCase() > b.name.toUpperCase()) {
      return 1;
    }
    return 0;
  });

  filteredContact.forEach((contact) => {
    const firstLetter = contact.name[0].toUpperCase();
    if (contactByAlphabet[firstLetter]) {
      contactByAlphabet[firstLetter].push(contact);
    } else {
      contactByAlphabet[firstLetter] = [contact];
    }
  });

  return (
    <div className="list__book">
      <div className={`list__book-item ${props.className}`}>
        {Object.keys(contactByAlphabet).map((alphabet) => (
          <React.Fragment key={alphabet}>
            <div className="list__book-title">{alphabet}</div>
            <ul className="list__book-name">
              {contactByAlphabet[alphabet].map((data, idx) => (
                <div className="name__contacts" key={idx}>
                  {props.isCheckBox && (
                    <input
                      name={data.email}
                      onChange={handleOnChangeCheck}
                      type="checkbox"
                      checked={props.emails.includes(data.email)}
                    />
                  )}
                  <h4 className="name__contacts-text">{data.name}</h4>
                  <div>
                    {props.isMenu && (
                      <Dropdown
                        trigger={["click"]}
                        overlay={
                          <DropDown
                            className="dropdown__user-item"
                            options={dataCheck.map((item, idx) =>
                              item === "Divider" ? (
                                item
                              ) : (
                                <div
                                  className="name__contacts-item"
                                  onClick={() =>
                                    onSelect(item.title, data.email)
                                  }
                                  key={idx}
                                >
                                  <p>{item.title}</p>
                                  {item.icon && <item.icon />}
                                </div>
                              )
                            )}
                          />
                        }
                        animation="slide-up"
                        onVisibleChange={"onVisibleChange"}
                        overlayClassName={"dropdown__user"}
                      >
                        <FiMoreVertical className="name__contacts-icon" />
                      </Dropdown>
                    )}
                  </div>
                </div>
              ))}
            </ul>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ListBook;
