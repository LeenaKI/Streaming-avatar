"use client";

import InteractiveAvatar from "@/components/InteractiveAvatar";
import MobileInteractiveAvatar from "@/components/MobileInteractiveAvatar";
import { useEffect, useState } from "react";

export default function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(()=>{
    let accessToken = localStorage.getItem("accessToken")
    if(!accessToken){
      window.location.href = "/SignIn"
    }
  },[])
  
  useEffect(() => {
    // Function to check screen size
    const handleResize = () => {
      setIsMobile(window.matchMedia("(max-width:765px)").matches);
    };

    // Initial check
    handleResize();

    // Add event listener to handle window resize
    window.addEventListener("resize", handleResize);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div>
      {isMobile ? (
        <MobileInteractiveAvatar />
      ) : (
        <div className="w-[95%] flex flex-col items-center justify-center gap-5 mx-auto pt-4">
          <InteractiveAvatar />
        </div>
      )}
    </div>
  );
}
