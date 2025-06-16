"use client";
import dynamic from "next/dynamic";
import { PacmanLoader } from "react-spinners";

const MapComponent = dynamic(
  () => import("./MapContent").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-screen">
        <PacmanLoader color="#000000" />
      </div>
    ),
  }
);

export default function Map({ pageProps }) {
  const { session, api_url, api_usr, api_pwd } = pageProps || {};

  return <MapComponent pageProps={{ session, api_url, api_usr, api_pwd }} />;
}
