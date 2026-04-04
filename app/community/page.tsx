import { Metadata } from "next";
import { CommunityClient } from "./community-client";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Join discussions, ask questions, and connect with fellow students preparing for placements and interviews.",
};

export default function CommunityPage() {
  return <CommunityClient />;
}
