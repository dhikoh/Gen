import { ProfileChannelData, PromptSettingsData } from "./promptGenerator";
import { resolveVisualStyle } from "./visualStyleMap";

export interface ImageConfigData {
  cameraType?: string | null;
  shotType?: string | null;
  lighting?: string | null;
  mood?: string | null;
  colorGrading?: string | null;
  visualStyle?: string | null;
  negativePrompt?: string | null;
  variations?: number | null;
  aspectRatio?: string | null;
}

export function generateImagePrompt(
  channel: ProfileChannelData,
  topic: string,
  additionalContext: string,
  imageConfig: ImageConfigData,
  promptSettings?: (PromptSettingsData & { defaultNegativePrompt?: string | null }) | null,
  excludeTitles?: string[],
  outputLanguage?: string | null
): { masterPrompt: string; systemInstruction: string; finalJson?: string } {
  const variations = [];
  const numVars = imageConfig?.variations || 4;
  const activeNegPrompt = imageConfig?.negativePrompt || promptSettings?.defaultNegativePrompt || "";
  
  for (let i = 1; i <= numVars; i++) {
    // Basic assembly
    let promptText = `${topic}`;
    if (additionalContext) promptText += `, ${additionalContext}`;
    if (channel.channelName) promptText += `, style inspired by ${channel.channelName}`;
    if (channel.visualAesthetic) promptText += `, ${channel.visualAesthetic}`;
    
    if (imageConfig?.cameraType && imageConfig.cameraType !== "Default") promptText += `, shot on ${imageConfig.cameraType}`;
    if (imageConfig?.shotType) promptText += `, ${imageConfig.shotType}`;
    if (imageConfig?.lighting) promptText += `, ${imageConfig.lighting}`;
    if (imageConfig?.mood) promptText += `, ${imageConfig.mood} mood`;
    if (imageConfig?.colorGrading) promptText += `, ${imageConfig.colorGrading} color grading`;
    if (imageConfig?.visualStyle) {
      const resolvedStyle = resolveVisualStyle(imageConfig.visualStyle) || imageConfig.visualStyle;
      promptText += `, ${resolvedStyle}`;
    }
    
    let ar = "16:9";
    if (imageConfig?.aspectRatio) {
      if (imageConfig.aspectRatio === '9:16') ar = "9:16";
      else if (imageConfig.aspectRatio === '1:1') ar = "1:1";
    }
    promptText += ` --ar ${ar}`;
    
    if (activeNegPrompt && activeNegPrompt !== "None") {
      promptText += ` --no ${activeNegPrompt}`;
    }

    // Create a narrative version
    let narrative = `Generate an image about ${topic}. `;
    if (additionalContext) narrative += `${additionalContext}. `;
    if (channel.channelName) narrative += `The aesthetic should match the brand identity of ${channel.channelName}. `;
    if (channel.visualAesthetic) narrative += `Visually, it must embody ${channel.visualAesthetic}. `;
    if (imageConfig?.cameraType && imageConfig.cameraType !== "Default") narrative += `Imagine this captured on a ${imageConfig.cameraType}. `;
    if (imageConfig?.shotType) narrative += `The framing is a ${imageConfig.shotType}. `;
    if (imageConfig?.lighting) narrative += `It is illuminated by ${imageConfig.lighting}. `;
    if (imageConfig?.mood) narrative += `The overall atmosphere conveys a ${imageConfig.mood} mood. `;
    if (imageConfig?.colorGrading) narrative += `Apply a ${imageConfig.colorGrading} color grading. `;
    if (imageConfig?.visualStyle) {
      const resolvedStyle = resolveVisualStyle(imageConfig.visualStyle) || imageConfig.visualStyle;
      narrative += `The visual style is distinctly ${resolvedStyle}. `;
    }

    variations.push({
      id: i,
      prompt_text: promptText,
      narrative_prompt: narrative.trim(),
      negative_prompt: activeNegPrompt,
      aspect_ratio: `--ar ${ar}`
    });
  }

  const finalJson = JSON.stringify({ variations }, null, 2);

  let systemInstruction = "Direct generation successful.";
  if (promptSettings?.imageSystemInstruction?.trim()) {
    systemInstruction = promptSettings.imageSystemInstruction.trim();
  }
  if (outputLanguage && outputLanguage.trim().length > 0) {
    systemInstruction += `\nWAJIB: Jika ada prompt teks overlay atau ide caption, tulis dalam bahasa ${outputLanguage.trim()}. Note: Visual prompt untuk Midjourney tetap dalam bahasa Inggris.`;
  }

  // P3-2: Inject excludeTitles into systemInstruction so LLM avoids used topics
  if (excludeTitles && excludeTitles.length > 0) {
    const titleList = excludeTitles.map((t, i) => `${i + 1}. ${t}`).join('\n');
    systemInstruction += `\n\nDIREKTIF PENTING - HINDARI TOPIK BERIKUT (sudah pernah digunakan):\n${titleList}\nJangan buat variasi, parafrase, atau topik yang mirip dengan judul-judul di atas.`;
  }

  return { 
    masterPrompt: "Prompt generated directly. You can edit the JSON below.", 
    systemInstruction,
    finalJson
  };
}
