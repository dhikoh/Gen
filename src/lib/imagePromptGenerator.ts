export function generateImagePrompt(
  channel: any,
  topic: string,
  additionalContext: string,
  imageConfig: any
): { masterPrompt: string; systemInstruction: string; finalJson?: string } {
  const variations = [];
  const numVars = imageConfig?.variations || 4;
  
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
    if (imageConfig?.visualStyle) promptText += `, ${imageConfig.visualStyle}`;
    
    let ar = "16:9";
    if (imageConfig?.aspectRatio) {
      if (imageConfig.aspectRatio === '9:16') ar = "9:16";
      else if (imageConfig.aspectRatio === '1:1') ar = "1:1";
    }
    promptText += ` --ar ${ar}`;
    
    if (imageConfig?.negativePrompt && imageConfig.negativePrompt !== "None") {
      promptText += ` --no ${imageConfig.negativePrompt}`;
    }

    variations.push({
      id: i,
      prompt_text: promptText,
      negative_prompt: imageConfig?.negativePrompt || "",
      aspect_ratio: `--ar ${ar}`
    });
  }

  const finalJson = JSON.stringify({ variations }, null, 2);

  return { 
    masterPrompt: "Prompt generated directly. You can edit the JSON below.", 
    systemInstruction: "Direct generation successful.",
    finalJson
  };
}
