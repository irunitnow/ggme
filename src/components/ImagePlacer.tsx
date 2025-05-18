import React, { useEffect, useState, useCallback } from 'react';
import { generateImage } from '../services/imageGenerator';
import { generateImagePrompts, ImagePrompts } from '../services/imagePromptGenerator';

interface ImagePlacerProps {
  articleContent: string;
  onImagesGenerated?: (images: { [key: string]: string }) => void;
  onError?: (error: string) => void;
  onGenerationStart?: () => void;
  onGenerationComplete?: () => void;
}

export const ImagePlacer: React.FC<ImagePlacerProps> = ({
  articleContent,
  onImagesGenerated,
  onError,
  onGenerationStart,
  onGenerationComplete
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Get the preferred image service from localStorage
  const getPreferredImageService = useCallback((): 'stability' | 'leonardo' => {
    try {
      const savedService = localStorage.getItem('preferredImageService');
      if (savedService === 'leonardo') return 'leonardo';
    } catch (e) {
      console.error("Failed to get preferred image service:", e);
    }
    return 'stability'; // Default to Stability AI
  }, []);

  const generateAndPlaceImages = useCallback(async (modelId?: string, apiKey?: string) => {
    if (!articleContent || isGenerating) return;
    
    setIsGenerating(true);
    if (onGenerationStart) onGenerationStart();
    
    // Helper function to place image after an element
    const placeImageAfterElement = (element: Element, imageUrl: string, className: string) => {
      // Find the Tiptap editor instance
      const editorContent = document.querySelector('.tiptap-editor .ProseMirror');
      if (!editorContent || !(editorContent as any).editor) {
        throw new Error('Could not find Tiptap editor instance');
      }
      
      const editor = (editorContent as any).editor;
      
      // Remove any existing image with the same class name
      const existingImage = document.querySelector(`.${className}`);
      if (existingImage) {
        existingImage.remove();
      }
      
      // Find the position after the target element
      const pos = editor.view.posAtDOM(element, 0);
      if (pos === undefined) {
        throw new Error('Could not find position for image placement');
      }
      
      // Find the end of the current block
      const $pos = editor.state.doc.resolve(pos);
      const end = $pos.end();
      
      // Insert the image at the end of the block
      editor
        .chain()
        .focus()
        .setTextSelection(end)
        .insertContent(`<p><img src="${imageUrl}" alt="${className.replace('-image', '')} illustration" class="generated-image ${className}" /></p>`)
        .run();
      
      console.log(`Placed ${className} after:`, element);
    };
    
    try {
      console.log(`Starting image generation with model: ${modelId || 'default'}`);
      
      // Generate image prompts from article content using the specified model
      const prompts: ImagePrompts = await generateImagePrompts(
        articleContent,
        modelId,
        apiKey
      );
      
      console.log('Generated image prompts:', prompts);
      
      // Get the selected image service
      const imageService = getPreferredImageService();
      console.log(`Using image service: ${imageService}`);
      
      // Generate images for each section
      const images: {[key: string]: string} = {};
      
      // Find the editor content area - specifically targeting TipTap editor
      const editorContent = document.querySelector('.tiptap-editor .ProseMirror') || 
                           document.querySelector('.tiptap-editor') ||
                           document.querySelector('.ProseMirror') || 
                           document.querySelector('.editor-content');
      
      if (!editorContent) {
        throw new Error('Could not find editor content area. Make sure your article has been generated.');
      }
      
      console.log('Found editor content:', editorContent);
      
      // Find appropriate sections for image placement
      // For intro image - find the second h2 heading for recipe articles
      const h2Headings = Array.from(editorContent.querySelectorAll('h2'));
      const introSection = h2Headings.length >= 2 ? h2Headings[1] : // Use second h2 if available
                          editorContent.querySelector('h1, h2') || // Fallback to first heading
                          editorContent.querySelector('p'); // Last resort: first paragraph
      
      // For ingredients image - find the first unordered list or a paragraph containing "ingredients"
      const allParagraphs = editorContent.querySelectorAll('p');
      let ingredientsSection: Element | null = editorContent.querySelector('ul');
      
      if (!ingredientsSection) {
        // Look for a paragraph that might contain ingredients
        for (let i = 0; i < allParagraphs.length; i++) {
          if (allParagraphs[i].textContent?.toLowerCase().includes('ingredient')) {
            ingredientsSection = allParagraphs[i];
            break;
          }
        }
        
        // If still not found, use the paragraph at 1/3 of the way through
        if (!ingredientsSection && allParagraphs.length > 3) {
          ingredientsSection = allParagraphs[Math.floor(allParagraphs.length / 3)];
        }
      }
      
      // For recipe image - find the first ordered list or a paragraph containing "instructions" or "directions"
      let recipeSection: Element | null = editorContent.querySelector('ol');
      
      if (!recipeSection) {
        // Look for a paragraph that might contain recipe instructions
        for (let i = 0; i < allParagraphs.length; i++) {
          const text = allParagraphs[i].textContent?.toLowerCase() || '';
          if (text.includes('instruction') || text.includes('direction') || text.includes('step')) {
            recipeSection = allParagraphs[i];
            break;
          }
        }
        
        // If still not found, use the paragraph at 2/3 of the way through
        if (!recipeSection && allParagraphs.length > 3) {
          recipeSection = allParagraphs[Math.floor(allParagraphs.length * 2 / 3)];
        }
      }
      
      console.log('Found sections for image placement:', {
        intro: !!introSection,
        ingredients: !!ingredientsSection,
        recipe: !!recipeSection
      });
      
      // Generate and place images sequentially
      if (introSection) {
        console.log('Generating intro image...');
        try {
          images.intro = await generateImage(prompts.intro_image_prompt, { service: imageService });
          placeImageAfterElement(introSection, images.intro, 'intro-image');
          console.log('Intro image placed successfully');
        } catch (error) {
          console.error('Failed to generate intro image:', error);
        }
      }
      
      if (ingredientsSection) {
        console.log('Generating ingredients image...');
        try {
          images.ingredients = await generateImage(prompts.ingredients_image_prompt, { service: imageService });
          placeImageAfterElement(ingredientsSection, images.ingredients, 'ingredients-image');
          console.log('Ingredients image placed successfully');
        } catch (error) {
          console.error('Failed to generate ingredients image:', error);
        }
      }
      
      if (recipeSection) {
        console.log('Generating recipe image...');
        try {
          images.recipe = await generateImage(prompts.final_recipe_image_prompt, { service: imageService });
          placeImageAfterElement(recipeSection, images.recipe, 'recipe-image');
          console.log('Recipe image placed successfully');
        } catch (error) {
          console.error('Failed to generate recipe image:', error);
        }
      }
      
      // Notify parent component if callback provided
      if (onImagesGenerated) {
        onImagesGenerated(images);
      }
    } catch (error: any) {
      console.error("Failed to generate and place images:", error);
      if (onError) onError(error.message || 'Failed to generate images');
    } finally {
      setIsGenerating(false);
      if (onGenerationComplete) onGenerationComplete();
    }
  }, [articleContent, isGenerating, onGenerationStart, onImagesGenerated, onError, onGenerationComplete, getPreferredImageService]);
  
  // Expose the generate function to be called externally
  useEffect(() => {
    // Expose the function to the window object for external access
    (window as any).generateBlogImages = (modelId?: string, apiKey?: string) => 
      generateAndPlaceImages(modelId, apiKey);
    
    // Cleanup function to remove the reference when component unmounts
    return () => {
      delete (window as any).generateBlogImages;
    };
  }, [articleContent, generateAndPlaceImages]); // Include generateAndPlaceImages in dependencies

  return null; // This is a utility component that doesn't render anything
};
