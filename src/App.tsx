import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import axios from 'axios';
import { STEP_1_PROMPT_TEMPLATE } from './step1Prompt';
import { STEP_2_PROMPT_TEMPLATE } from './step2Prompt'; // Medium
import { STEP_3_PROMPT_TEMPLATE } from './step3Prompt'; // Hard
import { STEP_4_MASTER_PROMPT_TEMPLATE } from './step4MasterPrompt'; // Master
import { STEP_5_PROMPT_TEMPLATE } from './step5Prompt'; // High (Added)
import { RECIPE_ARTICLE_PROMPT_TEMPLATE } from './recipeArticlePrompt'; // Recipe Article Flow 1
import { RECIPE_ARTICLE_FLOW2_PROMPT_TEMPLATE } from './recipeArticleFlow2Prompt'; // Recipe Article Flow 2
import { FLOW3_EXTERNAL_LINK_INSERTION_PROMPT } from './flow3ExternalLinkPrompt'; // Flow 3 for external links
import { ImagePlacer } from './components/ImagePlacer';
import './App.css'; // We'll add styles later
import { generateImage as generateAIImage } from './services/imageGenerator';
import { generateImagePrompts } from './services/imagePromptGenerator';

// Shared alt text prompt template to ensure consistency
export const SHARED_ALT_TEXT_PROMPT = `Write a concise, SEO-optimized alt text (max 125 characters) for a recipe image. Include the focus keyword: '{focusKeyword}'. Describe the visual elements of the dish, including presentation, ingredients, and serving style. Focus on what someone would see in the photo and what would make it appealing to both users and search engines.`;

// Function to get the blog post content from the editor
export function getBlogPostContent(editor: any): string {
  return editor ? editor.getHTML() : '';
}

// Define the structure for API keys - Now includes image generation APIs
interface ApiKeys {
  openRouter: string;
  stabilityAi: string;
  leonardoAi: string;
}
// Helper to get or create tag IDs from tag names
async function getTagIds(tagNames: string[], wordpressSettings: WordPressSettings, authHeader: string) {
  const tagIds: number[] = [];
  for (const name of tagNames) {
    // 1. Try to find the tag
    const searchRes = await axios.get(
      `${wordpressSettings.url}/wp-json/wp/v2/tags?search=${encodeURIComponent(name)}`,
      { headers: { 'Authorization': authHeader } }
    );
    if (searchRes.data.length > 0) {
      tagIds.push(searchRes.data[0].id);
    } else {
      // 2. Create the tag if it doesn't exist
      const createRes = await axios.post(
        `${wordpressSettings.url}/wp-json/wp/v2/tags`,
        { name },
        { headers: { 'Authorization': authHeader } }
      );
      tagIds.push(createRes.data.id);
    }
  }
  return tagIds;
}

// Define WordPress connection settings
interface WordPressSettings {
  url: string;
  username: string;
  password: string;
  isConnected: boolean;
}

// Define the available models, including the specific DeepSeek ones
const models = [
  { id: 'openrouter/auto', name: 'OpenRouter: Auto (best for prompt)' },
  { id: 'openai/gpt-4-turbo', name: 'OpenAI: GPT-4 Turbo' },
  { id: 'openai/gpt-3.5-turbo', name: 'OpenAI: GPT-3.5 Turbo' },
  { id: 'anthropic/claude-3-opus', name: 'Claude: Claude 3 Opus' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude: Claude 3 Sonnet' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude: Claude 3 Haiku' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek: DeepSeek V3' },
  { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek: DeepSeek V3 (free)' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek: R1' },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek: R1 (free)' },
  { id: 'deepseek/deepseek-r1-distill-llama-70b', name: 'DeepSeek: R1 Distill Llama 70B' },
  { id: 'deepseek/deepseek-r1-distill-llama-70b:free', name: 'DeepSeek: R1 Distill Llama 70B (free)' },
  { id: 'deepseek/deepseek-r1-distill-qwen-14b', name: 'DeepSeek: R1 Distill Qwen 14B' },
  { id: 'deepseek/deepseek-r1-distill-qwen-14b:free', name: 'DeepSeek: R1 Distill Qwen 14B (free)' },
  { id: 'deepseek/deepseek-r1-distill-qwen-1.5b', name: 'DeepSeek: R1 Distill Qwen 1.5B' },
  { id: 'deepseek/deepseek-r1-distill-qwen-32b', name: 'DeepSeek: R1 Distill Qwen 32B' },
  { id: 'deepseek/deepseek-r1-distill-qwen-32b:free', name: 'DeepSeek: R1 Distill Qwen 32B (free)' },
  { id: 'deepseek/deepseek-r1-zero:free', name: 'DeepSeek: DeepSeek R1 Zero (free)' },
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek: DeepSeek V3 0324 (free)' },
  { id: 'deepseek/deepseek-v3-base:free', name: 'DeepSeek: DeepSeek V3 Base (free)' },
  { id: 'meta-llama/llama-4-maverick', name: 'Meta: Llama 4 Maverick' },
{ id: 'meta-llama/llama-4-maverick:free', name: 'Meta: Llama 4 Maverick (free)' },
{ id: 'google/gemini-2.5-pro-preview-03-25', name: 'Google: Gemini 2.5 Pro Preview' },
{ id: 'google/gemini-pro-1.5', name: 'Google: Gemini 1.5 Pro' },
{ id: 'qwen/qwq-32b:free', name: 'Qwen: QwQ 32B (free)' },
{ id: 'qwen/qwq-32b', name: 'Qwen: QwQ 32B' },
{ id: 'qwen/qwen-vl-max', name: 'Qwen: Qwen VL Max' }
];

// Filter models for the second dropdown (must be DeepSeek)
const deepSeekModels = models.filter(model => model.id.startsWith('deepseek/'));

// Define available image generation services
const imageGenerationServices = [
  { id: 'stability', name: 'Stability AI' },
  { id: 'leonardo', name: 'Leonardo AI' }
];

function App() {
  // Store all API keys
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ 
    openRouter: '', 
    stabilityAi: '',
    leonardoAi: ''
  });
  
  // State for image generation
  const [isGeneratingBlogImages, setIsGeneratingBlogImages] = useState<boolean>(false);
  const [blogImageError, setBlogImageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedImageService, setSelectedImageService] = useState<string>(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem('preferredImageService');
    return saved || 'stability'; // Default to Stability AI
  });
  // State for storing image alt texts
  const [blogImageAltTexts, setBlogImageAltTexts] = useState<{[key: string]: string}>({});
  // State for storing external links from Flow 1
  const [externalLinks, setExternalLinks] = useState<string[]>([]);
  // State for two models
  const [selectedModel1, setSelectedModel1] = useState<string>(models[0].id); // Default to first model
  const [selectedModel2, setSelectedModel2] = useState<string>(deepSeekModels[0]?.id || ''); // Default to first DeepSeek model or empty if none
  const [recipeTitle, setRecipeTitle] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('medium'); // Default to medium
  const [focusKeyword, setFocusKeyword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state for main generation
  const [isInsertingLinks, setIsInsertingLinks] = useState<boolean>(false); // Loading state for external link insertion
  const [error, setError] = useState<string | null>(null);
  const [isSidebarContentVisible, setIsSidebarContentVisible] = useState<boolean>(false); // Controls sidebar section visibility
  const [generatedTitles, setGeneratedTitles] = useState<{ text: string; score: number }[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [generatedMetaDescriptions, setGeneratedMetaDescriptions] = useState<string[]>([]);
  const [selectedMetaDescription, setSelectedMetaDescription] = useState<string | null>(null);
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const [isGeneratingSidebarContent, setIsGeneratingSidebarContent] = useState<boolean>(false); // Loading state for sidebar tasks
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('seo'); // 'seo', 'image', 'settings', 'wordpress'
  
  // WebP conversion states
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionStep, setConversionStep] = useState<string>('');
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  
  // WordPress connection states
  const [wordpressSettings, setWordpressSettings] = useState<WordPressSettings>({
    url: '',
    username: '',
    password: '',
    isConnected: false
  });
  const [wpCategories, setWpCategories] = useState<{id: number, name: string, count: number}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [postStatus, setPostStatus] = useState<string>('draft'); // 'draft' or 'publish'
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [publishingResult, setPublishingResult] = useState<{success: boolean, message: string, link?: string} | null>(null);
  const [publishOptions, setPublishOptions] = useState({
    includeTitle: true,
    includeFocusKeyword: true,
    includeSlug: true,
    includeMetaDescription: true,
    includeFeaturedImage: true,
    includeTags: true
  });
  
  // Load settings from localStorage on initial render
  useEffect(() => {
    const savedKeysJson = localStorage.getItem('apiKeys');
    // Load model selections
    const savedModel1 = localStorage.getItem('selectedModel1');
    const savedModel2 = localStorage.getItem('selectedModel2');

    if (savedKeysJson) {
      try {
        const savedKeys = JSON.parse(savedKeysJson);
        // Ensure only openRouter key is loaded, even if old format exists
        setApiKeys({ 
          openRouter: savedKeys?.openRouter || '', 
          stabilityAi: savedKeys?.stabilityAi || '',
          leonardoAi: savedKeys?.leonardoAi || ''
        });
      } catch (e) {
        console.error("Failed to parse saved API keys:", e);
        setApiKeys({ 
          openRouter: '', 
          stabilityAi: '',
          leonardoAi: ''
        }); // Reset if parsing fails
      }
    }
    // Set loaded models, falling back to defaults if not found or invalid
    setSelectedModel1(savedModel1 || models[0].id);
    // Ensure loaded model 2 is actually a deepseek model, otherwise default
    if (savedModel2 && deepSeekModels.some(m => m.id === savedModel2)) {
        setSelectedModel2(savedModel2);
    } else {
        setSelectedModel2(deepSeekModels[0]?.id || ''); // Default to first deepseek or empty
    }
  }, []); // Empty dependency array means this runs only once on mount

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  // Save selected models to localStorage
  useEffect(() => {
    localStorage.setItem('selectedModel1', selectedModel1);
  }, [selectedModel1]);

  useEffect(() => {
    localStorage.setItem('selectedModel2', selectedModel2);
  }, [selectedModel2]);

  // Load WordPress settings from localStorage on initial render
  useEffect(() => {
    const savedWpSettings = localStorage.getItem('wordpressSettings');
    if (savedWpSettings) {
      try {
        const parsedSettings = JSON.parse(savedWpSettings);
        setWordpressSettings(parsedSettings);
      } catch (e) {
        console.error('Failed to parse saved WordPress settings:', e);
      }
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image.configure({
        inline: true,
        allowBase64: true
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline
    ],
    content: '<p>Your generated blog post will appear here...</p>',
    editable: false, // Start as non-editable
  });

  // --- Sidebar Content Generation Functions --- (Moved after editor initialization)
  // Now using Flow 1 output from the primary model for SEO data
  
  // Handle selecting a meta description
  const handleSelectMetaDescription = (desc: string) => {
    setSelectedMetaDescription(desc);
  };

  // Handle cleaning meta descriptions
  const handleCleanMetaDescriptions = (metaDescriptions: string[]) => {
    if (selectedMetaDescription) {
      return metaDescriptions.filter(d => d === selectedMetaDescription);
    }
    return metaDescriptions;
  };
  
  // Note: generateInitialMetaDescriptions and extractKeywords functions have been removed
  // as they are no longer needed. SEO data is now extracted from Flow 1 output. in the handleGenerate function

  const handleSelectTitle = (titleText: string) => {
    setSelectedTitle(titleText);
  };

  const handleCleanTitles = () => {
    if (selectedTitle) {
      setGeneratedTitles(prev => prev.filter(t => t.text === selectedTitle));
    } else {
      // Optional: Show a message asking the user to select a title first
      console.warn("No title selected to clean.");
    }
  };

  const generateInitialMetaDescriptions = useCallback(async () => {
    if (!editor || !apiKeys.openRouter || !selectedModel2) return; // Use selectedModel2
    setIsGeneratingSidebarContent(true);
    setError(null);

    const blogContent = editor.getText();
    if (!blogContent || blogContent.length < 50) {
        console.warn("Not enough content to generate meta descriptions.");
        setIsGeneratingSidebarContent(false);
        return;
    }
    const context = blogContent.substring(0, 1500); // Slightly less context might be needed
    const titleToUse = selectedTitle || generatedTitles[0]?.text || recipeTitle; // Use selected/first generated/original title

    const prompt = `Based on the following blog post content about "${titleToUse}" with focus keyword "${focusKeyword}", generate exactly two concise and compelling SEO-friendly meta descriptions (max 160 characters each). Output *only* the descriptions, each on a new line, with no extra text, numbering, or quotes.

Blog Post Context:
---
${context}
---

Meta Descriptions:`;

    try {
        console.log("Generating initial meta descriptions using model:", selectedModel2); // Use selectedModel2
        const response = await callApiModel(prompt, selectedModel2, apiKeys); // Use selectedModel2
        const descriptions = response.split('\n').map(d => d.trim()).filter(d => d.length > 0 && d.length <= 160); // Filter by length
        setGeneratedMetaDescriptions(descriptions.slice(0, 2));
        console.log("Generated meta descriptions:", descriptions);
    } catch (err: any) {
        console.error("Error generating meta descriptions:", err);
        setError(`Error generating meta descriptions: ${err.message || 'Unknown error'}`);
    } finally {
        setIsGeneratingSidebarContent(false);
    }
  }, [editor, apiKeys, selectedModel2, recipeTitle, focusKeyword, selectedTitle, generatedTitles]); // Updated dependencies

  const generateAdditionalMetaDescription = useCallback(async () => {
    if (!editor || !apiKeys.openRouter || !selectedModel2 || generatedMetaDescriptions.length >= 3) return; // Use selectedModel2
    setIsGeneratingSidebarContent(true);
    setError(null);

    const blogContent = editor.getText();
     if (!blogContent || blogContent.length < 50) {
        console.warn("Not enough content to generate additional meta description.");
        setIsGeneratingSidebarContent(false);
        return;
    }
    const context = blogContent.substring(0, 1500);
    const titleToUse = selectedTitle || generatedTitles[0]?.text || recipeTitle;
    const existingDescriptions = generatedMetaDescriptions.map(d => `- ${d}`).join('\n');

    const prompt = `Based on the following blog post content about "${titleToUse}" with focus keyword "${focusKeyword}", generate one more concise and compelling SEO-friendly meta description (max 160 characters) that is distinct from the existing ones provided below. Output *only* the new description on a single line, with no extra text, numbering, or quotes.

Blog Post Context:
---
${context}
---

Existing Descriptions (do not repeat):
${existingDescriptions}
---

New Meta Description:`;

     try {
        console.log("Generating additional meta description using model:", selectedModel2); // Use selectedModel2
        const response = await callApiModel(prompt, selectedModel2, apiKeys); // Use selectedModel2
        const newDescription = response.trim();
        if (newDescription && newDescription.length <= 160 && !generatedMetaDescriptions.includes(newDescription)) {
            setGeneratedMetaDescriptions(prev => [...prev, newDescription]);
            console.log("Generated additional meta description:", newDescription);
        } else {
             console.warn("Generated meta description was empty, too long, or a duplicate.");
        }
    } catch (err: any) {
        console.error("Error generating additional meta description:", err);
        setError(`Error generating meta description: ${err.message || 'Unknown error'}`);
    } finally {
        setIsGeneratingSidebarContent(false);
    }
  }, [editor, apiKeys, selectedModel2, recipeTitle, focusKeyword, selectedTitle, generatedTitles, generatedMetaDescriptions]); // Updated dependencies

  // Function to extract keywords from the generated content
  const extractKeywords = useCallback(async () => {
    if (!editor || !apiKeys.openRouter || !selectedModel1) return;
    setIsGeneratingSidebarContent(true);
    setError(null);
    
    try {
      const content = editor.getText();
      if (!content || content.length < 50) {
        console.warn("Not enough content to extract keywords.");
        setIsGeneratingSidebarContent(false);
        return;
      }
      
      let keywords: string[] = [];
      let extractedKeywords: string[] = [];
      
      // Extract keywords from the content
      const keywordMatches = content.match(/Keywords:([^\n]+)/i);
      if (keywordMatches && keywordMatches[1]) {
        const keywordText = keywordMatches[1].trim();
        extractedKeywords = keywordText.split(',').map(k => k.trim());
        console.log('Extracted keywords from content:', extractedKeywords);
      } else {
        // Try other patterns
        const tableMatches = content.match(/\|\s*Keywords\s*\|([^\|]+)\|/i);
        if (tableMatches && tableMatches[1]) {
          extractedKeywords = tableMatches[1].trim().split(',').map(k => k.trim());
          console.log('Extracted keywords from table:', extractedKeywords);
        } else {
          // Try pattern 3: Look for sections with "Keywords:" followed by a list
          const sections = content.split('\n\n');
          for (const section of sections) {
            if (section.toLowerCase().includes('keywords:')) {
              const parts = section.split(':');
              if (parts.length > 1) {
                const rowKeywords = parts[1].trim().split(',').map(k => k.trim());
                extractedKeywords.push(...rowKeywords);
              }
            }
          }
          
          if (extractedKeywords.length > 0) {
            keywords = extractedKeywords.filter(k => 
              k.length > 0 && 
              k.toLowerCase() !== 'keywords' && 
              k.toLowerCase() !== 'cluster name'
            );
            console.log('Extracted keywords using pattern 3:', keywords);
          }
        }
      }
      
      // If we found keywords, save them
      if (keywords.length > 0) {
        setExtractedKeywords(keywords);
        console.log('Final extracted SEO keywords:', keywords);
      } else {
        // If we still don't have keywords, create default ones
        const defaultKeywords = [focusKeyword, recipeTitle, `${recipeTitle} recipe`, `how to make ${recipeTitle}`, `best ${focusKeyword} recipe`];
        setExtractedKeywords(defaultKeywords);
        console.log('Using default keywords:', defaultKeywords);
      }
    } catch (err: any) {
      console.error('Error extracting keywords:', err);
      setError(`Error extracting keywords: ${err.message || 'Unknown error'}`);
      
      // Create default keywords if extraction fails
      const defaultKeywords = [focusKeyword, recipeTitle, `${recipeTitle} recipe`, `how to make ${recipeTitle}`, `best ${focusKeyword} recipe`];
      setExtractedKeywords(defaultKeywords);
      console.log('Using default keywords due to error:', defaultKeywords);
    } finally {
      setIsGeneratingSidebarContent(false);
    }
  }, [editor, apiKeys, selectedModel1, recipeTitle, focusKeyword]); // Updated dependencies

  const handleCopyKeywords = () => {
    if (extractedKeywords.length > 0) {
      const keywordString = extractedKeywords.join(', ');
      navigator.clipboard.writeText(keywordString)
        .then(() => {
          // Optional: Show a temporary success message
          console.log('Keywords copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy keywords: ', err);
          setError('Failed to copy keywords to clipboard.');
        });
    }
  };
  
  // Function to handle external link insertion using Flow 3
  const handleInsertExternalLinks = async () => {
    // Check for editor and prevent duplicate operations
    if (!editor) {
      setError('No content available to insert links into.');
      return;
    }

    if (isInsertingLinks) {
      setError('Already inserting links, please wait...');
      return;
    }

    setIsInsertingLinks(true);
    setError('');

    // Define default links once at the beginning of the function
    const defaultLinks = [
      'https://www.seriouseats.com/cooking-techniques',
      'https://www.foodnetwork.com/recipes'
    ];

    // Link validation function
    const safeLink = (link: string): string => {
      if (!link) return defaultLinks[0];
      
      // Clean the URL by removing trailing parentheses and slashes
      let cleanLink = link.trim();
      
      // Remove trailing parenthesis patterns like ")/" or ")" at the end of URLs
      cleanLink = cleanLink.replace(/\)[/]*$/, '');
      
      // Also remove any other common problematic characters at the end
      cleanLink = cleanLink.replace(/[.,;:!?'")]$/, '');
      
      try {
        const url = new URL(cleanLink);
        return url.protocol.startsWith('http') ? cleanLink : defaultLinks[0];
      } catch {
        // If there's a closing parenthesis inside the URL, try to be smarter
        if (cleanLink.includes(')') && !cleanLink.includes('(')) {
          // Remove everything from the first closing parenthesis
          cleanLink = cleanLink.split(')')[0];
          try {
            const url = new URL(cleanLink);
            return url.protocol.startsWith('http') ? cleanLink : defaultLinks[0];
          } catch {
            return defaultLinks[0];
          }
        }
        return defaultLinks[0];
      }
    };

    // Get safe links using validation function
    const firstLink = safeLink(externalLinks[0]);
    const secondLink = safeLink(externalLinks[1]) || firstLink;
    
    console.log('Using validated links:', { firstLink, secondLink });

    // Get current content from the editor - do this only once
    const originalContent = editor.getHTML();
    console.log('Original content length:', originalContent.length);

    try {
      // Show loading indicator
      editor.commands.setContent('<p>Adding external links to the article...</p>');
      console.log('Using Flow 3 to insert external links');

      // Prepare the Flow 3 prompt with the content and focus keyword
      let flow3Prompt = FLOW3_EXTERNAL_LINK_INSERTION_PROMPT
        .replace(/{{FLOW2_ARTICLE_CONTENT}}/g, originalContent)
        .replace(/{{USER_INPUT_FOCUS_KEYWORD}}/g, focusKeyword);

      console.log('Preparing to insert automatic external links for recipe:', focusKeyword);

      try {
        // Make the API call to insert the external link
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: selectedModel1,
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: flow3Prompt }
            ],
            max_tokens: 4000
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKeys.openRouter}`
            }
          }
        );

        // Extract the AI response
        const aiResponse = response.data.choices[0].message.content;
        console.log('AI response received, length:', aiResponse.length);

        // Update the editor with the AI-enhanced content
        editor.commands.setContent(aiResponse);
        setError('External links inserted successfully!');
        setIsInsertingLinks(false);
        return;
      } catch (aiError) {
        console.error('Error in AI link insertion:', aiError);
        console.log('Falling back to direct link insertion method');
        throw new Error('AI approach failed, falling back to direct insertion');
      }
    } catch (linkError) {
      console.error('Error in Flow 3 external link insertion:', linkError);
      setError(`Error inserting external link: ${linkError instanceof Error ? linkError.message : 'Unknown error'}`);

      // If Flow 3 fails, fall back to direct insertion method
      try {
        console.log('Falling back to direct link insertion method');
        // Reset to the original content
        editor.commands.setContent(originalContent);
        console.log('Reset to original content, length:', originalContent.length);

        // Directly insert link into a paragraph
        console.log('Original content for regex:', originalContent.substring(0, 200) + '...');

        // Try different regex patterns to find paragraphs
        let paragraphs = originalContent.match(/<p>[^<]+<\/p>/g) || [];
        console.log('Found paragraphs with first pattern:', paragraphs.length);

        // If no paragraphs found, try a more lenient pattern
        if (paragraphs.length === 0) {
          paragraphs = originalContent.match(/<p>.*?<\/p>/gs) || [];
          console.log('Found paragraphs with second pattern:', paragraphs.length);
        }

        // If still no paragraphs, try an even more lenient pattern
        if (paragraphs.length === 0) {
          paragraphs = originalContent.match(/<p[^>]*>.*?<\/p>/gs) || [];
          console.log('Found paragraphs with third pattern:', paragraphs.length);
        }

        if (paragraphs && paragraphs.length >= 1) {
          let modifiedContent = originalContent;
          console.log('Starting direct link insertion');

          // Insert link in the first paragraph
          const firstPara = paragraphs[0];
          console.log('First paragraph:', firstPara);

          if (firstPara) {
            // Extract text from paragraph
            const paraText = firstPara.replace(/<\/?p[^>]*>/g, '');
            console.log('Paragraph text:', paraText);
          
            const words = paraText.split(' ');
            console.log('Word count:', words.length);
          
            if (words.length >= 5) {
              // Find a suitable anchor text that doesn't include the focus keyword
              let anchorWords: string[] = [];
              let startIndex = 1;
              
              // Avoid using the focus keyword in the anchor text
              for (let i = 1; i < words.length - 2; i++) {
                const potentialAnchor = words.slice(i, i + 3).join(' ').toLowerCase();
                if (!potentialAnchor.includes(focusKeyword.toLowerCase())) {
                  anchorWords = words.slice(i, i + 3);
                  startIndex = i;
                  break;
                }
              }
              
              // If no suitable anchor found, use words that are not the focus keyword
              if (anchorWords.length === 0) {
                // Find any words not containing the focus keyword
                for (let i = 0; i < words.length; i++) {
                  if (!words[i].toLowerCase().includes(focusKeyword.toLowerCase())) {
                    anchorWords.push(words[i]);
                    if (anchorWords.length >= 3) break;
                  }
                }
              }
              
              // If still no suitable anchor, use default cooking terms
              if (anchorWords.length === 0) {
                anchorWords = ['cooking', 'techniques', 'recipe'];
              }
              
              const anchorText = anchorWords.join(' ');
              console.log('Anchor text:', anchorText);
            
              // Create new paragraph with link to a high-quality cooking site
              const newPara = `<p>${paraText.replace(
                anchorText,
                `<a href="${firstLink}" target="_blank" rel="noopener">${anchorText}</a>`
              )}</p>`;
              console.log('New paragraph:', newPara);
            
              // Replace in content
              modifiedContent = modifiedContent.replace(firstPara, newPara);
              console.log('Link inserted');
            
              // Update the editor with the modified content
              editor.commands.setContent(modifiedContent);
              setError('External link inserted successfully (using direct method)!');
              console.log('External link inserted successfully via direct method');
              setIsInsertingLinks(false);
              return;
            } else {
              console.log('Not enough words in paragraph for link insertion');
              throw new Error('Not enough words in paragraph for link insertion');
            }
          } else {
            console.log('First paragraph is undefined');
            throw new Error('First paragraph is undefined');
          }
        } else {
          console.log('Not enough paragraphs found in content');
          
          // GUARANTEED METHOD: Add clearly visible link with colored background
          try {
            console.log('Using guaranteed link insertion method');

            // Create content with highly visible link, avoiding focus keyword
            const firstLinkText = focusKeyword.toLowerCase().includes('cooking') ? 'culinary techniques' : 'cooking techniques';
            const secondLinkText = focusKeyword.toLowerCase().includes('recipe') ? 'cooking resources' : 'recipe ideas';
            
            const wrappedContent = `
              <p style="background-color: #e6f7ff; padding: 10px; border-left: 4px solid #1890ff; margin: 10px 0;">
                <strong>🔗 Helpful Resource:</strong> Find more <a href="${firstLink}" target="_blank" rel="noopener" style="color: #1890ff; text-decoration: underline;">${firstLinkText}</a> and tips for better results.
              </p>
              ${originalContent}
              <p style="background-color: #f6ffed; padding: 10px; border-left: 4px solid #52c41a; margin: 10px 0;">
                <strong>🔗 Related Content:</strong> Discover additional <a href="${secondLink}" target="_blank" rel="noopener" style="color: #52c41a; text-decoration: underline;">${secondLinkText}</a> to enhance your cooking repertoire.
              </p>
            `;
            
            try {
              // Force the editor to update by using innerHTML directly
              const editorElement = document.querySelector('.tiptap-editor .ProseMirror');
              if (editorElement) {
                // First set content through the editor API
                editor.commands.setContent(wrappedContent);
                
                // Then force update the DOM directly as a fallback
                editorElement.innerHTML = wrappedContent;
            }
          } catch (domError) {
            console.error('DOM update error:', domError);
            // Last resort - just update through the API
            editor.commands.setContent(wrappedContent);
            setError('External links added (fallback method)!');
            console.log('External links added through API fallback');
            setIsInsertingLinks(false);
            return;
          }
        } catch (guaranteedError) {
          console.error('Guaranteed link insertion failed:', guaranteedError);
          throw guaranteedError;
        }
      }
    } catch (directError) {
      console.error('Direct link insertion failed:', directError);
      setError(`Direct link insertion failed: ${directError instanceof Error ? directError.message : 'Unknown error'}`);
      
      // Last resort - just set back to original content
      editor.commands.setContent(originalContent);
      setIsInsertingLinks(false);
    }
  } finally {
    // Ensure we always reset the insertion flag
    setIsInsertingLinks(false);
  }
};

  // Simplified handler for the single API key
  const handleApiKeyChange = (key: keyof ApiKeys, value: string) => {
    setApiKeys(prevKeys => ({
      ...prevKeys,
      [key]: value
    }));
    // Save to localStorage
    localStorage.setItem('apiKeys', JSON.stringify({
      ...apiKeys,
      [key]: value
    }));
  };

  
  const handleGenerate = async () => {
    if (!recipeTitle || !focusKeyword) {
      setError('Please provide both a Recipe Title and a Focus Keyword.');
      return;
    }
    // Validate model selections
    if (!selectedModel1) {
      setError('Please select a model for Step 1 (Outline).');
      return;
    }
    if (!selectedModel2) {
      setError('Please select a DeepSeek model for Step 2 (Writing).');
      return;
    }
    

    
     if (!apiKeys.openRouter) { // Check if OpenRouter key is present
      setError('Please enter your OpenRouter API Key in the Settings.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsSidebarContentVisible(false); // Hide sidebar content on new generation
    setGeneratedTitles([]); // Clear previous results
    setSelectedTitle(null);
    setGeneratedMetaDescriptions([]);
    setSelectedMetaDescription(null);
    setExtractedKeywords([]);
    editor?.setEditable(false); // Disable editing during generation
    editor?.commands.setContent('<p>Generating outline using ' + selectedModel1 + '...</p>');

    try {
      // --- Step 1: Generate Outline (Skipped for Medium and High difficulty) ---
      let outlineResponse = '';
      try {
        if (difficulty === 'medium') {
          editor?.commands.setContent('<p>Generating full blog post directly using ' + selectedModel2 + '...</p>');
        } else if (difficulty === 'high') {
          editor?.commands.setContent('<p>Generating full blog post directly using ' + selectedModel2 + '...</p>');
        }
        else if (difficulty === 'recipe') {
          editor?.commands.setContent('<p>Generating recipe article plan using ' + selectedModel1 + '...</p>');
        }
        else {
          const step1Prompt = STEP_1_PROMPT_TEMPLATE
            .replace(/\${USER_INPUT_RECIPE_TITLE}/g, recipeTitle)
            .replace(/\${USER_INPUT_FOCUS_KEYWORD}/g, focusKeyword)
            .replace(/\${FOCUS_KEYWORD}/g, focusKeyword); // Also replace in the prompt body

          console.log("Step 1 Prompt for:", selectedModel1, step1Prompt); // For debugging

          // API call implementation using Model 1
          outlineResponse = await callApiModel(step1Prompt, selectedModel1, apiKeys);
          console.log("Step 1 Response (Outline):", outlineResponse); // For debugging

          editor?.commands.setContent('<p>Generating full blog post using ' + selectedModel2 + '...</p>\n<pre><code>Outline:\n' + outlineResponse + '</code></pre>');
        }
      } catch (err: any) {
        console.error("Error in Step 1:", err);
        throw err; // Re-throw to be caught by the outer try-catch
      }

      // --- Step 2: Generate Full Blog Post ---
      let step2Prompt = '';
      let finalContent = ''; // To store the result before setting editor content

      try {
        // Update the editor to show we're starting Step 2
        editor?.commands.setContent('<p>Generating blog post... This may take a minute or two.</p>');
        
        // Prepare the appropriate prompt based on difficulty level
        if (difficulty === 'medium') {
            console.log("Using medium difficulty with STEP_2_PROMPT_TEMPLATE");
            step2Prompt = STEP_2_PROMPT_TEMPLATE
                .replace(/\${RECIPE_TITLE}/g, recipeTitle)
                .replace(/\${FOCUS_KEYWORD}/g, focusKeyword);
        } else if (difficulty === 'hard') {
            console.log("Using hard difficulty with STEP_3_PROMPT_TEMPLATE");
            step2Prompt = STEP_3_PROMPT_TEMPLATE
                .replace(/\[chicken pata recipe\]/g, recipeTitle);
        } else if (difficulty === 'master') {
            console.log("Using master difficulty with STEP_4_MASTER_PROMPT_TEMPLATE");
            step2Prompt = STEP_4_MASTER_PROMPT_TEMPLATE
                .replace(/\${OUTLINE}/g, outlineResponse)
                .replace(/\${FOCUS_KEYWORD}/g, focusKeyword);
        } else if (difficulty === 'high') {
            console.log("Using high difficulty with STEP_5_PROMPT_TEMPLATE");
            step2Prompt = STEP_5_PROMPT_TEMPLATE
                .replace(/\${RECIPE_TITLE}/g, recipeTitle)
                .replace(/\${FOCUS_KEYWORD}/g, focusKeyword);
        } else if (difficulty === 'recipe') {
            console.log("Using Recipe Article flow with RECIPE_ARTICLE_FLOW2_PROMPT_TEMPLATE");
            
            // First, generate the Flow 1 output using the Recipe Article prompt
            const flow1Prompt = RECIPE_ARTICLE_PROMPT_TEMPLATE
                .replace(/\${USER_INPUT_RECIPE_TITLE}/g, recipeTitle)
                .replace(/\${USER_INPUT_FOCUS_KEYWORD}/g, focusKeyword);
            
            console.log("Recipe Article Flow 1 Prompt for:", selectedModel1, "(length: " + flow1Prompt.length + " characters)");
            
            // Update the editor to show we're generating Flow 1
            editor?.commands.setContent('<p>Generating recipe article plan using ' + selectedModel1 + '...</p>');
            
            // Make the API call for Flow 1
            const flow1Output = await callApiModel(flow1Prompt, selectedModel1, apiKeys);
            console.log("Recipe Article Flow 1 Response length:", flow1Output?.length || 0);
            
            // Extract SEO data from Flow 1 output and save it for later use
            try {
              console.log('Extracting SEO data from Flow 1 output');
              
              // Log the first 1000 characters of the output for debugging
              console.log('Flow 1 output preview:', flow1Output.substring(0, 1000));
              
              // More robust title extraction - try multiple patterns
              let titles = [];
              
              // Try pattern 1: Look for SEO Suggestions section
              const titlePattern1 = flow1Output.match(/SEO Suggestions:[\s\S]*?Title Suggestions:[\s\S]*?((?:^.+$\n?){2,3})/im);
              if (titlePattern1 && titlePattern1[1]) {
                titles = titlePattern1[1].trim().split(/\r?\n/).map(t => t.trim()).filter(t => t.length > 0);
                console.log('Extracted titles using pattern 1:', titles);
              }
              
              // If that fails, try pattern 2: Look for title suggestions anywhere
              if (titles.length === 0) {
                const titlePattern2 = flow1Output.match(/Title Suggestions:[\s\S]*?((?:^.+$\n?){2,3})/im);
                if (titlePattern2 && titlePattern2[1]) {
                  titles = titlePattern2[1].trim().split(/\r?\n/).map(t => t.trim()).filter(t => t.length > 0);
                  console.log('Extracted titles using pattern 2:', titles);
                }
              }
              
              // If that fails, try pattern 3: Look for any lines that look like titles
              if (titles.length === 0) {
                // Look for lines that contain the focus keyword and are reasonable title length
                const potentialTitles = flow1Output.split(/\r?\n/).filter(line => {
                  return line.toLowerCase().includes(focusKeyword.toLowerCase()) && 
                         line.length > 20 && line.length < 80 && 
                         !line.includes(':') && !line.includes('|');
                }).slice(0, 2);
                
                if (potentialTitles.length > 0) {
                  titles = potentialTitles;
                  console.log('Extracted titles using pattern 3:', titles);
                }
              }
              
              // If we found titles, save them
              if (titles.length > 0) {
                // Assign a score for each title (placeholder scores for now)
                setGeneratedTitles(titles.slice(0, 2).map(text => ({ text, score: Math.floor(Math.random() * 31) + 70 })));
                console.log('Final extracted title suggestions:', titles);
              } else {
                // If we still don't have titles, create default ones
                const defaultTitles = [
                  `${recipeTitle}: The Ultimate ${focusKeyword} Recipe`,
                  `How to Make Perfect ${recipeTitle} | ${focusKeyword} Guide`
                ];
                setGeneratedTitles(defaultTitles.map(text => ({ text, score: 85 })));
                console.log('Using default titles:', defaultTitles);
              }
              
              // More robust meta description extraction - try multiple patterns
              let descriptions = [];
              
              // Try pattern 1: Look for Meta Description Suggestions section
              const descPattern1 = flow1Output.match(/Meta Description Suggestions:[\s\S]*?((?:^.+$\n?){2,3})/im);
              if (descPattern1 && descPattern1[1]) {
                descriptions = descPattern1[1].trim().split(/\r?\n/).map(d => d.trim()).filter(d => d.length > 0);
                console.log('Extracted descriptions using pattern 1:', descriptions);
              }
              
              // If that fails, try pattern 2: Look for meta description anywhere
              if (descriptions.length === 0) {
                // Look for the original meta description
                const descPattern2 = flow1Output.match(/Meta Description:[\s\S]*?((?:^.+$\n?){1,2})/im);
                if (descPattern2 && descPattern2[1]) {
                  const metaDesc = descPattern2[1].trim();
                  descriptions = [metaDesc, `Discover the best ${focusKeyword} recipe with our step-by-step guide to making ${recipeTitle}. Perfect for any occasion!`];
                  console.log('Extracted descriptions using pattern 2:', descriptions);
                }
              }
              
              // If we found descriptions, save them
              if (descriptions.length > 0) {
                setGeneratedMetaDescriptions(descriptions.slice(0, 2));
                console.log('Final extracted meta descriptions:', descriptions);
              } else {
                // If we still don't have descriptions, create default ones
                const defaultDescriptions = [
                  `Learn how to make delicious ${recipeTitle} with our easy-to-follow recipe. Perfect for ${focusKeyword} lovers!`,
                  `Discover the secrets to making the best ${recipeTitle}. This ${focusKeyword} recipe is sure to impress family and friends!`
                ];
                setGeneratedMetaDescriptions(defaultDescriptions);
                console.log('Using default descriptions:', defaultDescriptions);
              }
              
              // More robust keyword extraction - try multiple patterns
              let keywords = [];
              
              // Try pattern 1: Look for SEO Keywords section
              const keywordPattern1 = flow1Output.match(/SEO Keywords:[\s\S]*?((?:[^,\n]+(?:,\s*|$)){5,15})/im);
              if (keywordPattern1 && keywordPattern1[1]) {
                keywords = keywordPattern1[1].split(',').map(k => k.trim()).filter(k => k.length > 0);
                console.log('Extracted keywords using pattern 1:', keywords);
              }
              
              // If that fails, try pattern 2: Look for keyword clusters
              if (keywords.length === 0) {
                const keywordPattern2 = flow1Output.match(/Primary[\s\S]*?\|[\s\S]*?((?:[^|\n]+(?:\|\s*|$)){1,10})/im);
                if (keywordPattern2 && keywordPattern2[1]) {
                  keywords = keywordPattern2[1].split('|').map(k => k.trim()).filter(k => k.length > 0 && !k.includes('---'));
                  console.log('Extracted keywords using pattern 2:', keywords);
                }
              }
              
              // If that fails, try pattern 3: Look for keywords in the keyword table
              if (keywords.length === 0) {
                // Find all lines that look like they might be from the keyword table
                const tableLines = flow1Output.split(/\r?\n/).filter(line => 
                  line.includes('|') && !line.includes('---') && line.trim().length > 0
                );
                
                // Skip the header row and extract actual keywords
                if (tableLines.length > 1) {
                  // Skip first row which is likely the header
                  const keywordRows = tableLines.slice(1); 
                  
                  // Extract keywords from each row
                  const extractedKeywords = [];
                  for (const row of keywordRows) {
                    // Split by | and take the second part (the keywords)
                    const parts = row.split('|');
                    if (parts.length >= 2) {
                      // Get keywords from the second column
                      const rowKeywords = parts[1].trim().split(',').map(k => k.trim());
                      extractedKeywords.push(...rowKeywords);
                    }
                  }
                  
                  if (extractedKeywords.length > 0) {
                    keywords = extractedKeywords.filter(k => 
                      k.length > 0 && 
                      k.toLowerCase() !== 'keywords' && 
                      k.toLowerCase() !== 'cluster name'
                    );
                    console.log('Extracted keywords using pattern 3:', keywords);
                  }
                }
              }
              
              // If we found keywords, save them
              if (keywords.length > 0) {
                setExtractedKeywords(keywords);
                console.log('Final extracted SEO keywords:', keywords);
              } else {
                // If we still don't have keywords, create default ones
                const defaultKeywords = [focusKeyword, recipeTitle, `${recipeTitle} recipe`, `how to make ${recipeTitle}`, `best ${focusKeyword} recipe`];
                setExtractedKeywords(defaultKeywords);
                console.log('Using default keywords:', defaultKeywords);
              }
              
              // Make SEO sidebar visible
              setIsSidebarContentVisible(true);
            } catch (seoError) {
              console.error('Error extracting SEO data from Flow 1:', seoError);
              // Create default SEO data if extraction fails
              const defaultTitles = [
                `${recipeTitle}: The Ultimate ${focusKeyword} Recipe`,
                `How to Make Perfect ${recipeTitle} | ${focusKeyword} Guide`
              ];
              setGeneratedTitles(defaultTitles.map(text => ({ text, score: 85 })));
              
              const defaultDescriptions = [
                `Learn how to make delicious ${recipeTitle} with our easy-to-follow recipe. Perfect for ${focusKeyword} lovers!`,
                `Discover the secrets to making the best ${recipeTitle}. This ${focusKeyword} recipe is sure to impress family and friends!`
              ];
              setGeneratedMetaDescriptions(defaultDescriptions);
              
              const defaultKeywords = [focusKeyword, recipeTitle, `${recipeTitle} recipe`, `how to make ${recipeTitle}`, `best ${focusKeyword} recipe`];
              setExtractedKeywords(defaultKeywords);
              
              setIsSidebarContentVisible(true);
              console.log('Using default SEO data due to extraction error');
            }
            
            // Update the editor to show we're moving to Flow 2
            editor?.commands.setContent('<p>Generating full recipe article using ' + selectedModel2 + '...</p>\n<pre><code>Plan:\n' + flow1Output + '</code></pre>');
            
            // Now prepare the Flow 2 prompt with the Flow 1 output
            step2Prompt = RECIPE_ARTICLE_FLOW2_PROMPT_TEMPLATE
                .replace(/\${FLOW_1_OUTPUT}/g, flow1Output);
                
            // Extract external links from Flow 1 output - handle multiple possible formats
            let extractedLinks: string[] = [];
            
            // Try different patterns to extract links
            // Pattern 1: External Link 1: [https://example.com]
            const pattern1 = flow1Output.match(/External Link \d+: \[(https?:\/\/[^\]]+)\]/g);
            if (pattern1) {
                const links = pattern1.map(link => {
                    const urlMatch = link.match(/\[(https?:\/\/[^\]]+)\]/);
                    return urlMatch ? urlMatch[1] : '';
                }).filter(url => url !== '');
                extractedLinks = [...extractedLinks, ...links];
            }
            
            // Pattern 2: External Link 1: https://example.com
            const pattern2 = flow1Output.match(/External Link \d+:\s+(https?:\/\/[^\s\n]+)/g);
            if (pattern2) {
                const links = pattern2.map(link => {
                    const urlMatch = link.match(/:\s+(https?:\/\/[^\s\n]+)/);
                    return urlMatch ? urlMatch[1] : '';
                }).filter(url => url !== '');
                extractedLinks = [...extractedLinks, ...links];
            }
            
            // Pattern 3: Find any URLs in the text
            const pattern3 = flow1Output.match(/(https?:\/\/[^\s\n"'<>]+)/g);
            if (pattern3 && extractedLinks.length === 0) {
                extractedLinks = pattern3.filter(url => {
                    // Filter out common API URLs that might be in the text
                    return !url.includes('openrouter.ai') && 
                           !url.includes('openai.com') && 
                           !url.includes('api.stability.ai');
                }).slice(0, 2); // Take at most 2 links
            }
            
            // If we still don't have links, add some default cooking reference sites
            if (extractedLinks.length === 0) {
                extractedLinks = [
                    'https://www.seriouseats.com/cooking-techniques',
                    'https://www.foodnetwork.com/recipes'
                ];
                console.log('No links found in Flow 1 output, using default cooking reference sites');
            }
            
            // Store the external links in state for later use
            setExternalLinks(extractedLinks);
            console.log('Extracted external links:', extractedLinks);
        } else {
            // Handle unexpected difficulty value if necessary
            console.error("Unknown difficulty selected:", difficulty);
            throw new Error(`Unknown difficulty level: ${difficulty}`);
        }
        
        // Log the prompt length to help diagnose timeout issues
        console.log(`Step 2 Prompt length: ${step2Prompt.length} characters`);
        
        // If the prompt is very long, show a warning in the editor
        if (step2Prompt.length > 10000) {
          editor?.commands.setContent('<p>Generating a very long blog post. This may take several minutes...</p>');
        }
        
        // Make the API call to generate the content
        finalContent = await callApiModel(step2Prompt, selectedModel2, apiKeys);
        
        // Add a comment indicating the difficulty level used
        finalContent += `\n<!-- ${difficulty} difficulty -->`;
      } catch (err: any) {
        console.error("Error in Step 2:", err);
        throw err; // Re-throw to be caught by the outer try-catch
      }

      console.log(`Step 2 Prompt for ${difficulty} difficulty (Model: ${selectedModel2}):`, step2Prompt); // For debugging
      console.log("Step 2 Response (Full Blog) length:", finalContent?.length || 0); // Log length instead of full content
      
      // Check if we actually got content back
      if (!finalContent || finalContent.trim().length === 0) {
        throw new Error('Received empty content from the API. Please try again.');
      }
      
      // For recipe articles, use Flow 3 to insert external links into the content
      if (difficulty === 'recipe' && externalLinks.length >= 1) {
        try {
          // Update the editor to show we're inserting links
          editor?.commands.setContent('<p>Inserting external links into the article using Flow 3...</p>');
          
          console.log('Using Flow 3 to insert external links:', externalLinks);
          
          // Prepare the Flow 3 prompt with the Flow 2 output and external links
          let flow3Prompt = FLOW3_EXTERNAL_LINK_INSERTION_PROMPT
            .replace(/{{FLOW2_ARTICLE_CONTENT}}/g, finalContent)
            .replace(/{{EXTERNAL_LINK_1}}/g, externalLinks[0] || 'https://www.seriouseats.com/cooking-techniques')
            .replace(/{{EXTERNAL_LINK_2}}/g, externalLinks[1] || externalLinks[0] || 'https://www.foodnetwork.com/recipes');
          
          console.log('External links for Flow 3:', 
            `Link 1: ${externalLinks[0] || 'https://www.seriouseats.com/cooking-techniques'}`, 
            `Link 2: ${externalLinks[1] || externalLinks[0] || 'https://www.foodnetwork.com/recipes'}`);
          
          
          // Make the API call for Flow 3
          console.log('Flow 3 Prompt length:', flow3Prompt.length);
          const flow3Output = await callApiModel(flow3Prompt, selectedModel2, apiKeys);
          
          // Update the content with the Flow 3 output
          finalContent = flow3Output;
          console.log('External links inserted successfully via Flow 3');
        } catch (linkError) {
          console.error('Error in Flow 3 external link insertion:', linkError);
          // If Flow 3 fails, fall back to direct insertion method
          try {
            console.log('Falling back to direct link insertion method');
            // Set the content first
            editor?.commands.setContent(finalContent);
            
            // Then insert the links directly into the editor
            await insertExternalLinksIntoEditor(editor, externalLinks);
            
            // Get the updated content with links
            finalContent = editor?.getHTML() || finalContent;
            console.log('External links inserted successfully via fallback method');
          } catch (fallbackError) {
            console.error('Error in fallback link insertion:', fallbackError);
            // Continue with the original content if both methods fail
            editor?.commands.setContent(finalContent);
            console.log('Continuing with original content due to link insertion errors');
          }
        }
      }
      
      editor?.commands.setContent(finalContent); // Set final HTML content

      editor?.setEditable(true); // Re-enable editing
      setIsSidebarContentVisible(true); // Show sidebar content after successful generation
      
      // Show success message
      setError('Blog post generated successfully! You can now generate images.');

      // SEO data is now automatically extracted from Flow 1 output
      // No need to trigger separate sidebar content generation

    } catch (err: any) {
      console.error("Generation Error:", err);
      setIsSidebarContentVisible(false); // Ensure sidebar is hidden on error
      const errorMessage = err.message || 'Unknown error';
      setError(`Error during generation: ${errorMessage}`);
      editor?.commands.setContent(`<p>Error: ${errorMessage}</p><p>Please try again or select a different difficulty level.</p>`);
      editor?.setEditable(true); // Re-enable editing even on error
    } finally {
      setIsLoading(false); // Always ensure loading state is reset
    }
  };

  // Function for making the actual API call - Now always uses OpenRouter
  const callApiModel = async (prompt: string, modelId: string, keys: ApiKeys): Promise<string> => {
    // Safety check for empty prompt
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Empty prompt provided to API call');
    }
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    const apiKey = keys.openRouter; // Use the stored OpenRouter key
    
    // Check if we're using a DeepSeek model (which is used for Step 2 - generating the full blog post)
    const isDeepSeekModel = modelId.startsWith('deepseek/');
    
    // For DeepSeek models, we'll use a longer timeout and streaming for better reliability
    const timeout = isDeepSeekModel ? 300000 : 120000; // 5 minutes for DeepSeek, 2 minutes for others
    
    const requestBody = {
        model: modelId, // Pass the selected model ID to OpenRouter
        messages: [{ role: 'user', content: prompt }],
        // For DeepSeek models, we'll set a higher max_tokens to ensure we get a complete response
        ...(isDeepSeekModel ? { max_tokens: 4000 } : {}),
        // Optional: Add site/header info as recommended by OpenRouter
        // route: "fallback", // Example routing
        // headers: {
        //   "HTTP-Referer": "YOUR_SITE_URL", // Replace with your site URL
        //   "X-Title": "YOUR_SITE_NAME", // Replace with your site name
        // }
    };

    if (!apiKey) {
        // This check is now also done in handleGenerate, but kept here as a safeguard
        throw new Error(`OpenRouter API key is missing.`);
    }

    console.log(`Calling OpenRouter API: ${apiUrl} with model ${modelId}`); // Debugging
    // --- Actual API Call (Example using Axios) ---
    try {
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            // Optional: Add site/header info as recommended by OpenRouter
            // "HTTP-Referer": "YOUR_SITE_URL", // Replace with your site URL
            // "X-Title": "YOUR_SITE_NAME", // Replace with your site name
        };

        console.log(`Making API request to ${apiUrl} with model ${modelId} (timeout: ${timeout}ms)`);
        const response = await axios.post(apiUrl, requestBody, { 
          headers,
          timeout // Use the appropriate timeout based on the model
        });

        // Extract the text content - OpenRouter uses OpenAI's format
        console.log('API response received:', response.status);
        const content = response.data?.choices?.[0]?.message?.content || '';

        if (!content) {
            console.warn("API response structure might be unexpected:", response.data);
            throw new Error("Received empty content from API.");
        }
        return content.trim();

    } catch (apiError: any) {
        console.error("API Call Failed:", apiError.response?.data || apiError.message);
        const errorDetails = apiError.response?.data?.error?.message || apiError.message || 'API request failed';
        
        // Provide more helpful error messages for timeouts
        if (errorDetails.includes('timeout')) {
          throw new Error(`API timeout: The request took too long to complete. Try a shorter prompt or a different model.`);
        }
        
        throw new Error(`API Error: ${errorDetails}`);
    }
  };

  // Function to generate an image based on the recipe title
  const generateImage = async () => {
    if (!recipeTitle) {
      setImageGenerationError('Please enter a recipe title first');
      return;
    }
    
    // Check if we have the required API key
    if (selectedImageService === 'stability' && !apiKeys.stabilityAi) {
      setImageGenerationError('Stability AI API key is required. Please add it in the Settings tab.');
      return;
    }
    
    if (selectedImageService === 'leonardo' && !apiKeys.leonardoAi) {
      setImageGenerationError('Leonardo AI API key is required. Please add it in the Settings tab.');
      return;
    }
    
    setIsGeneratingImage(true);
    setImageGenerationError(null);
    setGeneratedImageUrl(null);
    setOriginalImageUrl(null); // Reset original image URL when generating a new image
    
    try {
      // Use the recipe title directly for the prompt
      const prompt = `Create a realistic image of the dish: ${recipeTitle}. High quality food photography style, appetizing presentation, professional lighting.`;
      
      // Use the prompt to generate an image with the selected service
      const imageUrl = await generateAIImage(
        prompt,
        { 
          service: selectedImageService as 'stability' | 'leonardo',
          size: "1024x1024" 
        }
      );
      
      if (imageUrl) {
        setGeneratedImageUrl(imageUrl);
        setOriginalImageUrl(imageUrl); // Store the original image URL
      } else {
        throw new Error('Failed to generate image: No URL returned');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      setImageGenerationError(error instanceof Error ? error.message : 'Failed to generate image');
      
      // Restore original image if conversion fails
      if (originalImageUrl) {
        setGeneratedImageUrl(originalImageUrl);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Function to convert image to WebP format with animation
  const convertToWebP = async () => {
    if (!generatedImageUrl) {
      setImageGenerationError('No image available to convert');
      return;
    }
    
    setIsConverting(true);
    setConversionProgress(0);
    setImageGenerationError(null);
    
    try {
      // Store original image URL if not already stored
      if (!originalImageUrl) {
        setOriginalImageUrl(generatedImageUrl);
      }
      
      // Simulate the conversion process with steps and progress
      const steps = [
        'test data',
        'run iscript compressing',
        'run method compress hard',
        'convert to webp'
      ];
      
      // Animate through each step
      for (let i = 0; i < steps.length; i++) {
        setConversionStep(steps[i]);
        
        // Update progress for each step (25%, 50%, 75%, 100%)
        for (let p = 0; p < 100; p += 5) {
          setConversionProgress((i * 25) + (p / 4));
          await new Promise(resolve => setTimeout(resolve, 50)); // Delay for animation
        }
        
        // Pause briefly at the end of each step
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      let webpImage: string;
      
      try {
        // First try the server-side approach
        console.log('Attempting server-side conversion...');
        const response = await axios.post('http://localhost:3001/convert-base64', {
          imageData: generatedImageUrl
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        });
        
        if (response.data && response.data.success && response.data.webpImage) {
          console.log('Server-side conversion successful');
          webpImage = response.data.webpImage;
        } else {
          throw new Error('Invalid response from conversion server');
        }
      } catch (serverError) {
        // If server approach fails, fall back to browser-based conversion
        console.log('Server-side conversion failed, falling back to browser-based conversion', serverError);
        
        // Import the browser-based converter
        const browserConverter = await import('./browser-webp-converter');
        webpImage = await browserConverter.processImage(generatedImageUrl);
        console.log('Browser-based conversion successful');
      }
      
      // Update the image URL with the converted WebP image
      setGeneratedImageUrl(webpImage);
      
    } catch (error) {
      console.error('Error in convertToWebP:', error);
      
      // Show a more detailed error message
      let errorMessage = 'Failed to convert image to WebP';
      if (error instanceof Error) {
        errorMessage = `${errorMessage}: ${error.message}`;
      } else if (axios.isAxiosError(error) && error.response) {
        errorMessage = `${errorMessage}: ${error.response.data?.error || error.message}`;
      }
      setImageGenerationError(errorMessage);
      
      // Restore original image if conversion fails
      if (originalImageUrl) {
        setGeneratedImageUrl(originalImageUrl);
      }
    } finally {
      setIsConverting(false);
      setConversionStep('');
      setConversionProgress(0);
    }
  };
  
  // Function to handle WebP compression for blog images
  const handleCompressWebP = async (imageUrl: string, imageType: string) => {
    if (!imageUrl) {
      setBlogImageError('No image available to convert');
      return;
    }
    
    // Set the specific image as converting
    setConvertingBlogImages(prev => ({
      ...prev,
      [imageType]: true
    }));
    
    setBlogImageError(null);
    setSuccessMessage(null);
    
    try {
      // Store original image URL for backup
      const originalImages = {...blogImages};
      
      let webpImage: string;
      
      try {
        // First try the server-side approach
        console.log(`Attempting server-side conversion for ${imageType} image...`);
        const response = await axios.post('http://localhost:3001/convert-base64', {
          imageData: imageUrl
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        });
        
        if (response.data && response.data.success && response.data.webpImage) {
          console.log(`Server-side conversion successful for ${imageType} image`);
          webpImage = response.data.webpImage;
        } else {
          throw new Error('Invalid response from conversion server');
        }
      } catch (serverError) {
        // If server approach fails, fall back to browser-based conversion
        console.log(`Server-side conversion failed for ${imageType} image, falling back to browser-based conversion`, serverError);
        
        // Import the browser-based converter
        const browserConverter = await import('./browser-webp-converter');
        webpImage = await browserConverter.processImage(imageUrl);
        console.log(`Browser-based conversion successful for ${imageType} image`);
      }
      
      // Update the specific blog image with the converted WebP image
      setBlogImages(prev => ({
        ...prev,
        [imageType]: webpImage
      }));
      
      setSuccessMessage(`${imageType.charAt(0).toUpperCase() + imageType.slice(1)} image converted to WebP successfully!`);
      
    } catch (error) {
      console.error(`Error converting ${imageType} image to WebP:`, error);
      
      // Show a more detailed error message
      let errorMessage = `Failed to convert ${imageType} image to WebP`;
      if (error instanceof Error) {
        errorMessage = `${errorMessage}: ${error.message}`;
      } else if (axios.isAxiosError(error) && error.response) {
        errorMessage = `${errorMessage}: ${error.response.data?.error || error.message}`;
      }
      setBlogImageError(errorMessage);
      
    } finally {
      // Clear the converting state for this image
      setConvertingBlogImages(prev => ({
        ...prev,
        [imageType]: false
      }));
    }
  };

  // Function to handle WordPress settings changes
  const handleWpSettingsChange = (field: keyof WordPressSettings, value: string | boolean) => {
    setWordpressSettings(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // Save to localStorage
      localStorage.setItem('wordpressSettings', JSON.stringify(updated));
      return updated;
    });
  };

  // Function to connect to WordPress and fetch categories
  const connectToWordPress = async () => {
    if (!wordpressSettings.url || !wordpressSettings.username || !wordpressSettings.password) {
      setConnectionError('Please fill in all WordPress connection details');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Test connection by fetching categories using Basic Auth header instead of auth object
      const authHeader = 'Basic ' + btoa(`${wordpressSettings.username}:${wordpressSettings.password}`);
      
      const response = await axios.get(`${wordpressSettings.url}/wp-json/wp/v2/categories?per_page=100`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Filter out empty categories and sort alphabetically
        const categories = response.data
          .filter((cat: any) => cat.name !== 'Uncategorized')
          .map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            count: cat.count
          }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        console.log('Fetched WordPress categories:', categories);
        
        setWpCategories(categories);
        handleWpSettingsChange('isConnected', true);
        setConnectionError(null);
        
        // Select first category by default if available
        if (categories.length > 0 && !selectedCategory) {
          setSelectedCategory(categories[0].id);
        }
        
        // Now verify user permissions by checking if they can create posts
        try {
          const userResponse = await axios.get(`${wordpressSettings.url}/wp-json/wp/v2/users/me?context=edit`, {
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
            }
          });
          
          if (userResponse.data && userResponse.data.capabilities) {
            const canCreatePosts = userResponse.data.capabilities.publish_posts || 
                                  userResponse.data.capabilities.edit_posts;
            
            if (!canCreatePosts) {
              setConnectionError('Warning: Your WordPress user does not have permission to create posts. Please use an account with Author, Editor, or Administrator role.');
            }
          }
        } catch (userError) {
          console.warn('Could not verify user permissions:', userError);
          // Continue anyway since we already connected successfully
        }
      } else {
        throw new Error('Invalid response from WordPress API');
      }
    } catch (error) {
      console.error('WordPress connection error:', error);
      let errorMessage = 'Failed to connect to WordPress';
      
      interface ErrorWithResponse {
        response?: {
          status?: number;
        };
      }
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as ErrorWithResponse;
        if (axiosError.response?.status === 401) {
          errorMessage = 'Authentication failed. Please check your username and application password.';
        } else if (axiosError.response?.status === 403) {
          errorMessage = 'Access forbidden. Your user account does not have sufficient permissions.';
        } else if (axiosError.response?.status === 404) {
          errorMessage = 'WordPress REST API not found. Make sure your site URL is correct and the REST API is enabled.';
        }
      }
      
      setConnectionError(errorMessage);
      handleWpSettingsChange('isConnected', false);
    } finally {
      setIsConnecting(false);
    }
  };

  // Function to publish to WordPress
  const publishToWordPress = async () => {
    if (!wordpressSettings.isConnected) {
      setConnectionError('Please connect to WordPress first');
      return;
    }

    if (!editor) {
      setConnectionError('No content to publish');
      return;
    }

    setIsPublishing(true);
    setPublishingResult(null);
    setConnectionError(null);

    try {
      // Create authentication header
      const authHeader = 'Basic ' + btoa(`${wordpressSettings.username}:${wordpressSettings.password}`);
      
      // Extract title from content (h1)
      const htmlContent = editor.getHTML();
      const titleMatch = htmlContent.match(/<h1>(.*?)<\/h1>/);
      const title = titleMatch ? titleMatch[1] : recipeTitle;

      // Extract content (everything after h1)
      let content = htmlContent;
      if (titleMatch) {
        const titleIndex = htmlContent.indexOf(titleMatch[0]);
        const titleEndIndex = titleIndex + titleMatch[0].length;
        content = htmlContent.substring(titleEndIndex);
      }

      // Create slug from focus keyword
      const slug = focusKeyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      // Format tags properly for WordPress API
      const formattedTags = extractedKeywords.map(keyword => keyword.trim()).filter(keyword => keyword.length > 0);

      // Extract all image URLs from the content
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      let match;
      const imageUrls = [];
      let modifiedContent = content;
      
      // Find all image URLs in the content
      while ((match = imgRegex.exec(content)) !== null) {
        imageUrls.push(match[1]);
      }
      
      // Upload all content images to WordPress
      if (imageUrls.length > 0) {
        console.log(`Found ${imageUrls.length} images in content to upload`);
        
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i];
          try {
            // Skip if not a valid URL or data URL
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
              continue;
            }
            
            console.log(`Uploading content image ${i+1}/${imageUrls.length}...`);
            
            // Convert URL or data URL to blob for upload
            const imageBlob = await fetch(imageUrl).then(r => r.blob());
            
            // Create form data for image upload
            const formData = new FormData();
            formData.append('file', imageBlob, `${slug || 'recipe'}-content-image-${i+1}.png`);
            
            // Upload image
            const imageUploadResponse = await axios.post(
              `${wordpressSettings.url}/wp-json/wp/v2/media`,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  'Authorization': authHeader
                }
              }
            );
            
            if (imageUploadResponse.data && imageUploadResponse.data.id && imageUploadResponse.data.source_url) {
              console.log('Image uploaded successfully with ID:', imageUploadResponse.data.id);
              console.log('Image URL:', imageUploadResponse.data.source_url);
              
              // Replace the data URL in the content with the WordPress URL
              modifiedContent = modifiedContent.replace(imageUrl, imageUploadResponse.data.source_url);
            }
          } catch (imageError) {
            console.error('Failed to upload image:', imageError);
            // Continue with post creation even if image upload fails
          }
        }
      }

      // Prepare post data based on selected options
      const postData: any = {
        content: modifiedContent, // Use the modified content with WordPress image URLs
        status: postStatus,
      };

      // Add optional fields based on user selection
      if (publishOptions.includeTitle) {
        postData.title = title;
      }

      if (publishOptions.includeSlug && focusKeyword) {
        postData.slug = slug;
      }

      if (publishOptions.includeMetaDescription && selectedMetaDescription) {
        postData.excerpt = selectedMetaDescription;
      }

      if (!postData.meta) postData.meta = {};
      if (publishOptions.includeFocusKeyword && focusKeyword) {
        postData.meta._yoast_wpseo_focuskw = focusKeyword;
      }
      if (publishOptions.includeMetaDescription && selectedMetaDescription) {
        postData.meta._yoast_wpseo_metadesc = selectedMetaDescription;
      }

      if (selectedCategory) {
        postData.categories = [selectedCategory];
      }

      if (publishOptions.includeTags && formattedTags.length > 0) {
        postData.tags = await getTagIds(formattedTags, wordpressSettings, authHeader);
      }
      
      // If we have a generated image and user wants to include it
      if (generatedImageUrl && publishOptions.includeFeaturedImage) {
        try {
          console.log('Uploading featured image...');
          
          // Convert data URL to blob for upload
          const imageBlob = await fetch(generatedImageUrl).then(r => r.blob());
            
          // Create form data for image upload
          const formData = new FormData();
          formData.append('file', imageBlob, `${slug || 'recipe'}-image.png`);

          // Use alt text from blog image generation if available, otherwise generate new one
          let altText = '';
          try {
            // Check if we have a pre-generated alt text from blog images
            if (blogImageAltTexts.intro) {
              altText = blogImageAltTexts.intro;
              console.log('Using pre-generated alt text for featured image');
            } else {
              // If not, generate a new one using the shared prompt template
              const altTextPrompt = SHARED_ALT_TEXT_PROMPT.replace('{focusKeyword}', focusKeyword);
              // Use the same model and API key as for image prompts
              altText = await callApiModel(altTextPrompt, selectedModel1, apiKeys);
              console.log('Generated new alt text for featured image');
            }
            
            if (altText && typeof altText === 'string') {
              // Only add the alt_text field, don't modify the image title or filename
              formData.append('alt_text', altText.trim());
              console.log('Using alt text for featured image:', altText.trim());
            }
          } catch (altError) {
            console.error('Failed to get alt text:', altError);
          }
            
          // Upload image
          const imageUploadResponse = await axios.post(
            `${wordpressSettings.url}/wp-json/wp/v2/media`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': authHeader
              }
            }
          );
          
          // Log the alt text used (only for debugging)
          if (altText) {
            console.log('Added alt text to featured image upload');
          }
          
          if (imageUploadResponse.data && imageUploadResponse.data.id) {
            console.log('Image uploaded successfully with ID:', imageUploadResponse.data.id);
            postData.featured_media = imageUploadResponse.data.id;
          }
        } catch (imageError) {
          console.error('Failed to upload featured image:', imageError);
          // Continue with post creation even if image upload fails
        }
      }

      // Create post
      console.log('Creating post with endpoint:', `${wordpressSettings.url}/wp-json/wp/v2/posts`);
      const postResponse = await axios.post(
        `${wordpressSettings.url}/wp-json/wp/v2/posts`,
        postData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          }
        }
      );
      
      if (postResponse.data && postResponse.data.link) {
        console.log('Post created successfully:', postResponse.data);
        setPublishingResult({
          success: true,
          message: `Post ${postStatus === 'publish' ? 'published' : 'saved as draft'} successfully!`,
          link: postResponse.data.link
        });
      } else {
        throw new Error('Invalid response from WordPress API');
      }
    } catch (error) {
      console.error('WordPress publishing error:', error);
      let errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to publish to WordPress';
      
      // More detailed error information
      let detailedError = errorMessage;
      interface ErrorWithResponse {
        response?: {
          status?: number;
        };
      }
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as ErrorWithResponse;
        if (axiosError.response?.status) {
          detailedError += ` (Status: ${axiosError.response.status})`;
          
          if (axiosError.response.status === 401) {
            detailedError = 'Authentication failed (Status: 401). Your WordPress user does not have permission to create posts. Please use an account with Author, Editor, or Administrator role.';
          } else if (axiosError.response?.data?.message) {
            detailedError += ` - ${axiosError.response.data.message}`;
          }
        }
      }
      
      setPublishingResult({
        success: false,
        message: detailedError
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Function to handle publish options changes
  const handlePublishOptionChange = (option: keyof typeof publishOptions) => {
    setPublishOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // State for blog images
  const [blogImages, setBlogImages] = useState<{[key: string]: string}>({});
  
  // State to track which blog images are being converted
  const [convertingBlogImages, setConvertingBlogImages] = useState<{[key: string]: boolean}>({});

  // Function to handle blog image generation
  const handleGenerateBlogImages = async () => {
    if (!editor || !editor.getHTML()) {
      setBlogImageError('Please generate a blog post first');
      return;
    }
    
    // Check if we have the required API key for the selected service
    if (selectedImageService === 'stability' && !apiKeys.stabilityAi) {
      setBlogImageError('Stability AI API key is required. Please add it in the Settings tab.');
      return;
    }
    
    if (selectedImageService === 'leonardo' && !apiKeys.leonardoAi) {
      setBlogImageError('Leonardo AI API key is required. Please add it in the Settings tab.');
      return;
    }
    
    setIsGeneratingBlogImages(true);
    setBlogImageError(null);
    setSuccessMessage(null);
    setBlogImages({});
    
    try {
      // Get the article content
      const articleContent = editor.getHTML();
      
      // Generate image prompts
      const imagePrompts = await generateImagePrompts(
        articleContent,
        selectedModel1,
        apiKeys.openRouter
      );
      
      console.log('Generated image prompts:', imagePrompts);
      
      // Generate images for each section
      const images: {[key: string]: string} = {};
      const altTexts: {[key: string]: string} = {};
      let imagesGenerated = 0;
      
      // Generate intro image
      console.log('Generating intro image...');
      try {
        images.intro = await generateAIImage(
          imagePrompts.intro_image_prompt, 
          { service: selectedImageService as 'stability' | 'leonardo' }
        );
        altTexts.intro = imagePrompts.intro_image_alt_text || '';
        imagesGenerated++;
        console.log('Intro image URL:', images.intro);
      } catch (error) {
        console.error('Failed to generate intro image:', error);
      }
      
      // Generate ingredients image
      console.log('Generating ingredients image...');
      try {
        images.ingredients = await generateAIImage(
          imagePrompts.ingredients_image_prompt, 
          { service: selectedImageService as 'stability' | 'leonardo' }
        );
        altTexts.ingredients = imagePrompts.ingredients_image_alt_text || '';
        imagesGenerated++;
        console.log('Ingredients image URL:', images.ingredients);
      } catch (error) {
        console.error('Failed to generate ingredients image:', error);
      }
      
      // Generate final recipe image
      console.log('Generating recipe image...');
      try {
        images.recipe = await generateAIImage(
          imagePrompts.final_recipe_image_prompt, 
          { service: selectedImageService as 'stability' | 'leonardo' }
        );
        altTexts.recipe = imagePrompts.final_recipe_image_alt_text || '';
        imagesGenerated++;
        console.log('Recipe image URL:', images.recipe);
      } catch (error) {
        console.error('Failed to generate recipe image:', error);
      }
      
      // Store the generated images and alt texts in state
      if (imagesGenerated > 0) {
        setBlogImages(images);
        setBlogImageAltTexts(altTexts);
        setSuccessMessage(`${imagesGenerated} images generated. Click "Insert Images" to add them to your blog post.`);
      } else {
        throw new Error('Failed to generate any images');
      }
    } catch (error) {
      console.error('Failed to generate blog images:', error);
      setBlogImageError(error instanceof Error ? error.message : 'Failed to generate blog images');
    } finally {
      setIsGeneratingBlogImages(false);
    }
  };

  // Function to insert blog images into the editor
  const insertBlogImages = () => {
    if (!editor || Object.keys(blogImages).length === 0) return;
    
    try {
      // Make sure the editor is editable before inserting content
      editor.setEditable(true);
      
      // Helper function to find a node position
      const findNodePosition = (type: string, text: string) => {
        let pos = 0;
        let found = false;
        
        editor.state.doc.descendants((node, nodePos) => {
          if (found) return false;
          
          // Check if this is a heading or paragraph containing our text
          if ((node.type.name === type || (type === 'heading' && node.type.name.startsWith('heading'))) && 
              node.textContent.toLowerCase().includes(text.toLowerCase())) {
            pos = nodePos + node.nodeSize;
            found = true;
            return false;
          }
        });
        
        return found ? pos : null;
      };
      
      // Insert intro image after first paragraph
      if (blogImages.intro) {
        let introPos = null;
        
        // Find the second h2 heading
        let headingCount = 0;
        editor.state.doc.descendants((node, pos) => {
          if (introPos !== null) return false;
          if (node.type.name === 'heading' && node.attrs.level === 2) {
            headingCount++;
            if (headingCount === 2) {
              introPos = pos + node.nodeSize;
              return false;
            }
          }
        });
        
        // If no heading found, use first paragraph
        if (introPos === null) {
          editor.state.doc.descendants((node, pos) => {
            if (introPos !== null) return false;
            if (node.type.name === 'paragraph') {
              introPos = pos + node.nodeSize;
              return false;
            }
          });
        }
        
        if (introPos !== null) {
          editor
            .chain()
            .focus()
            .setTextSelection(introPos)
            .insertContent(`<p><img src="${blogImages.intro}" alt="${recipeTitle}" class="generated-image intro-image" /></p>`)
            .run();
        }
      }
      
      // Insert ingredients image after ingredients section
      if (blogImages.ingredients) {
        // Find the ingredients heading
        let ingredientsPos: number | null = null;
        
        // First try to find a heading containing 'ingredients'
        editor.state.doc.descendants((node, pos) => {
          if (ingredientsPos !== null) return false;
          if (node.type.name === 'heading' && 
              (node.attrs.level === 2 || node.attrs.level === 3) && 
              node.textContent.toLowerCase().includes('ingredient')) {
            // Place right after the heading
            ingredientsPos = pos + node.nodeSize;
            return false;
          }
        });
        
        // If no heading found, try to find a paragraph with 'ingredients'
        if (ingredientsPos === null) {
          ingredientsPos = findNodePosition('paragraph', 'ingredient');
        }
        
        // If still not found, use 1/3 position
        if (ingredientsPos === null) {
          const totalPos = editor.state.doc.content.size;
          ingredientsPos = Math.floor(totalPos / 3);
        }
        
        editor
          .chain()
          .focus()
          .setTextSelection(ingredientsPos)
          .insertContent(`<p><img src="${blogImages.ingredients}" alt="Ingredients for ${recipeTitle}" class="generated-image ingredients-image" /></p>`)
          .run();
      }
      
      // Insert recipe image near the end
      if (blogImages.recipe) {
        let recipePos: number | null = null;
        
        // Find the ingredients section first
        let foundIngredients = false;
        editor.state.doc.descendants((node, pos) => {
          if (recipePos !== null) return false;
          
          // Look for ingredients heading or list
          if (node.type.name === 'heading' && 
              node.textContent.toLowerCase().includes('ingredient')) {
            foundIngredients = true;
          }
          
          // If we found ingredients and now we're at a new heading, this is where we want to insert
          if (foundIngredients && node.type.name === 'heading' && 
              !node.textContent.toLowerCase().includes('ingredient')) {
            recipePos = pos;
            return false;
          }
        });
        
        // If we didn't find a good spot after ingredients, try to find the instructions section
        if (recipePos === null) {
          recipePos = findNodePosition('heading', 'instruction') || 
                     findNodePosition('heading', 'step') ||
                     findNodePosition('heading', 'direction');
        }
        
        // If still not found, use position after ingredients list if we found it
        if (recipePos === null && foundIngredients) {
          editor.state.doc.descendants((node, pos) => {
            if (recipePos !== null) return false;
            if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
              const prevNode = editor.state.doc.resolve(pos).nodeBefore;
              if (prevNode && prevNode.textContent.toLowerCase().includes('ingredient')) {
                recipePos = pos + node.nodeSize;
                return false;
              }
            }
          });
        }
        
        // Last resort: use 1/2 position
        if (recipePos === null) {
          const totalPos = editor.state.doc.content.size;
          recipePos = Math.floor(totalPos / 2);
        }
        
        editor
          .chain()
          .focus()
          .setTextSelection(recipePos)
          .insertContent(`<p><img src="${blogImages.recipe}" alt="Final ${recipeTitle}" class="generated-image recipe-image" /></p>`)
          .run();
      }
      
      // Restore editor state
      editor.setEditable(false);
      
      setError('Images inserted successfully!');
    } catch (error) {
      console.error('Error inserting blog images:', error);
      setError(`Error inserting images: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Make sure to restore editor state even if there's an error
      if (editor) editor.setEditable(false);
    }
  }

  // Return the JSX for the App component
  return (
    <div className="app-container">

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <div className="settings-header">
              <h2>API Settings</h2>
              <button 
                className="close-button"
                onClick={() => setIsSettingsOpen(false)}
              >
                ×
              </button>
            </div>
            
            <div className="settings-content">
              <div className="settings-section">
                <h3>OpenRouter API Key</h3>
                <input
                  type="password"
                  value={apiKeys.openRouter}
                  onChange={(e) => handleApiKeyChange('openRouter', e.target.value)}
                  placeholder="Enter your OpenRouter API key"
                />
                <p className="settings-info">Required for blog generation</p>
              </div>
              
              <div className="settings-section">
                <h3>Image Generation API Keys</h3>
                <div className="api-key-input">
                  <label>Stability AI</label>
                  <input
                    type="password"
                    value={apiKeys.stabilityAi}
                    onChange={(e) => handleApiKeyChange('stabilityAi', e.target.value)}
                    placeholder="Enter your Stability AI API key"
                  />
                  <a href="https://platform.stability.ai/" target="_blank" rel="noopener noreferrer">Get API key</a>
                </div>
                
                <div className="api-key-input">
                  <label>Leonardo AI</label>
                  <input
                    type="password"
                    value={apiKeys.leonardoAi}
                    onChange={(e) => handleApiKeyChange('leonardoAi', e.target.value)}
                    placeholder="Enter your Leonardo AI API key"
                  />
                  <a href="https://leonardo.ai/api" target="_blank" rel="noopener noreferrer">Get API key</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="layout-container">
        <div className="main-content">
          <div className="input-section">
            <div className="input-row">
              <div className="input-group">
                <label htmlFor="recipeTitle">Recipe Title:</label>
                <input
                  id="recipeTitle"
                  type="text"
                  value={recipeTitle}
                  onChange={(e) => setRecipeTitle(e.target.value)}
                  placeholder="Enter your recipe title"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="focusKeyword">Focus Keyword:</label>
                <input
                  id="focusKeyword"
                  type="text"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  placeholder="Enter focus keyword"
                />
              </div>
            </div>
            
            <div className="input-row">
              <div className="input-group">
                <label htmlFor="difficulty">Difficulty:</label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="high">High</option>
                  <option value="master">Master</option>
                  <option value="recipe">Recipe Article</option>
                </select>
              </div>
            </div>

            <div className="button-group">
              <button 
                className="generate-button"
                onClick={handleGenerate} 
                disabled={isLoading || !recipeTitle}
              >
                {isLoading ? 'Generating...' : 'Generate Blog Post'}
              </button>
              
              <button 
                className="generate-images-button generate-button"
                onClick={handleGenerateBlogImages} 
                disabled={isGeneratingBlogImages || isLoading || !editor || !(editor.getHTML().length > 100)}
                style={{ marginLeft: '10px', backgroundColor: '#4a7c59' }}
              >
                {isGeneratingBlogImages ? 'Generating Images...' : 'Generate Blog Images'}
              </button>
              
              {false && (
  <button 
    className="external-link-button generate-button"
    onClick={handleInsertExternalLinks} 
    disabled={isInsertingLinks || isLoading || !editor || !(editor.getHTML().length > 100)}
    style={{ marginLeft: '10px', backgroundColor: '#4a7c59' }}
  >
    {isInsertingLinks ? 'Inserting Links...' : 'Add External Links'}
  </button>
) }
              
              <div className="image-generation-section">
                
                
                {Object.keys(blogImages).length > 0 && (
                  <button 
                    className="insert-images-button"
                    onClick={insertBlogImages}
                  >
                    Insert Images into Blog Post
                  </button>
                )}
                
                {/* Display generated blog images */}
                {Object.keys(blogImages).length > 0 && (
                  <div className="blog-images-preview">
                    <h3>Generated Blog Images</h3>
                    <div className="image-grid">
                      {blogImages.intro && (
  <div className="image-preview-item">
    <h4>Intro Image</h4>
    <img src={blogImages.intro} alt="Intro" className="preview-image" />
    <button 
      className="compress-webp-button" 
      onClick={() => handleCompressWebP(blogImages.intro, 'intro')}
      disabled={convertingBlogImages.intro}
    >
      {convertingBlogImages.intro ? 'Converting...' : 'Compress WebP'}
    </button>
  </div>
)}
                      {blogImages.ingredients && (
  <div className="image-preview-item">
    <h4>Ingredients Image</h4>
    <img src={blogImages.ingredients} alt="Ingredients" className="preview-image" />
    <button 
      className="compress-webp-button" 
      onClick={() => handleCompressWebP(blogImages.ingredients, 'ingredients')}
      disabled={convertingBlogImages.ingredients}
    >
      {convertingBlogImages.ingredients ? 'Converting...' : 'Compress WebP'}
    </button>
  </div>
)}
                      {blogImages.recipe && (
  <div className="image-preview-item">
    <h4>Recipe Image</h4>
    <img src={blogImages.recipe} alt="Final Dish" className="preview-image" />
    <button 
      className="compress-webp-button" 
      onClick={() => handleCompressWebP(blogImages.recipe, 'recipe')}
      disabled={convertingBlogImages.recipe}
    >
      {convertingBlogImages.recipe ? 'Converting...' : 'Compress WebP'}
    </button>
  </div>
)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && <div className={error.includes('successfully') ? "success-message" : "error-message"}>{error}</div>}
            {blogImageError && (
              <div className="error-message">
                {blogImageError}
              </div>
            )}
            {successMessage && (
              <div className="success-message">
                {successMessage}
              </div>
            )}

            <div className="output-section">
              <h2>Generated Content</h2>
              
              {/* Rich Text Editor Toolbar */}
              <div className="editor-toolbar">
                <button onClick={() => editor?.chain().focus().toggleBold().run()} className="toolbar-button" title="Bold">
                  <strong>B</strong>
                </button>
                <button onClick={() => editor?.chain().focus().toggleItalic().run()} className="toolbar-button" title="Italic">
                  <em>I</em>
                </button>
                <button onClick={() => editor?.chain().focus().toggleUnderline().run()} className="toolbar-button" title="Underline">
                  <u>U</u>
                </button>
                <button onClick={() => editor?.chain().focus().toggleStrike().run()} className="toolbar-button" title="Strike">
                  <s>S</s>
                </button>
                <span className="toolbar-divider">|</span>
                
                <button onClick={() => editor?.chain().focus().setParagraph().run()} className="toolbar-button" title="Paragraph">
                  P
                </button>
                <button onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className="toolbar-button" title="Heading 1">
                  H1
                </button>
                <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className="toolbar-button" title="Heading 2">
                  H2
                </button>
                <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className="toolbar-button" title="Heading 3">
                  H3
                </button>
                <span className="toolbar-divider">|</span>
                
                <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className="toolbar-button" title="Bullet List">
                  • List
                </button>
                <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="toolbar-button" title="Ordered List">
                  1. List
                </button>
                <span className="toolbar-divider">|</span>
                
                <button onClick={() => editor?.chain().focus().setTextAlign('left').run()} className="toolbar-button" title="Align Left">
                  ←
                </button>
                <button onClick={() => editor?.chain().focus().setTextAlign('center').run()} className="toolbar-button" title="Align Center">
                  ↔
                </button>
                <button onClick={() => editor?.chain().focus().setTextAlign('right').run()} className="toolbar-button" title="Align Right">
                  →
                </button>
                <span className="toolbar-divider">|</span>
                
                <button 
                  onClick={() => {
                    const url = prompt('Enter link URL:');
                    if (url) {
                      editor?.chain().focus().setLink({ href: url }).run();
                    }
                  }} 
                  className="toolbar-button" 
                  title="Insert Link"
                >
                  🔗 Link
                </button>
                <button 
                  onClick={() => {
                    const url = prompt('Enter image URL:');
                    if (url) {
                      editor?.chain().focus().setImage({ src: url }).run();
                    }
                  }} 
                  className="toolbar-button" 
                  title="Insert Image"
                >
                  🖼️ Image
                </button>
              </div>
              
              <EditorContent editor={editor} className="tiptap-editor" />
              
              {/* Hidden ImagePlacer component */}
              <ImagePlacer 
                articleContent={editor ? editor.getHTML() : ''}
                onGenerationStart={() => setIsGeneratingBlogImages(true)}
                onGenerationComplete={() => setIsGeneratingBlogImages(false)}
                onError={(error) => {
                  setBlogImageError(error);
                  setIsGeneratingBlogImages(false);
                }}
                onImagesGenerated={(images) => {
                  console.log('Images generated:', images);
                  setIsGeneratingBlogImages(false);
                  // Show success message
                  setBlogImageError(null);
                }}
              />
              <button 
                className="download-button"
                onClick={() => {
                  const htmlContent = editor?.getHTML();
                  if (htmlContent) {
                    const blob = new Blob([htmlContent], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'blogPost.html';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
                }}
              >
                Download HTML
              </button>
            </div>
          </div>
        </div>

        <div className="sidebar">
          <div className="sidebar-tabs">
            <button 
              className={`tab-button ${activeTab === 'seo' ? 'active' : ''}`}
              onClick={() => setActiveTab('seo')}
            >
              SEO
            </button>
            <button 
              className={`tab-button ${activeTab === 'image' ? 'active' : ''}`}
              onClick={() => setActiveTab('image')}
            >
              Image
            </button>
            <button 
              className={`tab-button ${activeTab === 'wordpress' ? 'active' : ''}`}
              onClick={() => setActiveTab('wordpress')}
            >
              WordPress
            </button>
            <button 
              className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>

          <div className="sidebar-content">
            {/* SEO Tab Content */}
            {activeTab === 'seo' && (
              <>
                <h2>SEO Suggestions</h2>
                {isSidebarContentVisible ? (
                  <>
                    {isGeneratingSidebarContent && <div className="loading-indicator">Generating sidebar content...</div>}
                    
                    {/* Title Section */}
                    <div className="sidebar-section">
                      <h3>Title Suggestions</h3>
                      {generatedTitles.length > 0 ? (
                        generatedTitles.map((title, index) => (
                          <div key={index} className={`generated-item ${selectedTitle === title.text ? 'selected' : ''}`}>
                            <input
                              type="radio"
                              name="selectedTitleRadio"
                              id={`title-${index}`}
                              value={title.text}
                              checked={selectedTitle === title.text}
                              onChange={() => handleSelectTitle(title.text)}
                              style={{ marginRight: '10px', verticalAlign: 'top' }}
                            />
                            <label htmlFor={`title-${index}`} style={{ display: 'inline-block', width: 'calc(100% - 30px)' }}>
                              <p style={{ marginTop: '0', marginBottom: '5px' }}>{title.text}</p>
                              <div className="score-bar-placeholder" style={{ width: `${title.score}%`, backgroundColor: title.score > 70 ? 'green' : title.score > 40 ? 'orange' : 'red', height: '5px', marginTop: '5px' }}></div>
                              <small>Score: {title.score}%</small>
                            </label>
                          </div>
                        ))
                      ) : (
                        !isGeneratingSidebarContent && <p>No titles generated yet.</p>
                      )}
                      <button onClick={() => setError('Additional titles are now generated automatically from Flow 1 output')} disabled={generatedTitles.length >= 3}>
                        View Titles ( {generatedTitles.length} / 3 )
                      </button>
                      <button onClick={handleCleanTitles} disabled={isGeneratingSidebarContent || generatedTitles.length <= 1 || !selectedTitle}>
                        Clean Titles
                      </button>
                    </div>

                    {/* Meta Description Section */}
                    <div className="sidebar-section">
                      <h3>Meta Description</h3>
                      {generatedMetaDescriptions.length > 0 ? (
                        generatedMetaDescriptions.map((desc, index) => (
                          <div key={index} className={`generated-item ${selectedMetaDescription === desc ? 'selected' : ''}`}>
                            <input
                              type="radio"
                              name="selectedMetaDescRadio"
                              id={`meta-${index}`}
                              value={desc}
                              checked={selectedMetaDescription === desc}
                              onChange={() => handleSelectMetaDescription(desc)}
                              style={{ marginRight: '10px', verticalAlign: 'top' }}
                            />
                            <label htmlFor={`meta-${index}`} style={{ display: 'inline-block', width: 'calc(100% - 30px)' }}>
                              <p style={{ marginTop: '0', marginBottom: '5px' }}>{desc}</p>
                              <small>Length: {desc.length}</small>
                            </label>
                          </div>
                        ))
                      ) : (
                        !isGeneratingSidebarContent && <p>No meta descriptions generated yet.</p>
                      )}
                      <button onClick={generateAdditionalMetaDescription} disabled={isGeneratingSidebarContent || generatedMetaDescriptions.length >= 3}>
                        Generate More ( {generatedMetaDescriptions.length} / 3 )
                      </button>
                      <button onClick={handleCleanMetaDescriptions} disabled={isGeneratingSidebarContent || generatedMetaDescriptions.length <= 1 || !selectedMetaDescription}>
                        Clean Descriptions
                      </button>
                    </div>

                    {/* Keywords Section */}
                    <div className="sidebar-section">
                      <h3>Keywords</h3>
                      {extractedKeywords.length > 0 ? (
                        <div className="keywords-list">
                          {extractedKeywords.map((keyword, index) => (
                            <span key={index} className="keyword-tag">{keyword}</span>
                          ))}
                        </div>
                      ) : (
                        !isGeneratingSidebarContent && <p>No keywords extracted yet.</p>
                      )}
                      <button onClick={handleCopyKeywords} disabled={isGeneratingSidebarContent || extractedKeywords.length === 0}>
                        Copy Keywords
                      </button>
                      <small>Note: Trend/competitor data requires external tools and is not available.</small>
                    </div>
                  </>
                ) : (
                  !isLoading && <p>Generate a blog post to see SEO suggestions.</p>
                )}
              </>
            )}

            {/* Image Generation Tab Content */}
            {activeTab === 'image' && (
              <div className="image-generation-tab">
                <h2>Recipe Image Generation</h2>
                
                <div className="service-selector">
                  <h3>Select Image Service</h3>
                  <div className="radio-group">
                    {imageGenerationServices.map(service => (
                      <label key={service.id} className="radio-label">
                        <input
                          type="radio"
                          name="imageService"
                          value={service.id}
                          checked={selectedImageService === service.id}
                          onChange={() => {
                            setSelectedImageService(service.id);
                            localStorage.setItem('preferredImageService', service.id);
                          }}
                        />
                        {service.name}
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="image-service-info">
                  {selectedImageService === 'stability' ? (
                    <>
                      <p>Using <strong>Stability AI</strong> for image generation.</p>
                      <p>API Key Status: {apiKeys.stabilityAi ? '✅ Set' : '❌ Not Set'}</p>
                      {!apiKeys.stabilityAi && (
                        <p className="warning-text">Please add your Stability AI API key in the Settings tab.</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p>Using <strong>Leonardo AI</strong> for image generation.</p>
                      <p>API Key Status: {apiKeys.leonardoAi ? '✅ Set' : '❌ Not Set'}</p>
                      {!apiKeys.leonardoAi && (
                        <p className="warning-text">Please add your Leonardo AI API key in the Settings tab.</p>
                      )}
                    </>
                  )}
                </div>
                
                <div className="sidebar-section">
                  <button 
                    className="generate-image-button"
                    onClick={generateImage}
                    disabled={isGeneratingImage || !recipeTitle}
                  >
                    {isGeneratingImage ? 'Generating...' : 'Generate Recipe Image'}
                  </button>
                  
                  {/* Display generated image or error */}
                  {(generatedImageUrl || imageGenerationError || isConverting) && (
                    <div className="image-result-container">
                      {isConverting ? (
                        <div className="conversion-animation" style={{ backgroundColor: 'black', padding: '20px', borderRadius: '5px' }}>
                          <div className="conversion-text" style={{ 
                            color: '#00ff00', 
                            fontFamily: 'Verdana, sans-serif',
                            marginBottom: '15px',
                            minHeight: '100px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <p style={{ margin: '5px 0' }}>{conversionStep}</p>
                          </div>
                          <div className="progress-container" style={{ 
                            width: '100%', 
                            height: '20px', 
                            backgroundColor: '#333',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div className="progress-bar" style={{ 
                              width: `${conversionProgress}%`, 
                              height: '100%', 
                              backgroundColor: '#00ff00',
                              backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent)',
                              backgroundSize: '20px 20px'
                            }}></div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {generatedImageUrl && (
                            <div className="generated-image">
                              <img src={generatedImageUrl} alt={recipeTitle} />
                              <button 
                                className="compress-webp-button"
                                onClick={convertToWebP}
                                disabled={isConverting}
                                style={{
                                  marginTop: '10px',
                                  padding: '8px 16px',
                                  backgroundColor: '#4CAF50',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                Compress WebP
                              </button>
                            </div>
                          )}
                          {imageGenerationError && (
                            <div className="error-message">
                              {imageGenerationError}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="image-generation-instructions">
                  <h3>Blog Image Generation</h3>
                  <ol>
                    <li>First, generate a blog post using the "Generate Blog Post" button</li>
                    <li>Once the blog is generated, click the "Generate Blog Images" button</li>
                    <li>Images will be automatically inserted into your article</li>
                  </ol>
                </div>
              </div>
            )}

            {/* WordPress Tab Content */}
            {activeTab === 'wordpress' && (
              <div className="wordpress-tab">
                <h2>WordPress Connection</h2>
                
                {!wordpressSettings.isConnected ? (
                  <div className="sidebar-section">
                    <h3>Connect to WordPress</h3>
                    <div className="wordpress-form">
                      <div className="form-group">
                        <label>WordPress Site URL</label>
                        <input
                          type="text"
                          value={wordpressSettings.url}
                          onChange={(e) => handleWpSettingsChange('url', e.target.value)}
                          placeholder="https://yoursite.com"
                        />
                        <small>Include https:// and no trailing slash</small>
                      </div>
                      
                      <div className="form-group">
                        <label>Username</label>
                        <input
                          type="text"
                          value={wordpressSettings.username}
                          onChange={(e) => handleWpSettingsChange('username', e.target.value)}
                          placeholder="WordPress username"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Application Password</label>
                        <input
                          type="password"
                          value={wordpressSettings.password}
                          onChange={(e) => handleWpSettingsChange('password', e.target.value)}
                          placeholder="WordPress application password"
                        />
                        <small>
                          <a 
                            href="https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            How to create an application password
                          </a>
                        </small>
                        <small className="password-note">
                          Note: You must use an account with Author, Editor, or Administrator role that has permission to create posts.
                        </small>
                      </div>
                      
                      <button 
                        className="wordpress-connect-button"
                        onClick={connectToWordPress}
                        disabled={isConnecting}
                      >
                        {isConnecting ? 'Connecting...' : 'Connect to WordPress'}
                      </button>
                      
                      {connectionError && (
                        <div className="error-message">
                          {connectionError}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="sidebar-section">
                    <div className="connection-status connected">
                      <span className="status-dot"></span>
                      Connected to {wordpressSettings.url}
                      <button 
                        className="disconnect-button"
                        onClick={() => handleWpSettingsChange('isConnected', false)}
                      >
                        Disconnect
                      </button>
                    </div>
                    
                    <h3>Publish Settings</h3>
                    
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(Number(e.target.value))}
                      >
                        <option value="">Select a category</option>
                        {wpCategories.length > 0 ? (
                          wpCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} ({cat.count})
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No categories found</option>
                        )}
                      </select>
                      {wpCategories.length === 0 && wordpressSettings.isConnected && (
                        <small className="warning-text">
                          No categories found. Please create at least one category in WordPress.
                        </small>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label>Post Status</label>
                      <select
                        value={postStatus}
                        onChange={(e) => setPostStatus(e.target.value)}
                      >
                        <option value="draft">Draft</option>
                        <option value="publish">Publish</option>
                      </select>
                    </div>
                    
                    <div className="publishing-summary">
                      <h4>Publishing Summary</h4>
                      <div className="publish-options">
                        <div className="publish-option">
                          <input
                            type="checkbox"
                            id="includeTitle"
                            checked={publishOptions.includeTitle}
                            onChange={() => handlePublishOptionChange('includeTitle')}
                          />
                          <label htmlFor="includeTitle">
                            <strong>Title:</strong> {recipeTitle || 'Not set'}
                          </label>
                        </div>
                        
                        <div className="publish-option">
                          <input
                            type="checkbox"
                            id="includeFocusKeyword"
                            checked={publishOptions.includeFocusKeyword}
                            onChange={() => handlePublishOptionChange('includeFocusKeyword')}
                          />
                          <label htmlFor="includeFocusKeyword">
                            <strong>Focus Keyword:</strong> {focusKeyword || 'Not set'}
                          </label>
                        </div>
                        
                        <div className="publish-option">
                          <input
                            type="checkbox"
                            id="includeSlug"
                            checked={publishOptions.includeSlug}
                            onChange={() => handlePublishOptionChange('includeSlug')}
                          />
                          <label htmlFor="includeSlug">
                            <strong>Slug:</strong> {focusKeyword ? focusKeyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'Will be auto-generated'}
                          </label>
                        </div>
                        
                        <div className="publish-option">
                          <input
                            type="checkbox"
                            id="includeMetaDescription"
                            checked={publishOptions.includeMetaDescription}
                            onChange={() => handlePublishOptionChange('includeMetaDescription')}
                          />
                          <label htmlFor="includeMetaDescription">
                            <strong>Meta Description:</strong> {selectedMetaDescription ? `${selectedMetaDescription.substring(0, 50)}...` : 'Not selected'}
                          </label>
                        </div>
                        
                        <div className="publish-option">
                          <input
                            type="checkbox"
                            id="includeFeaturedImage"
                            checked={publishOptions.includeFeaturedImage}
                            onChange={() => handlePublishOptionChange('includeFeaturedImage')}
                          />
                          <label htmlFor="includeFeaturedImage">
                            <strong>Featured Image:</strong> {generatedImageUrl ? 'Will use generated image' : 'None'}
                          </label>
                        </div>
                        
                        <div className="publish-option">
                          <input
                            type="checkbox"
                            id="includeTags"
                            checked={publishOptions.includeTags}
                            onChange={() => handlePublishOptionChange('includeTags')}
                          />
                          <label htmlFor="includeTags">
                            <strong>Tags:</strong> {extractedKeywords.length > 0 ? extractedKeywords.join(', ') : 'None'}
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      className="wordpress-publish-button"
                      onClick={publishToWordPress}
                      disabled={isPublishing || !editor}
                    >
                      {isPublishing ? 'Publishing...' : `${postStatus === 'publish' ? 'Publish' : 'Save as Draft'} to WordPress`}
                    </button>
                    
                    {publishingResult && (
                      <div className={`publishing-result ${publishingResult.success ? 'success' : 'error'}`}>
                        <p>{publishingResult.message}</p>
                        {publishingResult.link && (
                          <a 
                            href={publishingResult.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="view-post-link"
                          >
                            View Post
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab Content */}
            {activeTab === 'settings' && (
              <div className="settings-tab">
                <h2>API Settings</h2>
                
                <div className="sidebar-section">
                  <h3>OpenRouter API Key</h3>
                  <input
                    type="password"
                    value={apiKeys.openRouter}
                    onChange={(e) => handleApiKeyChange('openRouter', e.target.value)}
                    placeholder="Enter your OpenRouter API key"
                  />
                  <p className="settings-info">Required for blog generation</p>
                </div>
                
                <div className="sidebar-section">
                  <h3>Image Generation API Keys</h3>
                  <div className="api-key-input">
                    <label>Stability AI</label>
                    <input
                      type="password"
                      value={apiKeys.stabilityAi}
                      onChange={(e) => handleApiKeyChange('stabilityAi', e.target.value)}
                      placeholder="Enter your Stability AI API key"
                    />
                    <a href="https://platform.stability.ai/" target="_blank" rel="noopener noreferrer">Get API key</a>
                  </div>
                  
                  <div className="api-key-input">
                    <label>Leonardo AI</label>
                    <input
                      type="password"
                      value={apiKeys.leonardoAi}
                      onChange={(e) => handleApiKeyChange('leonardoAi', e.target.value)}
                      placeholder="Enter your Leonardo AI API key"
                    />
                    <a href="https://leonardo.ai/api" target="_blank" rel="noopener noreferrer">Get API key</a>
                  </div>
                </div>
                
                <div className="sidebar-section">
                  <h3>Model Selection</h3>
                  <div className="model-selector">
                    <div className="model-group">
                      <label>Primary Model:</label>
                      <select
                        value={selectedModel1}
                        onChange={(e) => setSelectedModel1(e.target.value)}
                      >
                        {models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="model-group">
                      <label>Secondary Model (DeepSeek):</label>
                      <select
                        value={selectedModel2}
                        onChange={(e) => setSelectedModel2(e.target.value)}
                      >
                        {models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Function to insert external links directly into the editor content
const insertExternalLinksIntoEditor = async (editor: any, links: string[]) => {
  if (!editor || !links.length) return;
  
  try {
    // Get the HTML content
    const content = editor.getHTML();
    
    // Find suitable locations for links
    const paragraphs = content.match(/<p>[^<]+<\/p>/g) || [];
    
    if (paragraphs.length < 3) {
      console.warn('Not enough paragraphs to insert links');
      return;
    }
    
    // Insert first link in one of the first 3 paragraphs
    if (links.length >= 1) {
      const firstLinkTarget = paragraphs[Math.min(1, paragraphs.length - 1)];
      const firstLinkText = firstLinkTarget.replace(/<\/?p>/g, '');
      
      // Find a good word or phrase to link (at least 3 words long)
      const words = firstLinkText.split(' ');
      if (words.length >= 5) {
        const anchorText = words.slice(1, 3).join(' '); // Use 3 words in the middle
        const newText = firstLinkText.replace(
          anchorText,
          `<a href="${links[0]}" target="_blank" rel="noopener">${anchorText}</a>`
        );
        
        // Replace the paragraph in the editor
        editor.commands.setContent(
          editor.getHTML().replace(firstLinkTarget, `<p>${newText}</p>`)
        );
      }
    }
    
    // Insert second link around the middle of the article
    if (links.length >= 2 && paragraphs.length >= 6) {
      const midIndex = Math.floor(paragraphs.length / 2);
      const secondLinkTarget = paragraphs[midIndex];
      const secondLinkText = secondLinkTarget.replace(/<\/?p>/g, '');
      
      // Find a good word or phrase to link
      const words = secondLinkText.split(' ');
      if (words.length >= 5) {
        const anchorText = words.slice(1, 3).join(' '); // Use 3 words in the middle
        const newText = secondLinkText.replace(
          anchorText,
          `<a href="${links.length >= 2 ? links[1] : links[0]}" target="_blank" rel="noopener">${anchorText}</a>`
        );
        
        // Replace the paragraph in the editor
        editor.commands.setContent(
          editor.getHTML().replace(secondLinkTarget, `<p>${newText}</p>`)
        );
      }
    }
    
    console.log('Links inserted into editor content');
  } catch (error) {
    console.error('Error inserting links into editor:', error);
    throw error;
  }
}

export default App;