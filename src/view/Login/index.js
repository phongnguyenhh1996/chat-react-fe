import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import * as jose from "jose";
import { useNavigate, Navigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const token = window.localStorage.getItem("token");

  if (token) {
    return <Navigate replace to="/" />;
  }

  return (
    <div>
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          console.log(jose.decodeJwt(credentialResponse.credential));
          localStorage.setItem("token", credentialResponse.credential);
          navigate("/");
        }}
        onError={() => {
          console.log("Login Failed");
        }}
      />
    </div>
  );
};

export default Login;
