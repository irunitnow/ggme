export const STEP_1_PROMPT_TEMPLATE = 'Generate a **detailed SEO blog outline** for a recipe titled:\\n' +
'"${USER_INPUT_RECIPE_TITLE}"\\n' +
'Focus Keyword: "${USER_INPUT_FOCUS_KEYWORD}"\\n' +
'\\n' +
'Follow this EXACT structure:\\n' +
'\\n' +
'### **1. METADATA**\\n' +
'- **Meta Title**: [60 characters, includes focus keyword]\\n' +
'- **Meta Description**: [160 characters, includes focus keyword and emotional hook]\\n' +
'\\n' +
'### **2. KEYWORD STRATEGY**\\n' +
'- **Primary Keywords**:\\n' +
'  - "${FOCUS_KEYWORD}"\\n' +
'  - [2 more variations]\\n' +
'- **LSI/Long-Tail Keywords**:\\n' +
'  - [4+ semantically related phrases]\\n' +
'\\n' +
'### **3. SEARCH INTENT COVERAGE**\\n' +
'- **Informational**: [Question this answers]\\n' +
'- **Transactional**: [Product/service this mentions]\\n' +
'- **Navigational**: [Comparison this makes]\\n' +
'\\n' +
'### **4. UNIQUE ANGLES**\\n' +
'- **Cultural Hook**: [Local tradition or story]\\n' +
'- **Modern Twist**: [Dietary adaptation]\\n' +
'- **Personal Story**: [Anecdotal intro idea]\\n' +
'\\n' +
'### **5. BLOG OUTLINE (STRUCTURE)**\\n' +
'**H2: [Catchy Introduction Title]**\\n' +
'- Sensory hook (smell/taste memory)\\n' +
'- Why this recipe matters\\n' +
'\\n' +
'**H2: [Cultural Context Story]**\\n' +
'- Historical significance\\n' +
'- Personal connection\\n' +
'\\n' +
'**H2: Ingredients: [Creative Section Title]**\\n' +
'- Table with 3 columns:\\n' +
'  | Ingredient | Special Notes | Substitutions |\\n' +
'- Sourcing tips\\n' +
'\\n' +
'**H2: Step-by-Step: [Process Title]**\\n' +
'- H3: [Detailed substep 1]\\n' +
'- H3: [Detailed substep 2]\\n' +
'- Chef pro tips\\n' +
'\\n' +
'**H2: FAQ Section**\\n' +
'- 5 questions using FAQ schema\\n' +
'- Conversational answers\\n' +
'\\n' +
'**H2: [Unique Variation Idea]**\\n' +
'- Dietary adaptation\\n' +
'- Seasonal twist\\n' +
'\\n' +
'**H2: Serving & Presentation**\\n' +
'- Cultural traditions\\n' +
'- Instagram-worthy tips\\n' +
'\\n' +
'**H2: Storage & Make-Ahead**\\n' +
'- Time-saving tricks\\n' +
'\\n' +
'**H2: Final Story Hook**\\n' +
'- Callback to introduction\\n' +
'- CTA (hashtag, comment prompt)\\n' +
'\\n' +
'---\\n' +
'**Output Requirements**:\\n' +
'- Use bullet points for all sections\\n' +
'- Include placeholder notes like "[INSERT STORY]" where needed\\n' +
'- Never write full paragraphs - outline only\\n';
