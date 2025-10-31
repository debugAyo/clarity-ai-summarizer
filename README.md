# Clarity - Chrome AI Study Companion

## 🎯 **2025 Google Chrome AI Contest Submission**

This extension has been converted to use **Chrome's built-in AI APIs** with **Gemini Nano** as required by the contest.

## ✅ **Contest Requirements Met:**

### **Application Requirements:**
- [x] **New Application**: Created during contest period
- [x] **Chrome Extension**: Manifest V3 extension
- [x] **Functionality**: Uses Chrome AI APIs, works consistently
- [x] **Platforms**: Desktop computers
- [x] **English Support**: Yes
- [x] **Third Party**: No third-party APIs used
- [x] **Testing**: Available for judges to test

### **APIs Used:**
- [x] **Summarizer API**: For quick summaries and key concepts
- [x] **Writer API**: For detailed study guides and exam prep
- [x] **Gemini Nano**: Chrome's built-in AI model

### **Submission Requirements:**
- [x] **Application**: Built with required tools
- [x] **Text Description**: See below
- [x] **Demo Video**: Instructions below
- [x] **GitHub Repo**: This repository
- [x] **Working Demo**: Extension can be installed and tested
- [x] **English**: All content in English

## 📝 **Text Description:**

**Clarity** is an intelligent Chrome extension that leverages Chrome's built-in AI APIs (Summarizer and Writer) to create personalized study materials for students at different academic levels.

**Problem Solved:**
Students struggle to efficiently process and understand complex web content for studying. Traditional summarization tools provide generic outputs that don't adapt to academic levels, making them less effective for educational purposes.

**Features:**
- **Adaptive Content Generation**: Automatically adjusts language complexity and depth for High School, Undergraduate, and Graduate levels
- **Multiple Study Modes**: Quick summaries, comprehensive study guides, key concepts extraction, and exam preparation
- **Chrome AI Integration**: Uses native Summarizer and Writer APIs with Gemini Nano for local, privacy-preserving AI processing
- **Beautiful UI**: Glassmorphism design with dark/light themes
- **Export Options**: Copy, save, and history features

**APIs Used:**
- Chrome Summarizer API (for quick summaries and key concepts)
- Chrome Writer API (for detailed study guides and exam prep)
- Gemini Nano (Chrome's built-in AI model)

## 🎬 **Demo Video Requirements:**

Create a 2-3 minute video showing:
1. **Installation**: Load unpacked extension in Chrome
2. **Interface**: Show the beautiful UI and mode selection
3. **Functionality**: Demonstrate each mode (Quick, Study Guide, Key Concepts, Exam Prep)
4. **Level Adaptation**: Show same content with different academic levels
5. **Chrome AI**: Highlight that it uses built-in Chrome AI (no API keys needed)

Upload to YouTube or Vimeo and provide the link.

## 🛠️ **Setup Instructions for Judges:**

### **Prerequisites:**
- Chrome browser with experimental AI features enabled
- Go to `chrome://flags/#enable-experimental-web-platform-features`
- Enable "Experimental Web Platform features"
- Go to `chrome://flags/#enable-chrome-ai`
- Enable "Chrome AI features"

### **Installation:**
1. Download/clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your toolbar

### **Testing:**
1. Navigate to any webpage with substantial text content
2. Click the Clarity extension icon
3. Select a study mode and academic level
4. Click "Generate with Chrome AI"
5. View the AI-generated study materials

### **Features to Test:**
- All 4 modes work (Quick, Study Guide, Key Concepts, Exam Prep)
- All 3 academic levels produce different outputs
- Theme toggle works
- Export functions work
- History feature works

## 🔧 **Technical Implementation:**

### **Architecture:**
- **Manifest V3**: Modern Chrome extension format
- **Service Worker**: Background script for extension lifecycle
- **Content Script**: Extracts webpage content
- **Popup Interface**: Main user interface
- **Chrome AI APIs**: Native browser AI integration

### **AI Integration:**
```javascript
// Example usage of Chrome AI APIs
const summarizer = await window.ai.summarizer.create({
  type: 'tl;dr',
  length: 'short'
});
const summary = await summarizer.summarize(content);

const writer = await window.ai.writer.create({
  tone: 'educational'
});
const guide = await writer.write(prompt);
```

### **Level Adaptation:**
The extension adapts content based on academic level:
- **High School**: Simple language, basic concepts, encouraging tone
- **Undergraduate**: Academic language, conceptual relationships
- **Graduate**: Advanced terminology, theoretical frameworks

## 📊 **Files Structure:**
```
clarity-chrome-ai/
├── manifest.json          # Extension manifest
├── popup.html            # Main interface
├── popup.js              # Main logic & Chrome AI integration
├── background.js         # Service worker
├── contentScript.js      # Content extraction
├── icons/                # Extension icons
└── README.md            # This file
```

## 🎯 **Contest Category:**
This submission fits the **"Build with Chrome's built-in AI"** category, utilizing Gemini Nano through the Summarizer and Writer APIs to create an educational tool that enhances learning efficiency.

## 📞 **Contact:**
For questions about this submission, please refer to the code and documentation in this repository.
