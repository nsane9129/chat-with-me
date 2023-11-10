// Import the Axios library for making HTTP requests
import axios from "axios";
import React, { createContext, useEffect, useState } from "react";


// Create a context for managing authentication-related state
const AuthContext = createContext();  

function AuthContextProvider(props) {
  // Initialize a state variable for tracking authentication status
  const [loggedIn, setLoggedIn] = useState(undefined);
  const [id, setId] = useState(null);

  // Define an asynchronous function to retrieve the authentication status from the server
  async function getLoggedIn() {
    const loggedInRes = await axios.get("http://localhost:5000/auth/loggedIn");  

    setLoggedIn(loggedInRes.data); 
  
    
  }

  useEffect(() => {
    // Use the useEffect hook to call 'getLoggedIn' when the component mounts
    getLoggedIn();
  }, []);



  return (
    <AuthContext.Provider value={{ loggedIn, getLoggedIn,id}}>
      {props.children}  
    </AuthContext.Provider>
  );
}

export default AuthContext;
export { AuthContextProvider };  
