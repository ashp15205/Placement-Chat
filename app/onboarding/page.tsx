import { Metadata } from "next";
import OnboardingClient from "./onboarding-client";

export const metadata: Metadata = {
  title: "Complete Your Profile",
  description: "Provide your professional details to personalize your experience and contribute to the PlacementChat network.",
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}
