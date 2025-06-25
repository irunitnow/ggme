'use client'

import { useState, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { generateImage, generateBlogImages } from '@/services/imageGenerator'
import { generateImagePrompts, ImagePrompts } from '@/services/imagePromptGenerator'
import { ImagePlacer } from '@/components/ImagePlacer'

// Import all the prompt templates
import { RECIPE_ARTICLE_PROMPT_TEMPLATE } from '@/recipeArticlePrompt'
import { RECIPE_ARTICLE_FLOW2_PROMPT_TEMPLATE } from '@/recipeArticleFlow2Prompt'
import { FLOW3_EXTERNAL_LINK_INSERTION_PROMPT } from '@/flow3ExternalLinkPrompt'

interface ApiKeys {
  openRouter?: string
  stabilityAi?: string
  leonardoAi?: string
  wordpressUrl?: string
  wordpressUsername?: string
  wordpressPassword?: string
}

interface GeneratedContent {
  title: string
  content: string
  keywords: string[]
  metaDescription: string
}

export default function Home() {
  const [recipeTitle, setRecipeTitle] = useState('')
  const [focusKeyword, setFocusKeyword] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [selectedModel, setSelectedModel] = useState('openrouter/auto')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [generatedImages, setGeneratedImages] = useState<{ [key: string]: string }>({})
  const [activeTab, setActiveTab] = useState('images')
  const [apiKeys, setApiKeys] = useState<ApiKeys>({})
  const [editor, setEditor] = useState<Editor | null>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Available AI models
  const models = [
    { id: 'openrouter/auto', name: 'Auto (Best Available)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
    { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B' }
  ]

  // Load API keys from localStorage on component mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('apiKeys')
    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys))
      } catch (e) {
        console.error('Failed to parse saved API keys:', e)
      }
    }
  }, [])

  // Initialize TipTap editor
  useEffect(() => {
    const editorInstance = new Editor({
      extensions: [
        StarterKit,
        Heading.configure({
          levels: [1, 2, 3]
        }),
        Image,
        Link.configure({
          openOnClick: false
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph']
        }),
        Underline
      ],
      content: generatedContent?.content || '<p>Your generated content will appear here...</p>',
      editorProps: {
        attributes: {
          class: 'tiptap-editor'
        }
      }
    })

    setEditor(editorInstance)

    return () => {
      editorInstance.destroy()
    }
  }, [])

  // Update editor content when generatedContent changes
  useEffect(() => {
    if (editor && generatedContent) {
      editor.commands.setContent(generatedContent.content)
    }
  }, [editor, generatedContent])

  const callOpenRouterApi = async (prompt: string): Promise<string> => {
    const apiUrl = 'https://openrouter.ai/api/v1/chat/completions'
    
    if (!apiKeys.openRouter) {
      throw new Error('OpenRouter API key is missing')
    }
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeys.openRouter}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4000
        })
      })
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }
      
      const data = await response.json()
      return data.choices?.[0]?.message?.content || ''
    } catch (error) {
      console.error('Error calling OpenRouter API:', error)
      throw error
    }
  }

  const generateContent = async () => {
    if (!recipeTitle.trim() || !focusKeyword.trim()) {
      setError('Please enter both recipe title and focus keyword')
      return
    }

    if (!apiKeys.openRouter) {
      setError('Please configure your OpenRouter API key in the Settings tab')
      return
    }

    setIsGenerating(true)
    setError('')
    setSuccess('')

    try {
      // Step 1: Generate the detailed plan
      const step1Prompt = RECIPE_ARTICLE_PROMPT_TEMPLATE
        .replace(/\${USER_INPUT_RECIPE_TITLE}/g, recipeTitle)
        .replace(/\${USER_INPUT_FOCUS_KEYWORD}/g, focusKeyword)

      console.log('Generating article plan...')
      const planContent = await callOpenRouterApi(step1Prompt)

      // Step 2: Generate the full article from the plan
      const step2Prompt = RECIPE_ARTICLE_FLOW2_PROMPT_TEMPLATE
        .replace('${FLOW_1_OUTPUT}', planContent)

      console.log('Generating full article...')
      const articleContent = await callOpenRouterApi(step2Prompt)

      // Extract title from the generated content
      const titleMatch = articleContent.match(/<h1[^>]*>(.*?)<\/h1>/i)
      const extractedTitle = titleMatch ? titleMatch[1].trim() : recipeTitle

      // Generate meta description (simplified)
      const metaDescription = `Learn how to make ${focusKeyword} with this easy recipe. Perfect for any occasion!`

      // Extract keywords (simplified)
      const keywords = [focusKeyword, recipeTitle, 'recipe', 'cooking', 'food']

      setGeneratedContent({
        title: extractedTitle,
        content: articleContent,
        keywords,
        metaDescription
      })

      setSuccess('Content generated successfully!')
    } catch (error) {
      console.error('Error generating content:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate content')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateImages = async () => {
    if (!generatedContent) {
      setError('Please generate content first')
      return
    }

    if (!apiKeys.stabilityAi && !apiKeys.leonardoAi) {
      setError('Please configure at least one image generation API key (Stability AI or Leonardo AI)')
      return
    }

    setIsGeneratingImages(true)
    setError('')

    try {
      // Generate image prompts
      const imagePrompts = await generateImagePrompts(
        generatedContent.content,
        selectedModel,
        apiKeys.openRouter || ''
      )

      // Determine which service to use
      const service = apiKeys.stabilityAi ? 'stability' : 'leonardo'
      const apiKey = service === 'stability' ? apiKeys.stabilityAi : apiKeys.leonardoAi

      // Generate images
      const images = await generateBlogImages(imagePrompts, apiKey!, service)
      setGeneratedImages(images)
      setSuccess('Images generated successfully!')
    } catch (error) {
      console.error('Error generating images:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate images')
    } finally {
      setIsGeneratingImages(false)
    }
  }

  const insertImagesIntoEditor = () => {
    if (!editor || Object.keys(generatedImages).length === 0) return

    // Insert images at strategic points in the content
    Object.entries(generatedImages).forEach(([key, imageUrl], index) => {
      const altText = `${key.replace('_', ' ')} for ${focusKeyword}`
      editor.commands.insertContent(`<p><img src="${imageUrl}" alt="${altText}" class="generated-image" /></p>`)
    })

    setSuccess('Images inserted into the editor!')
  }

  const downloadContent = () => {
    if (!generatedContent || !editor) return

    const content = editor.getHTML()
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${generatedContent.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="layout-container">
      <div className="main-content">
        <div className="app-header">
          <h1>AI SEO Blog Generator</h1>
          <p>Create professional recipe articles with AI-powered content and images</p>
        </div>

        <div className="input-section">
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="recipeTitle">Recipe Title</label>
              <input
                id="recipeTitle"
                type="text"
                value={recipeTitle}
                onChange={(e) => setRecipeTitle(e.target.value)}
                placeholder="e.g., Classic Chocolate Chip Cookies"
              />
            </div>
            <div className="input-group">
              <label htmlFor="focusKeyword">Focus Keyword</label>
              <input
                id="focusKeyword"
                type="text"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder="e.g., chocolate chip cookies"
              />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label htmlFor="difficulty">Difficulty Level</label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="model">AI Model</label>
              <select
                id="model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="button-group">
            <button
              className="generate-button"
              onClick={generateContent}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Content'}
            </button>
            <button
              className="generate-images-button"
              onClick={generateImages}
              disabled={isGeneratingImages || !generatedContent}
            >
              {isGeneratingImages ? 'Generating Images...' : 'Generate Images'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>

        <div className="output-section">
          {editor && (
            <div className="editor-container">
              <div className="editor-toolbar">
                <button
                  className="toolbar-button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  className="toolbar-button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  title="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  className="toolbar-button"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  title="Underline"
                >
                  <u>U</u>
                </button>
                <span className="toolbar-divider">|</span>
                <button
                  className="toolbar-button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  title="Heading 1"
                >
                  H1
                </button>
                <button
                  className="toolbar-button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  className="toolbar-button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  title="Heading 3"
                >
                  H3
                </button>
                <span className="toolbar-divider">|</span>
                <button
                  className="toolbar-button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  title="Bullet List"
                >
                  •
                </button>
                <button
                  className="toolbar-button"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  title="Numbered List"
                >
                  1.
                </button>
              </div>
              <div className="tiptap-editor" />
            </div>
          )}

          {Object.keys(generatedImages).length > 0 && (
            <div className="blog-images-section">
              <div className="section-header">
                <h3>Generated Images</h3>
                <button
                  className="insert-images-button"
                  onClick={insertImagesIntoEditor}
                >
                  Insert Images into Editor
                </button>
              </div>
              <div className="image-grid">
                {Object.entries(generatedImages).map(([key, imageUrl]) => (
                  <div key={key} className="image-preview-card">
                    <div className="image-container">
                      <img src={imageUrl} alt={`${key} for ${focusKeyword}`} />
                    </div>
                    <div className="image-actions">
                      <h4>{key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {generatedContent && (
            <div className="action-buttons">
              <button className="download-button" onClick={downloadContent}>
                Download HTML
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar">
        <div className="sidebar-tabs">
          <button
            className={`tab-button ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            Images
          </button>
          <button
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button
            className={`tab-button ${activeTab === 'wordpress' ? 'active' : ''}`}
            onClick={() => setActiveTab('wordpress')}
          >
            WordPress
          </button>
        </div>

        <div className="sidebar-content">
          {activeTab === 'images' && (
            <div className="image-generation-tab">
              <h2>Image Generation</h2>
              <div className="service-selector">
                <h3>Image Service</h3>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="imageService"
                      value="stability"
                      defaultChecked
                    />
                    Stability AI
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="imageService"
                      value="leonardo"
                    />
                    Leonardo AI
                  </label>
                </div>
              </div>
              <div className="image-service-info">
                <p>Configure your API keys in the Settings tab to enable image generation.</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              <h2>API Settings</h2>
              <div className="form-group">
                <label htmlFor="openRouterKey">OpenRouter API Key</label>
                <input
                  id="openRouterKey"
                  type="password"
                  value={apiKeys.openRouter || ''}
                  onChange={(e) => {
                    const newKeys = { ...apiKeys, openRouter: e.target.value }
                    setApiKeys(newKeys)
                    localStorage.setItem('apiKeys', JSON.stringify(newKeys))
                  }}
                  placeholder="Enter your OpenRouter API key"
                />
                <small>Required for content generation</small>
              </div>
              <div className="form-group">
                <label htmlFor="stabilityKey">Stability AI API Key</label>
                <input
                  id="stabilityKey"
                  type="password"
                  value={apiKeys.stabilityAi || ''}
                  onChange={(e) => {
                    const newKeys = { ...apiKeys, stabilityAi: e.target.value }
                    setApiKeys(newKeys)
                    localStorage.setItem('apiKeys', JSON.stringify(newKeys))
                  }}
                  placeholder="Enter your Stability AI API key"
                />
                <small>Optional: For image generation</small>
              </div>
              <div className="form-group">
                <label htmlFor="leonardoKey">Leonardo AI API Key</label>
                <input
                  id="leonardoKey"
                  type="password"
                  value={apiKeys.leonardoAi || ''}
                  onChange={(e) => {
                    const newKeys = { ...apiKeys, leonardoAi: e.target.value }
                    setApiKeys(newKeys)
                    localStorage.setItem('apiKeys', JSON.stringify(newKeys))
                  }}
                  placeholder="Enter your Leonardo AI API key"
                />
                <small>Optional: Alternative for image generation</small>
              </div>
            </div>
          )}

          {activeTab === 'wordpress' && (
            <div className="wordpress-tab">
              <h2>WordPress Integration</h2>
              <div className="form-group">
                <label htmlFor="wpUrl">WordPress Site URL</label>
                <input
                  id="wpUrl"
                  type="url"
                  value={apiKeys.wordpressUrl || ''}
                  onChange={(e) => {
                    const newKeys = { ...apiKeys, wordpressUrl: e.target.value }
                    setApiKeys(newKeys)
                    localStorage.setItem('apiKeys', JSON.stringify(newKeys))
                  }}
                  placeholder="https://yoursite.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="wpUsername">Username</label>
                <input
                  id="wpUsername"
                  type="text"
                  value={apiKeys.wordpressUsername || ''}
                  onChange={(e) => {
                    const newKeys = { ...apiKeys, wordpressUsername: e.target.value }
                    setApiKeys(newKeys)
                    localStorage.setItem('apiKeys', JSON.stringify(newKeys))
                  }}
                  placeholder="WordPress username"
                />
              </div>
              <div className="form-group">
                <label htmlFor="wpPassword">Application Password</label>
                <input
                  id="wpPassword"
                  type="password"
                  value={apiKeys.wordpressPassword || ''}
                  onChange={(e) => {
                    const newKeys = { ...apiKeys, wordpressPassword: e.target.value }
                    setApiKeys(newKeys)
                    localStorage.setItem('apiKeys', JSON.stringify(newKeys))
                  }}
                  placeholder="WordPress application password"
                />
                <small>
                  <a href="https://wordpress.org/support/article/application-passwords/" target="_blank" rel="noopener noreferrer">
                    How to create application passwords
                  </a>
                </small>
              </div>
              <button className="wordpress-publish-button" disabled>
                Publish to WordPress
              </button>
            </div>
          )}
        </div>
      </div>

      <ImagePlacer
        articleContent={generatedContent?.content || ''}
        onImagesGenerated={setGeneratedImages}
        onError={setError}
        onGenerationStart={() => setIsGeneratingImages(true)}
        onGenerationComplete={() => setIsGeneratingImages(false)}
      />
    </div>
  )
}