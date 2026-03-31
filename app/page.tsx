import { Metadata } from "next";
import LandingClient from "./page-client";

export const metadata: Metadata = {
  title: "Placement Chat | Interview Experiences Platform",
  description: "Placement Chat is a free, open-source platform where engineering students share and discover real placement and internship interview experiences. Browse interview questions, round details, and preparation tips — no login required.",
};

export default function HomePage() {
  return <LandingClient />;
}
