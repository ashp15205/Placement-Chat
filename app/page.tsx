import { Metadata } from "next";
import LandingClient from "./page-client";

export const metadata: Metadata = {
  title: "Placement Chat | Verified Interview Experiences",
  description: "Navigate your career with real-world interview insights from fellow students. Structured logs for DSA, System Design, and more.",
};

export default function HomePage() {
  return <LandingClient />;
}
