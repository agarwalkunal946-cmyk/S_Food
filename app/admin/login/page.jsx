"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import ValidatedForm from "@/components/validated-form";

export default function AdminLoginPage() {
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to sign in.");
      window.location.href = "/admin";
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return <main className="login-page">
    <div className="login-image">
      <div className="login-image-wash" />
      <Link className="wordmark login-wordmark" href="/">GATHER & GRAIN<span className="wordmark-dot">.</span></Link>
      <div className="login-image-copy"><span className="eyebrow eyebrow-light">FOOD MADE FOR GATHERING</span><p>Good food.<br /><em>Good company.</em></p></div>
      <span className="login-image-credit">THE GATHER & GRAIN KITCHEN</span>
    </div>
    <div className="login-panel">
      <Link className="back-link login-back" href="/"><ArrowLeft size={15} /> Back to the store</Link>
      <div className="login-form-wrap">
        <span className="login-icon"><LockKeyhole size={19} /></span>
        <span className="eyebrow">THE KITCHEN STUDIO</span>
        <h1>Welcome<br />back.</h1>
        <p>Sign in to update your menu, orders, and food website.</p>
        <ValidatedForm className="admin-login-form" onSubmit={login}>
          <label>Email address<input name="email" type="email" autoComplete="username" placeholder="you@yourfoodbusiness.com" required /></label>
          <label>Password<div className="password-input"><input name="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="Your password" required /><button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-dark login-submit" disabled={loading}>{loading ? "Signing in..." : "Sign in to the kitchen"}<ArrowRight size={16} /></button>
        </ValidatedForm>
        <span className="login-secure">A secure space for the people who keep things cooking.</span>
      </div>
      <span className="login-copyright">© {new Date().getFullYear()} GATHER & GRAIN STUDIO</span>
    </div>
  </main>;
}
