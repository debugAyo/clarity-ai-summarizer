// Content script - extracts page text
console.log('📄 Clarity content script loaded');

function extractPageContent() {
  // Remove unwanted elements
  const unwanted = ['nav', 'header', 'footer', 'aside', 'script', 'style', '.ad', '.ads', '.sidebar'];
  unwanted.forEach(sel => {
    try {
      document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
    } catch {}
  });

  // Try common content selectors
  const selectors = ['article', 'main', '[role="main"]', '.post-content', '.article-content', '.entry-content'];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.innerText || el.textContent || '';
      if (text.length > 300) return text.trim();
    }
  }

  // Fallback: get all paragraphs
  let content = '';
  document.querySelectorAll('p').forEach(p => {
    const text = (p.innerText || p.textContent || '').trim();
    if (text.length > 50) content += text + '\n\n';
  });

  return content.trim() || document.body.innerText || '';
}

// Extract text from PDF viewers
function extractPDFText() {
  console.log('🔍 Attempting PDF text extraction...');
  
  // Method 1: PDF.js text layers (Chrome's built-in PDF viewer)
  const textLayers = document.querySelectorAll('.textLayer');
  console.log(`Found ${textLayers.length} text layers`);
  
  if (textLayers.length > 0) {
    const pdfText = Array.from(textLayers)
      .map(layer => layer.textContent || layer.innerText)
      .join('\n\n');
    if (pdfText && pdfText.trim().length > 50) {
      console.log('✅ Extracted from PDF text layers:', pdfText.length, 'chars');
      return pdfText.trim();
    }
  }

  // Method 2: Look for text in spans (alternative PDF.js structure)
  const spans = document.querySelectorAll('span[role="presentation"]');
  console.log(`Found ${spans.length} presentation spans`);
  
  if (spans.length > 10) {
    const spanText = Array.from(spans)
      .map(span => span.textContent || span.innerText)
      .join(' ');
    if (spanText && spanText.trim().length > 50) {
      console.log('✅ Extracted from PDF spans:', spanText.length, 'chars');
      return spanText.trim();
    }
  }

  // Method 3: Try all divs with text
  const divs = document.querySelectorAll('div');
  let divText = '';
  divs.forEach(div => {
    const text = div.textContent || div.innerText || '';
    if (text.length > 20 && text.length < 1000) {
      divText += text + '\n';
    }
  });
  
  if (divText.trim().length > 100) {
    console.log('✅ Extracted from PDF divs:', divText.length, 'chars');
    return divText.trim();
  }

  // Method 4: Full body text as last resort
  const bodyText = document.body.innerText || document.body.textContent;
  if (bodyText && bodyText.trim().length > 50) {
    console.log('✅ Extracted from PDF body:', bodyText.length, 'chars');
    return bodyText.trim();
  }

  console.error('❌ No PDF text found - may be image-based or not loaded yet');
  throw new Error('Could not extract text from PDF. It may be image-based (scanned) or still loading.');
}

// Listen for content requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getContent") {
    try {
      const isPDF = request.isPDF || false;
      const content = isPDF ? extractPDFText() : extractPageContent();
      sendResponse({ success: true, content });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});

console.log('✅ Content script ready (with PDF support)');
