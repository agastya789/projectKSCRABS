import React from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import GameHub from "./components/GameHub";
import logo from "./assets/yourlogo.png"

function App() {
  const [isDarkMode, setIsDarkMode] = useLocalStorage("darkMode", true);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  return (
    <>
      <div className={isDarkMode ? "dark" : ""}>
        <GameHub isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      </div>
      <div className=" p-10 m-4 flex flex-col items-center text-gray-400 text-lg">
        <img src ={logo} className="h-24 w-24"/>
        <div>
          Crafted by <span className="text-pixel-green font-bold">KSCRABS</span>
        </div>
        <div className="text-sm">
          Agastya Singh, Bhanu Chary, Sanchay Krishna
        </div>
      </div>
    </>
  );
}

export default App;
