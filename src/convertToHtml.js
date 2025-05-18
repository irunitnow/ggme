// This script converts a blog post from text format to HTML format.

function convertToHtml(blogPostText) {
  // Split the blog post into sections based on headings and content.
  const sections = blogPostText.split(/(\*\*.*?\*\*)/g);

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Secret Behind My Legendary Barbie Cake</title>
</head>
<body>`;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();

    if (section.startsWith("**")) {
      // This is a heading.
      const headingText = section.replace(/\*\*/g, "");
      html += `\n<h2>${headingText}</h2>\n`;
    } else if (section.startsWith("---")) {
      // This is a separator.
      html += `\n<hr>\n`;
    } else if (section.startsWith("- ")) {
        // This is a list item
        const listItemText = section.substring(2).trim();
        html += `\n<li>${listItemText}</li>\n`;
    }
     else {
      // This is a paragraph.
      html += `\n<p>${section}</p>\n`;
    }
  }

  html += `\n</body>\n</html>`;
  return html;
}

// Read the blog post text from step2Prompt.ts (simulated).
// In a real environment, you would read the file content here.
// For example:
// const fs = require('fs');
// const blogPostText = fs.readFileSync('step2Prompt.ts', 'utf8');

// Simulate reading the blog post text.
async function getBlogPostText() {
    const step2Prompt = await import('./step2Prompt');
    return step2Prompt.default;
}

async function main() {
    const blogPostText = await getBlogPostText();
    const htmlOutput = convertToHtml(blogPostText);

    // Write the HTML output to blogPost.html (simulated).
    // In a real environment, you would write the file content here.
    // For example:
    // fs.writeFileSync('blogPost.html', htmlOutput);

    console.log(htmlOutput);
}

main();
