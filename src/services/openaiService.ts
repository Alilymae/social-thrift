export async function generateDalleImage(prompt: string) {
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate image.");
    }

    if (data.isFallback) {
      console.warn("Using AI Fallback (Pollinations) because OpenAI billing/quota limit was reached.");
    }

    return data.url;
  } catch (error: any) {
    console.error("DALL-E Generation Error:", error);
    throw new Error(error.message || "Failed to generate image with DALL-E.");
  }
}
