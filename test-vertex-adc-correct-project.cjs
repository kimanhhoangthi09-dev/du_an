const { GoogleGenAI } = require("@google/genai");

async function test() {
  console.log("Testing Vertex AI ADC with correct project context...");
  try {
    const ai = new GoogleGenAI({
      vertexai: true,
      // We can let the SDK auto-discover project and location from environment,
      // or specify the project number we just saw: "395259189173"
      project: "395259189173",
      location: "us-central1"
    });

    console.log("Client initialized. Sending request to gemini-2.5-flash...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Say hello in exactly 3 words.",
    });

    console.log("Vertex AI correct project response text:", response.text);
  } catch (err) {
    console.error("Vertex AI correct project failed:", err);
  }
}

test();
