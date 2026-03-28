import { Metadata } from "next";
import LandingClient from "./page-client";

export const metadata: Metadata = {
  title: "Placement Chat | Student Interview Experiences",
  description: "Navigate your career with interview insights from fellow students. Structured logs for DSA, System Design, and more.",
};

export default function HomePage() {
  return <LandingClient />;
}
