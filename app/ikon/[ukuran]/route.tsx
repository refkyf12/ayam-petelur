import { ImageResponse } from "next/og";
import { GambarIkon } from "@/components/GambarIkon";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ ukuran: "192" }, { ukuran: "512" }];
}

export async function GET(_req: Request, { params }: { params: Promise<{ ukuran: string }> }) {
  const { ukuran } = await params;
  const s = ukuran === "512" ? 512 : 192;
  return new ImageResponse(<GambarIkon ukuran={s} />, { width: s, height: s });
}
