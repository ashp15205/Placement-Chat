import { Metadata } from "next";
import LoginClient from "./login-client";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to Placement Chat to access student-shared interview intelligence and share your own experiences.",
};

export default function LoginPage() {
  return <LoginClient />;
}
