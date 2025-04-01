"use client";
import dynamic from "next/dynamic";
import { PacmanLoader } from "react-spinners";

const MapComponent = dynamic(
  () => import("./MapContent").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-screen">
        <PacmanLoader color="#fff0f0" />
      </div>
    ),
  }
);

export default function Map() {
  return <MapComponent />;
}
