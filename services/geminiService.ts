
import { GoogleGenAI, Type } from "@google/genai";
import { Player, Franchise } from "../types";

export const getScoutingReport = async (player: Player, franchises: Franchise[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';

  const franchiseContext = franchises.map(f => `${f.name} (Budget: ${f.budget}, Squad size: ${f.roster.length})`).join(', ');
  
  const prompt = `
    Generate a high-impact scouting report for ${player.name} (${player.skill}) for the IPL 2026 auction.
    Rating: ${player.rating}/100.
    Available Budget Data: ${franchiseContext}.
    Recent Stats: ${JSON.stringify(player.stats || "Limited data")}.
    
    Provide exactly 2 sentences focusing on:
    1. His tactical value (e.g., finisher, powerplay bowler).
    2. Which specific franchise from the list (Franchise 1-10) should bid for him.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    return response.text || "Report unavailable.";
  } catch (error) {
    console.error("Scouting Error:", error);
    return "The scouting engine is offline. Use your instinct.";
  }
};

export const fetchPlayersFromWeb = async (): Promise<Player[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';
  
  const prompt = `
    URGENT: Scrape the official iplt20.com website for the Season 2026 squad details.
    
    USE THE FOLLOWING TARGET LINKS:
    - https://www.iplt20.com/teams/sunrisers-hyderabad
    - https://www.iplt20.com/teams/mumbai-indians
    - https://www.iplt20.com/teams/chennai-super-kings
    - https://www.iplt20.com/teams/royal-challengers-bengaluru
    - https://www.iplt20.com/teams/kolkata-knight-riders
    - https://www.iplt20.com/teams/delhi-capitals
    - https://www.iplt20.com/teams/rajasthan-royals
    - https://www.iplt20.com/teams/lucknow-super-giants
    - https://www.iplt20.com/teams/gujarat-titans
    - https://www.iplt20.com/teams/punjab-kings

    FOR EACH TEAM:
    Extract the Player Name, their actual IPL Team Name (e.g., "Mumbai Indians", "CSK", "Sunrisers Hyderabad"), and their Skill (e.g., "Batter", "Bowler", "All-Rounder", "WK-Batter").
    
    MANDATORY MAPPINGS:
    - Players from Sunrisers Hyderabad page: Ishan Kishan, Aniket Verma, Smaran Ravichandran, Salil Arora, Heinrich Klaasen.
    - Set EVERY player's basePrice to exactly 50.
    - Set isSold to false for all.
    - Include historical stats from their profiles if available (Matches, Runs, Strike Rate, Wickets, Economy).
    - Assign a performance rating (0-100).

    Output as a JSON array of objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              skill: { type: Type.STRING },
              basePrice: { type: Type.NUMBER },
              country: { type: Type.STRING },
              rating: { type: Type.NUMBER },
              isSold: { type: Type.BOOLEAN },
              originalTeam: { type: Type.STRING },
              stats: {
                type: Type.OBJECT,
                properties: {
                  matches: { type: Type.NUMBER },
                  runs: { type: Type.NUMBER },
                  wickets: { type: Type.NUMBER },
                  strikeRate: { type: Type.NUMBER },
                  economy: { type: Type.NUMBER }
                },
                required: ["matches"]
              }
            },
            required: ["id", "name", "skill", "basePrice", "country", "rating", "isSold", "originalTeam"]
          }
        }
      }
    });

    const players = JSON.parse(response.text || "[]");
    
    if (players.length === 0) {
      throw new Error("No player data retrieved.");
    }

    return players.map((p: any, index: number) => ({
      ...p,
      id: p.id || `p-2026-${index}`,
      basePrice: 50,
      isSold: false
    }));
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
};
