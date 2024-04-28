import React from "react";
import "./die.scss";

const Pip = () => <span className="pip" />;

const Face = ({ children }) => <div className="face">{children}</div>;

const Die = ({ value }) => {
	let pips = Number.isInteger(value)
		? Array(value)
				.fill(0)
				.map((_, i) => <Pip key={i} />)
		: null;
	return <Face>{pips}</Face>;
};

export default Die;
