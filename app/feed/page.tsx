import { Metadata } from "next";
import { FeedClient } from "./page-client";

export const metadata: Metadata = {
  title: "Interview Experiences",
  description: "Browse verified student-shared interview experiences from leading engineering companies.",
};

export default function FeedPage() {
  return <FeedClient />;
}
