import { ImageResponse } from "next/og";
import { GambarIkon } from "@/components/GambarIkon";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<GambarIkon ukuran={64} />, size);
}
