import { NextResponse } from "next/server";
import ImageKit from "imagekit";

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ""
    });

    // image is a base64 data URI string
    const uploadResponse = await imagekit.upload({
      file: image, 
      fileName: `profitpulse_${Date.now()}`,
      folder: "/profitpulse",
    });

    return NextResponse.json({ url: uploadResponse.url });
  } catch (error) {
    console.error("ImageKit Upload Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to upload image" }, { status: 500 });
  }
}
