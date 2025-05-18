import { ImagePrompts } from './imagePromptGenerator';

export interface ImageGenerationConfig {
  size?: string;
  style?: string;
  apiKey?: string;
  service?: 'stability' | 'leonardo';
}

interface ImageGenerationKeys {
  stabilityAi?: string;
  leonardoAi?: string;
}

// Helper function to get API keys from localStorage
const getApiKeys = (): ImageGenerationKeys => {
  // Try to get from localStorage first
  const savedKeysJson = localStorage.getItem('apiKeys');
  if (savedKeysJson) {
    try {
      const savedKeys = JSON.parse(savedKeysJson);
      return {
        stabilityAi: savedKeys?.stabilityAi || '',
        leonardoAi: savedKeys?.leonardoAi || ''
      };
    } catch (e) {
      console.error("Failed to parse saved API keys:", e);
    }
  }
  return { stabilityAi: '', leonardoAi: '' };
};



// Function to generate images with Stability AI
export const generateStabilityImage = async (
  prompt: string,
  apiKey: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error('Stability AI API key is missing');
  }

  console.log('Generating image with Stability AI using prompt:', prompt.substring(0, 100) + '...');

  try {
    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: prompt,
            weight: 1,
          },
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stability AI API error:', errorText);
      throw new Error(`Stability AI API error: ${response.status} - ${errorText}`);
    }

    const responseJSON = await response.json();
    if (!responseJSON.artifacts || !responseJSON.artifacts[0] || !responseJSON.artifacts[0].base64) {
      console.error('Invalid response from Stability AI:', JSON.stringify(responseJSON).substring(0, 200) + '...');
      throw new Error('Invalid response format from Stability AI');
    }
    
    const base64Image = responseJSON.artifacts[0].base64;
    // Create a blob URL instead of a data URL for better performance
    const byteCharacters = atob(base64Image);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    const blob = new Blob(byteArrays, {type: 'image/png'});
    const imageUrl = URL.createObjectURL(blob);
    
    console.log('Successfully generated image with Stability AI');
    return imageUrl;
  } catch (error) {
    console.error('Error generating image with Stability AI:', error);
    throw error;
  }
};

// Function to generate an image using Leonardo AI
export const generateLeonardoImage = async (prompt: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error('Leonardo AI API key is missing');
  }

  console.log('Generating image with Leonardo AI using prompt:', prompt.substring(0, 100) + '...');

  try {
    // Step 1: Create a generation request
    const createResponse = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        modelId: "1e7737d7-545e-469f-857f-e4b46eaa151d", // SD XL model
        width: 1024,
        height: 1024,
        num_images: 1,
        promptMagic: true,
        alchemy: true, // Enable alchemy for better results
        contrastRatio: 0.5, // Balanced contrast
        guidanceScale: 7, // Standard guidance scale
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Leonardo AI API error (create):', errorText);
      throw new Error(`Leonardo AI API error: ${createResponse.status} - ${errorText}`);
    }

    const createData = await createResponse.json();
    if (!createData.sdGenerationJob || !createData.sdGenerationJob.generationId) {
      console.error('Invalid response from Leonardo AI (create):', JSON.stringify(createData).substring(0, 200) + '...');
      throw new Error('Invalid response format from Leonardo AI');
    }
    
    const generationId = createData.sdGenerationJob.generationId;
    console.log('Leonardo AI generation job created with ID:', generationId);

    // Step 2: Poll for the generation result
    let imageUrl = '';
    let attempts = 0;
    const maxAttempts = 30; // Maximum number of polling attempts

    while (!imageUrl && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
      console.log(`Polling Leonardo AI for results (attempt ${attempts}/${maxAttempts})...`);

      const statusResponse = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Leonardo AI API error (status):', errorText);
        throw new Error(`Failed to check generation status: ${statusResponse.status} - ${errorText}`);
      }

      const statusData = await statusResponse.json();

      if (statusData.generations_by_pk && statusData.generations_by_pk.status === 'COMPLETE') {
        if (statusData.generations_by_pk.generated_images && statusData.generations_by_pk.generated_images.length > 0) {
          imageUrl = statusData.generations_by_pk.generated_images[0].url;
          console.log('Leonardo AI image generation complete, URL:', imageUrl.substring(0, 50) + '...');
        } else {
          console.error('No images were generated by Leonardo AI');
          throw new Error('No images were generated by Leonardo AI');
        }
      } else if (statusData.generations_by_pk && statusData.generations_by_pk.status === 'FAILED') {
        console.error('Leonardo AI image generation failed:', statusData.generations_by_pk);
        throw new Error('Leonardo AI image generation failed');
      } else {
        console.log(`Leonardo AI generation status: ${statusData.generations_by_pk ? statusData.generations_by_pk.status : 'unknown'}`);
      }
    }

    if (!imageUrl) {
      console.error('Leonardo AI image generation timed out after', maxAttempts, 'attempts');
      throw new Error('Leonardo AI image generation timed out');
    }

    return imageUrl;
  } catch (error) {
    console.error('Error generating image with Leonardo AI:', error);
    throw error;
  }
};

// Main function to generate images
export const generateImage = async (
  promptText: string,
  config: ImageGenerationConfig = {}
): Promise<string> => {
  try {
    // Use the service from config or default to stability
    const { service = 'stability' } = config;
    
    // Get API keys
    const keys = getApiKeys();
    
    // Generate image with the selected service
    if (service === 'stability') {
      return await generateStabilityImage(promptText, keys.stabilityAi || '');
    } else if (service === 'leonardo') {
      return await generateLeonardoImage(promptText, keys.leonardoAi || '');
    } else {
      throw new Error(`Unknown image generation service: ${service}`);
    }
  } catch (error) {
    console.error("Failed to generate image:", error);
    throw error;
  }
};

// Function to generate blog images
export const generateBlogImages = async (
  prompts: ImagePrompts,
  apiKey: string,
  apiType: 'stability' | 'leonardo' = 'stability'
): Promise<{ [key: string]: string }> => {
  const images: { [key: string]: string } = {};
  console.log('Starting blog image generation with API type:', apiType);

  try {
    // Generate intro image
    if (prompts.intro_image_prompt) {
      console.log('Generating intro image...');
      try {
        images.intro = await (apiType === 'stability' 
          ? generateStabilityImage(prompts.intro_image_prompt, apiKey)
          : generateLeonardoImage(prompts.intro_image_prompt, apiKey));
        console.log('Intro image generated successfully');
      } catch (error) {
        console.error('Error generating intro image:', error);
        // Continue with other images even if one fails
      }
    }

    // Generate ingredients image
    if (prompts.ingredients_image_prompt) {
      console.log('Generating ingredients image...');
      try {
        images.ingredients = await (apiType === 'stability' 
          ? generateStabilityImage(prompts.ingredients_image_prompt, apiKey)
          : generateLeonardoImage(prompts.ingredients_image_prompt, apiKey));
        console.log('Ingredients image generated successfully');
      } catch (error) {
        console.error('Error generating ingredients image:', error);
        // Continue with other images even if one fails
      }
    }

    // Generate recipe image
    if (prompts.final_recipe_image_prompt) {
      console.log('Generating recipe image...');
      try {
        images.recipe = await (apiType === 'stability' 
          ? generateStabilityImage(prompts.final_recipe_image_prompt, apiKey)
          : generateLeonardoImage(prompts.final_recipe_image_prompt, apiKey));
        console.log('Recipe image generated successfully');
      } catch (error) {
        console.error('Error generating recipe image:', error);
        // Continue with other images even if one fails
      }
    }

    // Check if we generated at least one image
    if (Object.keys(images).length === 0) {
      throw new Error('Failed to generate any images');
    }

    console.log(`Successfully generated ${Object.keys(images).length} images`);
    return images;
  } catch (error) {
    console.error('Error generating blog images:', error);
    throw error;
  }
};
