"use client";

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Divider,
} from "@nextui-org/react";
import { ApprikartLogo, XircularLogo } from "./Icons";
import "./navbar.css";

export default function NavBar() {
  return (
    <div>
      <div
        style={{
          backgroundColor: "white",
          flexDirection: "row",
          display: "flex",
          justifyContent: "space-evenly",
          marginTop: "1rem",
        }}
      >
        {/* <Link isExternal aria-label="HeyGen" href="https://app.heygen.com/"> */}
        <ApprikartLogo />
        {/* </Link> */}
        {/* <div className="bg-gradient-to-br from-sky-300 to-indigo-500 bg-clip-text"id="headingtext"> */}
        <p
          className="font-semibold text-transparent bg-gradient-to-br from-sky-300 to-indigo-500 bg-clip-text"
          id="headingtext"
        >
          Interactive Avatar Demo
        </p>
        {/* </div> */}
        <XircularLogo />
      </div>
      <Divider className="nav-divider" />
    </div>
  );
}
