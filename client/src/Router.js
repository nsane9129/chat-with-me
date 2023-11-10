import React, { useContext } from "react";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Navbar from "./components/layout/Navbar";
import AuthContext from "./context/AuthContext";
import Chat from "./components/chat/Chat";


function Router() {
  // Access the loggedIn state from the AuthContext using the useContext hook
  const { loggedIn } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Navbar /> 
      <Switch>
        <Route exact path="/">
        </Route>

        {/* Conditional rendering based on the loggedIn state */}
        {loggedIn === false && (
          <>
            <Route path="/register">
              <Register /> 
            </Route>
            <Route path="/login">
              <Login /> 
            </Route>
          </>
        )}

        {loggedIn === true && (
          <>
           
            <Route path="/chat">

              <Chat />
            </Route>
          </>
        )}
      </Switch>
    </BrowserRouter>
  );
}

export default Router; 
