'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { generateImage } from '@/services/imageGenerator'
import { generateImagePrompts, ImagePrompts } from '@/services/imagePromptGenerator'
import { convertToWebP } from '@/services/webp-converter'

interface ImagePlacerProps {
  articleContent: string
  onImagesGenerated?: (images: { [key: string]: string }) => void
  onError?: (error: string) => void
  onGenerationStart?: () => void
  onGenerationComplete?: () => void
}

export const ImagePlacer: React.FC<ImagePlacerProps> = ({
  articleContent,
  onImagesGenerated,
  onError,
  onGenerationStart,
  onGenerationComplete
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false)

  // Get the preferred image service from localStorage
  const getPreferredImageService = useCallback((): 'stability' | 'leonardo' => {
    try {
      const savedService = localStorage.getItem('preferredImageService')
      if (savedService === 'leonardo') return 'leonardo'
    } catch (e) {
      console.error("Failed to get preferred image service:", e)
    }
    return 'stability' // Default to Stability AI
  }, [])

  const generateAndPlaceImages = useCallback(async (modelId?: string, apiKey?: string) => {
    if (!articleContent || isGenerating) return

    setIsGenerating(true)
    if (onGenerationStart) onGenerationStart()

    try {
      // Generate image prompts from article content
      const imagePrompts = await generateImagePrompts(articleContent, modelId, apiKey)

      // Generate images and convert to WebP before displaying
      const generatedImages: { [key: string]: string } = {}

      for (const [key, prompt] of Object.entries(imagePrompts)) {
        try {
          // Generate original image
          const imageUrl = await generateImage(prompt, {
            service: getPreferredImageService()
          })

          if (imageUrl) {
            try {
              // Convert the generated image to WebP format
              const webpUrl = await convertToWebP(imageUrl)
              generatedImages[key] = webpUrl
              console.log(`Successfully converted ${key} to WebP`)
            } catch (conversionError) {
              console.error(`Failed to convert ${key} to WebP:`, conversionError)
              // Fallback to original URL if conversion fails
              generatedImages[key] = imageUrl
            }
          } else {
            console.warn(`No image URL returned for ${key}`)
          }
        } catch (error) {
          console.error(`Failed to generate ${key}:`, error)
        }
      }

      // Only after all images are converted, display them
      if (Object.keys(generatedImages).length > 0) {
        if (onImagesGenerated) onImagesGenerated(generatedImages)
        console.log('All images generated and converted to WebP successfully')
      }
    } catch (error) {
      if (onError) onError(error instanceof Error ? error.message : 'Image generation failed')
    } finally {
      setIsGenerating(false)
      if (onGenerationComplete) onGenerationComplete()
    }
  }, [articleContent, isGenerating, onError, onGenerationComplete, onGenerationStart, onImagesGenerated, getPreferredImageService])

  // Expose the generate function to be called externally
  useEffect(() => {
    // Expose the function to the window object for external access
    ;(window as any).generateBlogImages = (modelId?: string, apiKey?: string) =>
      generateAndPlaceImages(modelId, apiKey)

    // Cleanup function to remove the reference when component unmounts
    return () => {
      delete (window as any).generateBlogImages
    }
  }, [generateAndPlaceImages])

  return null // This is a utility component that doesn't render anything
}