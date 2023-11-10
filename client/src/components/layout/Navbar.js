import React, { useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import LogOutBtn from "../auth/LogOutBtn";

function Navbar() {
  const { loggedIn } = useContext(AuthContext);

  return (

    <nav className="navbar navbar-expand-lg navbar-light bg-light">
  <div className="container-fluid">
    <a className="navbar-brand" href="#">
      CHAT WITH ME
    </a>

    <a href="/">
    </a>

    {loggedIn === false && (
      <>
        <a  href="/register">
          Register
        </a>
        <a href="/login">
          Log in
        </a>
      </>
    )}

    {loggedIn === true && (
      <>
        <a href="/chat">
          Chat here
        </a>

        <LogOutBtn />
      </>
    )}
  </div>
</nav>



  
  );
}

export default Navbar;
