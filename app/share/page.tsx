import { Metadata } from "next";
import ShareClient from "./share-client";

export const metadata: Metadata = {
  title: "Share Your Interview Experience",
  description: "Contribute to the community by sharing your placement or internship interview journey.",
};

export default function SharePage() {
  return <ShareClient />;
}
