// Clarity Summarizer v3 - Chrome AI Edition with Gemini Nano
console.log('🧠 Clarity v3 Chrome AI Edition loaded');

let selectedMode = 'quick';
let selectedLevel = 'high-school';

// ===== FIX FOR NEW HTML STRUCTURE =====
// Override document.getElementById BEFORE any other code runs
(function() {
    const originalGetElementById = document.getElementById.bind(document);
    
    document.getElementById = function(id) {
        // Map old IDs to new IDs
        const idMap = {
            'apiKey': 'apiKeyInput',
            'saveKey': 'saveApiKeyBtn',
            'testKey': 'testApiKeyBtn',
            'status': 'apiStatus'
        };

        // For mock/computed elements
        if (id === 'summaryMode') {
            return { value: selectedMode };
        }
        if (id === 'academicLevel') {
            return { value: selectedLevel };
        }
        if (id === 'exportActions') {
            const exportDiv = document.querySelector('.export-actions');
            return exportDiv || { style: { display: 'none' } };
        }
        
        const mappedId = idMap[id] || id;
        return originalGetElementById(mappedId);
    };
})();

// Helper function to display results properly
function displayResult(htmlContent, isError = false) {
    const result = document.querySelector('#result');
    const resultContent = document.querySelector('#resultContent');
    const exportActions = document.querySelector('.export-actions');
    
    if (result) {
        result.style.display = 'block';
        result.className = isError ? 'result error' : 'result';
    }
    
    if (resultContent) {
        resultContent.innerHTML = htmlContent;
    }
    
    if (exportActions && !isError) {
        exportActions.style.display = 'flex';
    }
}

// Initialize UI interactions
function initializeUIInteractions() {
    console.log('🎨 Initializing UI interactions...');
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.querySelector('.theme-icon');
    
    if (themeToggle && themeIcon) {
        // Load saved theme
        chrome.storage.local.get(['theme'], (result) => {
            const savedTheme = result.theme || 'dark';
            document.body.setAttribute('data-theme', savedTheme);
            updateThemeIcon(savedTheme);
        });
        
        // Theme toggle click handler
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.body.setAttribute('data-theme', newTheme);
            chrome.storage.local.set({ theme: newTheme });
            updateThemeIcon(newTheme);
            console.log('🎨 Theme switched to:', newTheme);
        });
        
        function updateThemeIcon(theme) {
            themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    }
    
    // Mode selection
    const modeOptions = document.querySelectorAll('.mode-option');
    modeOptions.forEach(option => {
        option.addEventListener('click', function() {
            modeOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            selectedMode = this.getAttribute('data-mode');
            console.log('✅ Mode selected:', selectedMode);
        });
    });

    // Level selection
    const levelBtns = document.querySelectorAll('.level-btn');
    levelBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            levelBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedLevel = this.getAttribute('data-level');
            console.log('✅ Level selected:', selectedLevel);
        });
    });
    
    console.log('✅ UI interactions ready');
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', async () => {
  console.log('✅ Initializing...');
  
  // Check background worker
  try {
    const ping = await chrome.runtime.sendMessage({ action: "ping" });
    if (ping?.status === "alive") {
      console.log('✅ Background worker active');
    }
  } catch (err) {
    console.warn('⚠️ Background worker check failed:', err);
  }

  // Check Chrome AI availability
  try {
    if ('ai' in window && 'summarizer' in window.ai) {
      console.log('✅ Chrome AI APIs available');
    } else {
      console.warn('⚠️ Chrome AI APIs not available - extension will use local fallback');
    }
  } catch (err) {
    console.warn('⚠️ Chrome AI check failed:', err);
  }

  // Wire up UI
  document.getElementById('summarizeBtn').addEventListener('click', summarize);
  
  // Export buttons
  const copyBtn = document.getElementById('copyBtn');
  const saveBtn = document.getElementById('saveBtn');
  const pdfBtn = document.getElementById('pdfBtn');
  const jsonBtn = document.getElementById('jsonBtn');
  const historyBtn = document.getElementById('historyBtn');
  
  if (copyBtn) copyBtn.addEventListener('click', copySummary);
  if (saveBtn) saveBtn.addEventListener('click', saveSummaryToHistory);
  if (pdfBtn) pdfBtn.addEventListener('click', exportToPDF);
  if (jsonBtn) jsonBtn.addEventListener('click', exportToJSON);
  if (historyBtn) historyBtn.addEventListener('click', showHistory);

  // Initialize mode and level selection UI
  initializeUIInteractions();
  initializeStudyTracker();

  console.log('🎉 Ready');
});

// ===== Main Summarization =====
let currentSummary = '';
let currentTitle = '';

async function summarize() {
  const btn = document.getElementById('summarizeBtn');
  const result = document.getElementById('result');
  const status = document.getElementById('status');
  const exportActions = document.getElementById('exportActions');

  btn.disabled = true;
  btn.textContent = '⏳ Processing...';
  result.className = 'loading';
  result.style.display = 'block';
  displayResult('Extracting content...');
  if (exportActions) exportActions.style.display = 'none';

    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Allow http, https, file (for PDFs), and chrome-extension (for PDF viewer)
      const isValidUrl = tab.url.startsWith('http') || 
                         tab.url.startsWith('file:') || 
                         tab.url.includes('.pdf');
      
      if (!isValidUrl) {
        throw new Error('Please navigate to a webpage or PDF file');
      }

      currentTitle = tab.title || 'Untitled';    // Extract content
    const content = await getPageContent(tab.id);
    
    if (!content || content.length < 100) {
      throw new Error('Not enough content found on this page');
    }

    console.log(`📝 Extracted ${content.length} characters`);

    // Get user preferences
    const mode = document.getElementById('summaryMode')?.value || 'study';
    const level = document.getElementById('academicLevel')?.value || 'undergraduate';

    displayResult('Generating study material...');
    let summary, source;

    // Try Chrome AI first, then local fallback
    try {
      summary = await chromeAISummarize(content, mode, level);
      source = 'Chrome AI (Gemini Nano)';
      status.textContent = 'Chrome AI-powered ✅';
    } catch (aiErr) {
      console.warn('Chrome AI failed, using local:', aiErr.message);

      // Check if it's a user-friendly error message or raw error
      let errorDisplay = aiErr.message;
      if (aiErr.message.includes('**') && aiErr.message.includes('Solution:')) {
        // This is already a formatted error message
        errorDisplay = aiErr.message;
      } else {
        // Convert to user-friendly format
        errorDisplay = getErrorMessage(aiErr.message);
      }

      // Show error details to user
      displayResult(`<div style="background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:8px;">
        ${formatOutput(errorDisplay, 'quick').replace('<div style="', '<div style="background:#fef2f2;border:none;padding:0;margin:0;')}
        <br><br>
        <strong>🔄 Falling back to local summarizer...</strong>
      </div>`);

      // Wait a moment then proceed with local
      await new Promise(resolve => setTimeout(resolve, 2000));

      summary = enhancedLocalSummarize(content, mode, level);
      source = 'Local Summarizer (Chrome AI unavailable)';
      status.textContent = 'Local mode (Chrome AI failed) ⚠️';
    }

    currentSummary = summary;

    // Display
    result.className = 'success';
    const successHTML = `
      <div class="summary-label">📋 ${getModeLabel(mode)}</div>
      ${formatOutput(summary, mode)}
      <div style="margin-top:12px;font-size:12px;opacity:0.7;">
        <strong>${source}</strong> • ${level.replace('-', ' ')} level
      </div>
    `;
    displayResult(successHTML);

    if (exportActions) exportActions.style.display = 'block';

  } catch (error) {
    console.error('❌ Error:', error);
    result.className = 'error';
    
    // Better error messages
    let errorMsg = error.message;
    let helpText = 'Try a different page or check console (F12) for details';
    
    if (errorMsg.includes('PDF')) {
      helpText = `
        <strong>For PDFs:</strong><br>
        • Wait a few seconds for the PDF to fully load, then try again<br>
        • Make sure it's a text-based PDF (not a scanned image)<br>
        • Try enabling "Allow access to file URLs" in extension settings
      `;
    } else if (errorMsg.includes('Cannot access')) {
      helpText = 'This page cannot be accessed. Chrome prevents extensions from reading certain pages.';
    }
    
    const errorHTML = `
      <strong>❌ Error</strong><br><br>
      ${errorMsg}<br><br>
      <small>${helpText}</small>
    `;
    displayResult(errorHTML, true);
    status.textContent = 'Error ❌';
  } finally {
    btn.disabled = false;
    btn.textContent = '� Generate Study Material';
  }
}

  // ===== Content Extraction =====
  async function getPageContent(tabId) {
    return new Promise(async (resolve, reject) => {
      // Get tab URL to detect PDFs
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const isPDF = tab.url.includes('.pdf') || tab.url.includes('pdfjs');
      
      // For PDFs, give extra time to load
      const delay = isPDF ? 1000 : 100;
      
      // Try sending message first (script may already be injected)
      chrome.tabs.sendMessage(tabId, { action: "getContent", isPDF }, response => {
        if (!chrome.runtime.lastError && response?.success) {
          return resolve(response.content);
        }

        // Inject script
        chrome.scripting.executeScript({
          target: { tabId },
          files: ['contentScript.js']
        }).then(() => {
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: "getContent", isPDF }, response => {
              if (chrome.runtime.lastError) {
                return reject(new Error('Cannot access this page. For PDFs, make sure the file is loaded.'));
              }
              if (response?.success) {
                resolve(response.content);
              } else {
                const errorMsg = response?.error || 'Could not extract content';
                reject(new Error(errorMsg));
              }
            });
          }, delay);
        }).catch(err => reject(new Error('Cannot inject script: ' + err.message)));
      });
    });
  }// ===== Enhanced Local Summarizer for Students =====
function enhancedLocalSummarize(content, mode = 'study', level = 'undergraduate') {
  try {
    const text = content.replace(/\s+/g, ' ').trim();
    const sentences = text
      .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
      .map(s => s.trim())
      .filter(s => {
        // More selective filtering
        const lengthOk = s.length > 40 && s.split(' ').length >= 6;
        const notLegal = !/\b(if they fail|terms of service|privacy policy|copyright|all rights reserved|disclaimer)\b/i.test(s);
        const notNavigation = !/\b(click here|learn more|read more|sign up|log in|contact us)\b/i.test(s);
        const notTooShort = s.split(' ').length >= 8;
        const hasContentWords = /\b(the|a|an|this|these|those|it|they|we|you|he|she|will|can|should|would|could|may|might|must)\b/i.test(s);
        
        return lengthOk && notLegal && notNavigation && notTooShort && hasContentWords;
      });

    if (sentences.length === 0) {
      return '• Not enough quality content to summarize. Try a different webpage with more substantial text.';
    }

    // Build word frequency
    const stopWords = new Set([
      'the','is','in','at','of','a','an','and','or','to','for','on','with',
      'as','by','from','that','this','it','be','are','was','were','has',
      'have','had','but','not','we','they','you','i','their','its','also'
    ]);

    const wordFreq = {};
    const words = text.toLowerCase().match(/[a-z0-9']+/g) || [];
    
    for (const word of words) {
      if (!stopWords.has(word) && word.length > 2) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    }

    // Find top keywords
    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);

    // Score sentences with better content detection
    const scored = sentences.map((sentence, idx) => {
      const sentWords = sentence.toLowerCase().match(/[a-z0-9']+/g) || [];
      let score = 0;
      
      // Base word frequency score
      for (const w of sentWords) {
        if (wordFreq[w]) score += wordFreq[w];
      }

      // Position boost (earlier and later sentences often more important)
      const posBoost = (idx === 0 ? 1.5 : 1) + (idx > sentences.length - 5 ? 0.3 : 0);
      
      // Content quality boost
      let qualityBoost = 1;
      if (/\b(however|therefore|consequently|moreover|furthermore|additionally|specifically|particularly)\b/i.test(sentence)) {
        qualityBoost += 0.5; // Connecting words suggest important content
      }
      if (/\b(examples?|instance|case|study|research|analysis|method|approach|theory|concept)\b/i.test(sentence)) {
        qualityBoost += 0.3; // Academic/content words
      }
      if (sentence.includes('?')) {
        qualityBoost -= 0.2; // Questions might be less important
      }
      
      return { idx, sentence, score: score * posBoost * qualityBoost };
    });

    // Generate based on mode
    switch (mode) {
      case 'quick':
        return generateQuickSummary(scored, level, 4);
      
      case 'concepts':
        return generateKeyConcepts(scored, keywords, level, 8);
      
      case 'exam':
        return generateExamPrep(scored, keywords, level);
      
      case 'study':
      default:
        return generateStudyGuide(scored, keywords, level, 10);
    }

  } catch (err) {
    console.error('Local summarizer error:', err);
    return '• Error generating summary';
  }
}

function generateQuickSummary(scored, level, count = 4) {
  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .sort((a, b) => a.idx - b.idx)
    .map(x => x.sentence);
  
  // Adjust complexity based on level with MORE DISTINCT differences
  const levelAdjustments = {
    'high-school': { 
      sentences: 3, 
      simple: true,
      prefix: "📚 **HIGH SCHOOL QUICK SUMMARY**\n*Hey there! Here's what you need to know:*\n\n",
      style: "conversational"
    },
    'undergraduate': { 
      sentences: 4, 
      simple: false,
      prefix: "🎓 **COLLEGE-LEVEL SUMMARY**\n*Academic Overview:*\n\n",
      style: "academic"
    },
    'graduate': { 
      sentences: 5, 
      simple: false,
      prefix: "🔬 **ADVANCED SCHOLARLY SUMMARY**\n*Critical Analysis:*\n\n",
      style: "scholarly"
    }
  };
  
  const adjustment = levelAdjustments[level] || levelAdjustments['undergraduate'];
  const selected = top.slice(0, adjustment.sentences);
  
  let result = adjustment.prefix;
  
  if (level === 'high-school') {
    // VERY simple, encouraging language for high school
    result += selected.map((s, i) => {
      let simplified = s.replace(/\b(?:however|therefore|consequently|subsequently|additionally|moreover|furthermore)\b/gi, 'also');
      simplified = simplified.replace(/\b(?:utilize|implement|facilitate|leverage)\b/gi, 'use');
      simplified = simplified.replace(/\b(?:methodology|framework|paradigm|construct)\b/gi, 'way');
      simplified = simplified.replace(/\b(?:significant|substantial|considerable)\b/gi, 'important');
      return `😊 **Key Point ${i + 1}:** ${simplified}`;
    }).join('\n\n');
    result += '\n\n✨ **Awesome!** You got this - these are the main ideas to remember!';
    
  } else if (level === 'undergraduate') {
    // Balanced academic tone
    result += selected.map((s, i) => {
      return `📖 **Point ${i + 1}:** ${s}`;
    }).join('\n\n');
    result += '\n\n💡 **Study Focus:** Review these key points and consider how they interconnect.';
    
  } else if (level === 'graduate') {
    // Advanced scholarly analysis
    result += selected.map((s, i) => {
      return `🎯 **Analytical Point ${i + 1}:** ${s}\n   *Implication:* This suggests broader theoretical connections.`;
    }).join('\n\n');
    result += '\n\n🔍 **Research Context:** These findings contribute to ongoing scholarly discourse in the field.';
  }
  
  return result;
}

function generateKeyConcepts(scored, keywords, level, count = 8) {
  const levelAdjustments = {
    'high-school': { 
      concepts: 4, 
      terms: 5, 
      simple: true,
      title: '🎯 **HIGH SCHOOL KEY CONCEPTS**',
      subtitle: '*Super simple explanations just for you!*',
      explanation: 'explained in easy words'
    },
    'undergraduate': { 
      concepts: 6, 
      terms: 7, 
      simple: false,
      title: '🎓 **COLLEGE KEY CONCEPTS**',
      subtitle: '*Academic analysis with connections*',
      explanation: 'with detailed explanations and relationships'
    },
    'graduate': { 
      concepts: 8, 
      terms: 9, 
      simple: false,
      title: '🔬 **ADVANCED THEORETICAL CONCEPTS**',
      subtitle: '*Scholarly analysis with research implications*',
      explanation: 'with theoretical frameworks and methodological considerations'
    }
  };
  
  const adjustment = levelAdjustments[level] || levelAdjustments['undergraduate'];
  
  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, adjustment.concepts)
    .sort((a, b) => a.idx - b.idx);
  
  const keywordList = keywords.slice(0, adjustment.terms).map(k => k.toUpperCase()).join(', ');
  
  let result = `${adjustment.title}\n${adjustment.subtitle}\n\n`;
  result += `**📝 Important Terms:** ${keywordList}\n\n`;
  result += `**Main Concepts ${adjustment.explanation}:**\n\n`;
  
  top.forEach((item, i) => {
    if (level === 'high-school') {
      // VERY simple explanations for high school
      let simpleConcept = item.sentence.replace(/\b(?:complex|intricate|sophisticated|advanced|methodology|framework|paradigm)\b/gi, 'important way');
      simpleConcept = simpleConcept.replace(/\b(?:significant|substantial|considerable)\b/gi, 'really important');
      result += `😊 **${i + 1}. Super Simple:** ${simpleConcept}\n\n`;
    } else if (level === 'undergraduate') {
      // Academic explanations with connections
      result += `📖 **${i + 1}. ${item.sentence}**\n   *Connection:* This relates to other concepts we've discussed.\n\n`;
    } else if (level === 'graduate') {
      // Theoretical depth with research context
      result += `🎯 **${i + 1}. ${item.sentence}**\n   *Theoretical Framework:* This concept intersects with broader disciplinary paradigms.\n   *Research Implication:* This has methodological significance for contemporary scholarship.\n\n`;
    }
  });
  
  if (level === 'high-school') {
    result += '🌟 **You\'re doing great!** These concepts are the building blocks for understanding bigger ideas.';
  } else if (level === 'undergraduate') {
    result += '💡 **Critical Thinking:** Consider how these concepts form a cohesive theoretical framework.';
  } else if (level === 'graduate') {
    result += '� **Research Direction:** These concepts suggest avenues for future methodological investigation.';
  }
  
  return result;
}

function generateStudyGuide(scored, keywords, level, count = 10) {
  const levelAdjustments = {
    'high-school': { 
      points: 5, 
      terms: 4, 
      title: '📖 **HIGH SCHOOL STUDY GUIDE**',
      intro: '**Hey friend!** Let\'s break this down super simply:\n\n',
      tip: '**🌟 Study Tip:** Read each point out loud and explain it in your own words like you\'re teaching a friend!'
    },
    'undergraduate': { 
      points: 7, 
      terms: 6, 
      title: '🎓 **COLLEGE STUDY GUIDE**',
      intro: '**Academic Study Guide** - Building conceptual understanding:\n\n',
      tip: '**💡 Study Tip:** Review these points multiple times and try explaining each concept in your own words!'
    },
    'graduate': { 
      points: 9, 
      terms: 8, 
      title: '� **ADVANCED GRADUATE STUDY GUIDE**',
      intro: '**Scholarly Analysis Framework** - Theoretical and methodological considerations:\n\n',
      tip: '**� Research Tip:** Consider how these concepts relate to current research and theoretical debates in the field.'
    }
  };
  
  const adjustment = levelAdjustments[level] || levelAdjustments['undergraduate'];
  
  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, adjustment.points)
    .sort((a, b) => a.idx - b.idx);
  
  let guide = `${adjustment.title}\n\n`;
  guide += `**📝 Key Terms to Master:** ${keywords.slice(0, adjustment.terms).map(k => k.toUpperCase()).join(', ')}\n\n`;
  guide += `${adjustment.intro}`;
  
  top.forEach((item, i) => {
    if (level === 'high-school') {
      // VERY simple, encouraging format for high school
      let simplePoint = item.sentence.replace(/\b(?:complex|intricate|sophisticated|advanced|methodology|framework|paradigm)\b/gi, 'important way');
      simplePoint = simplePoint.replace(/\b(?:significant|substantial|considerable)\b/gi, 'really important');
      guide += `😊 **Step ${i + 1} - Easy Peasy:** ${simplePoint}\n\n`;
    } else if (level === 'undergraduate') {
      // Academic format with connections
      guide += `📖 **Point ${i + 1}:** ${item.sentence}\n   *Why it matters:* This connects to other concepts in the field.\n\n`;
    } else if (level === 'graduate') {
      // Advanced scholarly format
      guide += `🎯 **Analytical Point ${i + 1}:** ${item.sentence}\n   *Theoretical Context:* This intersects with established scholarly frameworks.\n   *Methodological Note:* This has implications for research design and analysis.\n\n`;
    }
  });

  guide += adjustment.tip;
  
  return guide;
}

function generateExamPrep(scored, keywords, level) {
  const levelAdjustments = {
    'high-school': { 
      concepts: 3, 
      questions: 4, 
      title: '📝 **HIGH SCHOOL EXAM PREP**',
      intro: '**Hey!** Let\'s practice with some easy questions to help you study:\n\n',
      format: 'multiple-choice',
      tip: '**🎯 Test Tip:** Don\'t worry! Just remember the main ideas and you\'ll do great.'
    },
    'undergraduate': { 
      concepts: 5, 
      questions: 6, 
      title: '📝 **COLLEGE EXAM PREPARATION**',
      intro: '**Academic Exam Preparation** - Critical thinking practice:\n\n',
      format: 'short-answer',
      tip: '**🎯 Study Tip:** Focus on understanding how concepts connect and apply in different situations.'
    },
    'graduate': { 
      concepts: 7, 
      questions: 8, 
      title: '📝 **ADVANCED GRADUATE EXAM PREP**',
      intro: '**Scholarly Examination Preparation** - Theoretical and analytical questions:\n\n',
      format: 'essay-style',
      tip: '**🎯 Research Tip:** Prepare to demonstrate deep understanding and critical analysis of theoretical frameworks.'
    }
  };
  
  const adjustment = levelAdjustments[level] || levelAdjustments['undergraduate'];
  
  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, adjustment.concepts)
    .sort((a, b) => a.idx - b.idx);
  
  let prep = `${adjustment.title}\n\n`;
  prep += `**📚 Key Terms to Review:** ${keywords.slice(0, 5).map(k => k.toUpperCase()).join(', ')}\n\n`;
  prep += `${adjustment.intro}`;
  
  top.forEach((item, i) => {
    if (level === 'high-school') {
      // VERY simple multiple choice for high school
      let simpleQuestion = item.sentence.replace(/\b(?:complex|intricate|sophisticated|advanced|methodology|framework|paradigm)\b/gi, 'important way');
      simpleQuestion = simpleQuestion.replace(/\b(?:significant|substantial|considerable)\b/gi, 'really important');
      prep += `😊 **Question ${i + 1} (Multiple Choice):**\n`;
      prep += `What does this mean: "${simpleQuestion}"?\n`;
      prep += `A) Something really important\nB) Not important at all\nC) Kind of important\nD) Super important\n\n`;
    } else if (level === 'undergraduate') {
      // Short answer format for college
      prep += `📖 **Question ${i + 1} (Short Answer):**\n`;
      prep += `Explain the significance of: "${item.sentence}"\n`;
      prep += `*Consider:* How does this connect to other concepts in the field?\n\n`;
    } else if (level === 'graduate') {
      // Essay-style questions for graduate
      prep += `🎯 **Question ${i + 1} (Essay Analysis):**\n`;
      prep += `Critically analyze: "${item.sentence}"\n`;
      prep += `*Theoretical Framework:* How does this intersect with established scholarly paradigms?\n`;
      prep += `*Methodological Implications:* What research approaches does this suggest?\n`;
      prep += `*Critical Perspective:* What are the limitations or alternative interpretations?\n\n`;
    }
  });

  prep += adjustment.tip;
  
  return prep;
}

// ===== Chrome AI Summarizer (Gemini Nano) =====
async function chromeAISummarize(content, mode, level) {
  // Check if Chrome AI is available
  if (!('ai' in window)) {
    throw new Error('CHROME_AI_NOT_AVAILABLE');
  }

  // Limit content length for Chrome AI
  let processed = content.replace(/\s+/g, ' ').trim();
  if (processed.length > 50000) { // Chrome AI has different limits
    processed = processed.substring(0, 50000) + '...';
  }

  const levelContext = {
    'high-school': 'high school student (ages 14-18). Use very clear, simple language. Avoid complex vocabulary.',
    'undergraduate': 'undergraduate college student (ages 18-22). Use academic but accessible language.',
    'graduate': 'graduate student or researcher (ages 22+). Use advanced terminology and in-depth analysis.'
  };

  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      let result;

      switch (mode) {
        case 'quick':
          // Use Summarizer API for quick summaries
          if ('summarizer' in window.ai) {
            showProgress('Creating AI summary...', 30);
            const summarizer = await window.ai.summarizer.create({
              type: 'tl;dr',
              length: 'short',
              format: 'plain-text'
            });

            const context = levelContext[level] || levelContext['undergraduate'];
            const prompt = `Create a concise summary for a ${context}. Focus on the main ideas and key points.`;

            showProgress('Processing with Chrome AI...', 70);
            result = await summarizer.summarize(processed, { context: prompt });
          } else {
            throw new Error('SUMMARIZER_API_UNAVAILABLE');
          }
          break;

        case 'study':
          // Use Writer API for detailed study guides
          if ('writer' in window.ai) {
            showProgress('Creating study guide...', 25);
            const writer = await window.ai.writer.create({
              tone: level === 'high-school' ? 'casual' : level === 'graduate' ? 'formal' : 'professional',
              format: 'plain-text',
              length: 'medium'
            });

            const context = levelContext[level];
            const prompt = `Create a comprehensive study guide for a ${context}. Include:
- Key concepts and main ideas
- Important details and examples
- Study tips and strategies
- Connections between concepts

Content to study: ${processed}`;

            showProgress('Writing study guide...', 75);
            result = await writer.write(prompt);
          } else {
            throw new Error('WRITER_API_UNAVAILABLE');
          }
          break;

        case 'concepts':
          // Use Summarizer API with key-points type
          if ('summarizer' in window.ai) {
            showProgress('Extracting key concepts...', 35);
            const summarizer = await window.ai.summarizer.create({
              type: 'key-points',
              length: 'medium',
              format: 'markdown'
            });

            const context = levelContext[level];
            const prompt = `Extract and explain key concepts for a ${context}. Focus on the most important ideas.`;

            showProgress('Analyzing concepts...', 80);
            result = await summarizer.summarize(processed, { context: prompt });
          } else {
            throw new Error('SUMMARIZER_API_UNAVAILABLE');
          }
          break;

        case 'exam':
          // Use Writer API for exam prep
          if ('writer' in window.ai) {
            showProgress('Creating exam prep...', 20);
            const writer = await window.ai.writer.create({
              tone: level === 'high-school' ? 'encouraging' : level === 'graduate' ? 'analytical' : 'educational',
              format: 'plain-text',
              length: 'long'
            });

            const context = levelContext[level];
            const prompt = `Create exam preparation materials for a ${context}. Include:
- Key content summary
- Practice questions (multiple choice, short answer, essay)
- Study strategies
- Important terms to review

Content for exam prep: ${processed}`;

            showProgress('Preparing exam materials...', 85);
            result = await writer.write(prompt);
          } else {
            throw new Error('WRITER_API_UNAVAILABLE');
          }
          break;

        default:
          throw new Error('UNKNOWN_MODE');
      }

      if (!result) {
        throw new Error('NO_RESULT_RETURNED');
      }

      showProgress('Complete!', 100);
      setTimeout(() => hideProgress(), 500);
      return result;

    } catch (error) {
      console.error(`Chrome AI error (attempt ${retryCount + 1}):`, error);

      // If this is the last retry, throw a user-friendly error
      if (retryCount >= maxRetries) {
        throw new Error(getErrorMessage(error.message));
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      retryCount++;
      showProgress(`Retrying... (${retryCount}/${maxRetries})`, 10);
    }
  }
}

// Enhanced error message function
function getErrorMessage(errorCode) {
  const errorMessages = {
    'CHROME_AI_NOT_AVAILABLE': {
      title: 'Chrome AI Not Available',
      message: 'Chrome AI features are not enabled in your browser.',
      solution: 'Go to <code>chrome://flags/#enable-experimental-web-platform-features</code> and <code>chrome://flags/#enable-chrome-ai</code>, enable both flags, then restart Chrome.',
      icon: '⚠️'
    },
    'SUMMARIZER_API_UNAVAILABLE': {
      title: 'Summarizer API Unavailable',
      message: 'The Chrome Summarizer API is not available.',
      solution: 'Make sure Chrome AI features are enabled and try again.',
      icon: '🤖'
    },
    'WRITER_API_UNAVAILABLE': {
      title: 'Writer API Unavailable',
      message: 'The Chrome Writer API is not available.',
      solution: 'Make sure Chrome AI features are enabled and try again.',
      icon: '✍️'
    },
    'NO_RESULT_RETURNED': {
      title: 'No Response from AI',
      message: 'Chrome AI didn\'t return a result.',
      solution: 'Try again with shorter content or different settings.',
      icon: '🤔'
    },
    'UNKNOWN_MODE': {
      title: 'Unknown Mode',
      message: 'The selected study mode is not recognized.',
      solution: 'Please select a valid study mode.',
      icon: '❓'
    }
  };

  const error = errorMessages[errorCode] || {
    title: 'AI Processing Error',
    message: 'An unexpected error occurred while processing your request.',
    solution: 'Try again, or try with shorter content.',
    icon: '❌'
  };

  return `${error.icon} **${error.title}**\n\n${error.message}\n\n**Solution:** ${error.solution}`;
}

// ===== Formatting =====
function formatOutput(text, mode) {
  // Preserve markdown-style formatting from AI
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
  
  // Format bullet points
  formatted = formatted.replace(/^• (.+)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  return `<div style="line-height:1.8;font-size:14px;">${formatted}</div>`;
}

function getModeLabel(mode) {
  const labels = {
    'quick': 'Quick Summary',
    'study': 'Study Guide',
    'concepts': 'Key Concepts',
    'exam': 'Exam Prep + Quiz'
  };
  return labels[mode] || 'Summary';
}

// ===== Export Features =====
async function copySummary() {
  const status = document.getElementById('status');
  try {
    // Strip HTML tags for plain text copy
    const plainText = currentSummary
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(strong|b)>/gi, '')
      .replace(/<\/?ul>/gi, '')
      .replace(/<li>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    
    await navigator.clipboard.writeText(plainText);
    status.textContent = 'Copied to clipboard! ✅';
    setTimeout(() => status.textContent = 'Ready', 2000);
  } catch (err) {
    status.textContent = 'Copy failed ❌';
    console.error('Copy error:', err);
  }
}

async function exportToPDF() {
  const status = document.getElementById('status');
  try {
    // Create a simple HTML document for PDF generation
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${currentTitle || 'Clarity Study Material'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
          .metadata { color: #666; font-size: 14px; margin-bottom: 20px; }
          strong { color: #2c3e50; }
          ul { margin: 15px 0; }
          li { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <h1>${currentTitle || 'Clarity Study Material'}</h1>
        <div class="metadata">
          Generated by Clarity - Chrome AI Study Companion<br>
          Mode: ${getModeLabel(document.getElementById('summaryMode')?.value || 'study')}<br>
          Level: ${(document.getElementById('academicLevel')?.value || 'undergraduate').replace('-', ' ')}<br>
          Date: ${new Date().toLocaleString()}
        </div>
        <div>
          ${currentSummary}
        </div>
      </body>
      </html>
    `;

    // Create a blob and download it
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `clarity-study-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    status.textContent = 'PDF-ready file downloaded! 📄';
    setTimeout(() => status.textContent = 'Ready', 3000);
  } catch (err) {
    status.textContent = 'PDF export failed ❌';
    console.error('PDF export error:', err);
  }
}

async function exportToJSON() {
  const status = document.getElementById('status');
  try {
    const exportData = {
      title: currentTitle,
      summary: currentSummary,
      mode: document.getElementById('summaryMode')?.value || 'study',
      level: document.getElementById('academicLevel')?.value || 'undergraduate',
      timestamp: new Date().toISOString(),
      source: 'Clarity Chrome AI Study Companion',
      metadata: {
        contentLength: currentSummary.length,
        wordCount: currentSummary.split(/\s+/).length,
        generatedWith: 'Chrome AI (Gemini Nano)'
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `clarity-study-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    status.textContent = 'JSON exported! 📊';
    setTimeout(() => status.textContent = 'Ready', 2000);
  } catch (err) {
    status.textContent = 'JSON export failed ❌';
    console.error('JSON export error:', err);
  }
}

async function saveSummaryToHistory() {
  const status = document.getElementById('status');
  try {
    // Get existing history
    const { summaryHistory = [] } = await chrome.storage.local.get(['summaryHistory']);
    
    // Add new entry
    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      title: currentTitle,
      summary: currentSummary,
      mode: document.getElementById('summaryMode')?.value || 'study',
      level: document.getElementById('academicLevel')?.value || 'undergraduate'
    };
    
    summaryHistory.unshift(entry);
    
    // Keep only last 20
    if (summaryHistory.length > 20) {
      summaryHistory.length = 20;
    }
    
    await chrome.storage.local.set({ summaryHistory });
    
    status.textContent = 'Saved to history! 💾';
    setTimeout(() => status.textContent = 'Ready', 2000);
  } catch (err) {
    status.textContent = 'Save failed ❌';
    console.error('Save error:', err);
  }
}

async function showHistory() {
  const result = document.getElementById('result');
  
  try {
    const { summaryHistory = [] } = await chrome.storage.local.get(['summaryHistory']);
    
    if (summaryHistory.length === 0) {
      result.className = 'loading';
      result.style.display = 'block';
      displayResult('<p style="text-align:center;">No saved summaries yet.<br><br>Click 💾 Save after generating a summary!</p>');
      return;
    }
    
    result.className = 'success';
    result.style.display = 'block';
    const historyHTML = `
      <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
        <strong>📚 Summary History</strong>
        <button id="clearHistory" style="padding:4px 12px;font-size:12px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;">Clear All</button>
      </div>
      <div id="historyPanel">
        ${summaryHistory.map(entry => `
          <div class="history-item" data-id="${entry.id}">
            <div class="history-date">${new Date(entry.date).toLocaleDateString()} ${new Date(entry.date).toLocaleTimeString()}</div>
            <div class="history-title">${entry.title}</div>
            <div class="history-preview">${entry.summary.substring(0, 80).replace(/<[^>]+>/g, '')}...</div>
          </div>
        `).join('')}
      </div>
    `;
    displayResult(historyHTML);
    
    // Add click handlers
    document.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => loadHistoryItem(item.dataset.id));
    });
    
    document.getElementById('clearHistory')?.addEventListener('click', clearHistory);
    
  } catch (err) {
    console.error('History error:', err);
    result.className = 'error';
    displayResult('<strong>❌ Could not load history</strong>', true);
  }
}

async function loadHistoryItem(id) {
  try {
    const { summaryHistory = [] } = await chrome.storage.local.get(['summaryHistory']);
    const entry = summaryHistory.find(e => e.id === parseInt(id));
    
    if (!entry) return;
    
    currentSummary = entry.summary;
    currentTitle = entry.title;
    
    const result = document.getElementById('result');
    result.className = 'success';
    const entryHTML = `
      <div class="summary-label">📋 ${getModeLabel(entry.mode)} (from history)</div>
      ${formatOutput(entry.summary, entry.mode)}
      <div style="margin-top:12px;font-size:12px;opacity:0.7;">
        ${entry.title}<br>
        Saved: ${new Date(entry.date).toLocaleString()}
      </div>
    `;
    displayResult(entryHTML);
    
    document.getElementById('exportActions').style.display = 'block';
  } catch (err) {
    console.error('Load item error:', err);
  }
}

async function clearHistory() {
  if (!confirm('Delete all saved summaries?')) return;
  
  try {
    await chrome.storage.local.set({ summaryHistory: [] });
    document.getElementById('result').style.display = 'none';
    document.getElementById('status').textContent = 'History cleared';
    setTimeout(() => document.getElementById('status').textContent = 'Ready', 2000);
  } catch (err) {
    console.error('Clear history error:', err);
  }
}


// ===== ENHANCED FEATURES v2.2 =====

// Progress Bar
function showProgress(text, percent) {
  const progressText = document.getElementById('progressText');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  if (progressText) { progressText.textContent = text; progressText.style.display = 'block'; }
  if (progressContainer) progressContainer.style.display = 'block';
  if (progressBar) progressBar.style.width = percent + '%';
}

function hideProgress() {
  const progressText = document.getElementById('progressText');
  const progressContainer = document.getElementById('progressContainer');
  if (progressText) progressText.style.display = 'none';
  if (progressContainer) progressContainer.style.display = 'none';
}
