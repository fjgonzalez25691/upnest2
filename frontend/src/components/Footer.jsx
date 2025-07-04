// .src/components/Footer.jsx
// Purpose: A reusable footer component for the UpNest application. Provides links to important pages and social media.

import React from "react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-surface border-t py-4  text-center text-textsubtle text-sm w-full">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 px-4">
      <span>
        © {new Date().getFullYear()} UpNest. All rights reserved.
      </span>
      <div className="flex gap-4">
        <Link to="/about" className="hover:text-primary">About</Link>
        <Link to="/contact" className="hover:text-primary">Contact</Link>
        <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
// This Footer component provides a simple footer with links to important pages and the current year, styled consistently with the UpNest application design.