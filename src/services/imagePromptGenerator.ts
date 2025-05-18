export const IMAGE_PROMPT_TEMPLATE = `You are an AI working in the background to generate image prompts and alt text for a recipe blog.

Read the recipe article below carefully and return 6 items as JSON:

1. Intro Image Prompt: Create a prompt for an appetizing, professional food photography style image of the finished dish based on the recipe title and introduction. Include details about presentation, lighting, and styling.

2. Ingredients Image Prompt: Create a prompt for an artistic arrangement of the main ingredients mentioned in the recipe. Include details about how they should be arranged, lighting, and background.

3. Final Dish Image Prompt: Create a prompt for a close-up, detailed image of the completed dish as it would be served, using information from the entire recipe. Include details about garnishes, plating, and atmosphere.

4. Intro Image Alt Text: Write a concise, SEO-optimized alt text (max 125 characters) for the intro image. Include the focus keyword from the article. Describe the visual elements of the dish, including presentation and serving style.

5. Ingredients Image Alt Text: Write a concise, SEO-optimized alt text (max 125 characters) for the ingredients image. Include the focus keyword from the article. Describe the visual arrangement of ingredients.

6. Final Dish Image Alt Text: Write a concise, SEO-optimized alt text (max 125 characters) for the final dish image. Include the focus keyword from the article. Focus on what someone would see in the photo and what makes it appealing.

Each prompt and alt text should be HIGHLY SPECIFIC to this exact recipe and include precise details from the article.
Include specific ingredients, cooking methods, and presentation details mentioned in the recipe.
Do NOT generate generic food photography prompts or alt text.

Return only this JSON format:
{
  "intro_image_prompt": "...",
  "ingredients_image_prompt": "...",
  "final_recipe_image_prompt": "...",
  "intro_image_alt_text": "...",
  "ingredients_image_alt_text": "...",
  "final_recipe_image_alt_text": "..."
}

Article:
"""{{FULL_RECIPE_ARTICLE}}"""`;

export interface ImagePrompts {
  intro_image_prompt: string;
  ingredients_image_prompt: string;
  final_recipe_image_prompt: string;
  intro_image_alt_text: string;
  ingredients_image_alt_text: string;
  final_recipe_image_alt_text: string;
}

// Function to call OpenRouter API with the selected model
export const callOpenRouterApi = async (prompt: string, modelId: string, apiKey: string): Promise<string> => {
  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  
  if (!apiKey) {
    throw new Error('OpenRouter API key is missing');
  }
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    throw error;
  }
};

export const generateImagePrompts = async (
  articleContent: string, 
  modelId: string = 'openrouter/auto',
  apiKey: string = ''
): Promise<ImagePrompts> => {
  console.log(`Generating image prompts for article with ${articleContent.length} characters using model ${modelId}`);
  
  // Extract recipe title for fallback prompts
  const titleMatch = articleContent.match(/<h1[^>]*>(.*?)<\/h1>/i) || 
                    articleContent.match(/<h2[^>]*>(.*?)<\/h2>/i) || 
                    articleContent.match(/<title[^>]*>(.*?)<\/title>/i);
  const recipeTitle = titleMatch ? titleMatch[1].trim() : "delicious recipe";
  
  // Extract ingredients for fallback prompts
  const ingredientsList: string[] = [];
  const ingredientsMatch = articleContent.match(/<ul[^>]*>(.*?)<\/ul>/is);
  if (ingredientsMatch) {
    const listItems = ingredientsMatch[1].match(/<li[^>]*>(.*?)<\/li>/ig);
    if (listItems) {
      listItems.forEach(item => {
        const content = item.replace(/<li[^>]*>(.*?)<\/li>/i, '$1').trim();
        if (content) ingredientsList.push(content);
      });
    }
  }
  
  try {
    // Prepare the prompt for the LLM
    const promptTemplate = IMAGE_PROMPT_TEMPLATE.replace('{{FULL_RECIPE_ARTICLE}}', articleContent);
    
    // Call the API to generate image prompts
    const response = await callOpenRouterApi(promptTemplate, modelId, apiKey);
    console.log('Raw image prompt response:', response.substring(0, 200) + '...');
    
    // Try to parse the response as JSON
    try {
      // Look for JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/); // Find anything that looks like JSON
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsedResponse = JSON.parse(jsonStr);
        
        // Validate the response has the expected fields
        if (parsedResponse.intro_image_prompt && 
            parsedResponse.ingredients_image_prompt && 
            parsedResponse.final_recipe_image_prompt) {
          
          // Add recipe title to each prompt for better context
          parsedResponse.intro_image_prompt = `${recipeTitle}: ${parsedResponse.intro_image_prompt}`;
          parsedResponse.ingredients_image_prompt = `Ingredients for ${recipeTitle}: ${parsedResponse.ingredients_image_prompt}`;
          parsedResponse.final_recipe_image_prompt = `Final dish - ${recipeTitle}: ${parsedResponse.final_recipe_image_prompt}`;
          
          // Ensure alt text fields exist, create them if they don't
          if (!parsedResponse.intro_image_alt_text) {
            parsedResponse.intro_image_alt_text = `${recipeTitle} served on an elegant plate with garnishes, showing the finished dish from a 45-degree angle with professional lighting.`;
          }
          
          if (!parsedResponse.ingredients_image_alt_text) {
            const ingredientsText = ingredientsList.length > 0 
              ? ingredientsList.slice(0, 3).join(', ') 
              : "fresh ingredients";
            parsedResponse.ingredients_image_alt_text = `${recipeTitle} ingredients including ${ingredientsText} arranged on a rustic wooden cutting board with natural lighting.`;
          }
          
          if (!parsedResponse.final_recipe_image_alt_text) {
            parsedResponse.final_recipe_image_alt_text = `Close-up of ${recipeTitle} with garnishes highlighting the texture and colors of this delicious dish ready to be served.`;
          }
          
          console.log('Generated image prompts:', parsedResponse);
          return parsedResponse;
        }
      }
      
      // If we couldn't parse JSON or it doesn't have the right structure, extract prompts manually
      const lines = response.split('\n').filter(line => line.trim().length > 0);
      const prompts = {
        intro_image_prompt: '',
        ingredients_image_prompt: '',
        final_recipe_image_prompt: ''
      };
      
      for (const line of lines) {
        if (line.toLowerCase().includes('intro') && !prompts.intro_image_prompt) {
          prompts.intro_image_prompt = line.split(':').slice(1).join(':').trim();
        } else if (line.toLowerCase().includes('ingredient') && !prompts.ingredients_image_prompt) {
          prompts.ingredients_image_prompt = line.split(':').slice(1).join(':').trim();
        } else if ((line.toLowerCase().includes('final') || line.toLowerCase().includes('dish')) && !prompts.final_recipe_image_prompt) {
          prompts.final_recipe_image_prompt = line.split(':').slice(1).join(':').trim();
        }
      }
      
      // Add recipe title to each prompt for better context
      if (prompts.intro_image_prompt) {
        prompts.intro_image_prompt = `${recipeTitle}: ${prompts.intro_image_prompt}`;
      } else {
        prompts.intro_image_prompt = `${recipeTitle}: A beautifully plated dish with professional food photography lighting, showing the finished recipe from a 45-degree angle on an elegant plate with garnishes.`;
      }
      
      if (prompts.ingredients_image_prompt) {
        prompts.ingredients_image_prompt = `Ingredients for ${recipeTitle}: ${prompts.ingredients_image_prompt}`;
      } else {
        const ingredientsText = ingredientsList.length > 0 
          ? ingredientsList.slice(0, 5).join(', ') 
          : "fresh ingredients";
        prompts.ingredients_image_prompt = `Ingredients for ${recipeTitle}: An artistic arrangement of ${ingredientsText} on a rustic wooden cutting board with natural lighting from the side.`;
      }
      
      if (prompts.final_recipe_image_prompt) {
        prompts.final_recipe_image_prompt = `Final dish - ${recipeTitle}: ${prompts.final_recipe_image_prompt}`;
      } else {
        prompts.final_recipe_image_prompt = `Final dish - ${recipeTitle}: A close-up shot of the completed dish with beautiful garnishes, steam rising, and perfect lighting to highlight the textures and colors.`;
      }
      
      // Generate alt text if not provided by the AI
      if (!prompts.intro_image_alt_text) {
        prompts.intro_image_alt_text = `Write a concise, SEO-optimized alt text (max 125 characters) for a recipe image. Include the focus keyword: '${focusKeyword}'. Describe the visual elements of the dish, including presentation, ingredients, and serving style. Focus on what someone would see in the photo and what would make it appealing to both users and search engines.`;
      }
      
      if (!prompts.ingredients_image_alt_text) {
        const ingredientsText = ingredientsList.length > 0 
          ? ingredientsList.slice(0, 3).join(', ') 
          : "fresh ingredients";
        prompts.ingredients_image_alt_text = `${recipeTitle} ingredients including ${ingredientsText} arranged on a rustic wooden cutting board with natural lighting.`;
      }
      
      if (!prompts.final_recipe_image_alt_text) {
        prompts.final_recipe_image_alt_text = `Close-up of ${recipeTitle} with garnishes highlighting the texture and colors of this delicious dish ready to be served.`;
      }
      
      console.log('Generated fallback image prompts:', prompts);
      return prompts;
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
      // Fallback to default prompts using the recipe title
      return {
        intro_image_prompt: `${recipeTitle}: A beautifully plated dish with professional food photography lighting, showing the finished recipe from a 45-degree angle on an elegant plate with garnishes.`,
        ingredients_image_prompt: `Ingredients for ${recipeTitle}: ${ingredientsList.length > 0 ? 'An artistic arrangement of ' + ingredientsList.slice(0, 5).join(', ') : 'Fresh ingredients'} on a rustic wooden cutting board with natural lighting from the side.`,
        final_recipe_image_prompt: `Final dish - ${recipeTitle}: A close-up shot of the completed dish with beautiful garnishes, steam rising, and perfect lighting to highlight the textures and colors.`
      };
    }
  } catch (error) {
    console.error('Error generating image prompts:', error);
    // Fallback to default prompts using the recipe title
    return {
      intro_image_prompt: `${recipeTitle}: A beautifully plated dish with professional food photography lighting, showing the finished recipe from a 45-degree angle on an elegant plate with garnishes.`,
      ingredients_image_prompt: `Ingredients for ${recipeTitle}: ${ingredientsList.length > 0 ? 'An artistic arrangement of ' + ingredientsList.slice(0, 5).join(', ') : 'Fresh ingredients'} on a rustic wooden cutting board with natural lighting from the side.`,
      final_recipe_image_prompt: `Final dish - ${recipeTitle}: A close-up shot of the completed dish with beautiful garnishes, steam rising, and perfect lighting to highlight the textures and colors.`,
      intro_image_alt_text: `${recipeTitle} served on an elegant plate with garnishes, showing the finished dish from a 45-degree angle with professional lighting.`,
      ingredients_image_alt_text: `${recipeTitle} ingredients including ${ingredientsList.length > 0 ? ingredientsList.slice(0, 3).join(', ') : 'fresh ingredients'} arranged on a rustic wooden cutting board with natural lighting.`,
      final_recipe_image_alt_text: `Close-up of ${recipeTitle} with garnishes highlighting the texture and colors of this delicious dish ready to be served.`
    };
  }
};
