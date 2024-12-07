import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Replace with your actual OpenAI API key
});

const parsePsychologicalState = (response) => {
  try {
    // Extract the content part of the message
    const content = response.message.content;

    // Match and extract the JSON part
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsedJson = JSON.parse(jsonMatch[1]);
      return parsedJson.psychological_state;
    } else {
      throw new Error("Invalid JSON format in response");
    }
  } catch (error) {
    console.error("Error parsing psychological state:", error.message);
    return null;
  }
};

// API Endpoint
app.post("/analyze-image", async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "Image URL is required" });
  }

  try {
    // Send the image URL to OpenAI's model
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Replace with the model you want to use
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this HTP (Human-Tree-Person) image for a psychological assessment.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: "Please provide the psychological analysis in JSON format. The JSON should include a key 'psychological_state' with exactly two lines summarizing the person's mental and emotional state, based on the features of the drawing.",
            },
          ],
        },
      ],
    });

    // Return the response

    return res.json({ response: parsePsychologicalState(response.choices[0]) });
  } catch (error) {
    console.error("Error analyzing image:", error.message);
    return res.status(500).json({ error: "Failed to analyze image" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
