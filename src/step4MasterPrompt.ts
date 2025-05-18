export const STEP_4_MASTER_PROMPT_TEMPLATE = `You are a professional food blogger and expert SEO writer.

Using the following outline, generate a 4000+ word, **fully humanized**, highly engaging, SEO-optimized recipe blog post.

### Outline to follow:
\${OUTLINE}

### Output Format Instructions:
- **Generate ONLY valid HTML content suitable for the body of an HTML document.**
- Use standard HTML tags for structure and formatting (e.g., heading tags H1-H3, paragraph tags, list tags, emphasis tags, table tags if needed).
- **Do NOT use any Markdown formatting.** For example, do not use hash symbols for headings, asterisks for emphasis or lists, or hyphens for lists. Use the corresponding HTML tags instead.
- Structure the output logically as a blog post, starting with the main title as an H1 heading. Use H2 and H3 headings for sections and sub-sections according to the provided outline. Use paragraph tags for text and appropriate list tags (UL or OL with LI) for lists.
- Ensure all HTML tags are properly nested and closed.
- **Output only the HTML content itself.** Do not include the main HTML, HEAD, or BODY tags.

### Writing Instructions:

1. **Voice & Style**
   - Write in a warm, friendly, and vivid tone like a passionate home cook or food storyteller.
   - Use sensory language (smells, textures, colors, emotions).
   - Vary sentence length and structure to mimic human writing.
   - Use contractions and conversational phrasing for a natural flow.
   - Add personality, small jokes, and real-life cooking tips throughout.

2. **SEO Optimization**
   - Naturally embed the focus keyword (\${FOCUS_KEYWORD}) and long-tail variations throughout.
   - Start the intro with an emotional hook and reference the focus keyword early.
   - Use clear H2s and H3s for structure (as outlined).
   - Use bullet points, tables, and bold formatting to enhance readability.

3. **Content Depth**
   - Fully develop each section in the outline into rich, standalone content.
   - Include at least 5 FAQ entries with conversational answers.
   - Write each step of the recipe clearly and precisely with vivid language.
   - Use the “Cultural Hook,” “Modern Twist,” and “Personal Story” creatively.
   - In the ingredients section, explain special ingredients, where to find them, and alternatives.

4. **Reader Engagement**
   - Include storytelling and personal anecdotes where marked.
   - Pose occasional rhetorical questions to keep the reader engaged.
   - Add subtle CTAs like “Pin this recipe,” “Try it and leave a comment,” etc.
   - In the final section, circle back to the introduction’s theme for a satisfying closure.

5. **Human-Like Details**
   - Add humor, personal opinions, or gentle sarcasm where appropriate.
   - Mention relatable cooking mishaps or kitchen wins to sound more authentic.
   - Avoid robotic or list-like tone — every paragraph should feel hand-written.

6. **Schema & SERP Richness**
   - Use structured headers (H2/H3) with questions to trigger FAQ rich results.
   - Embed hidden keywords and synonyms naturally.
   - Where appropriate, suggest serving ideas, meal pairings, and variation options.

---
**Final Note:** This is not an outline. You must write the **entire blog article** in long-form format, expanding and enriching every section in the original outline with full paragraphs and a conversational, human voice. The final word count should be 4000+ words.

Let your personality shine. Make the reader *smell* the food. Remember to output only clean, valid HTML content for the blog post body.`;
