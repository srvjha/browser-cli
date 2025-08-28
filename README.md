# **AI Browser Automation Agent**

This project features an AI agent that can interact with websites just like a human. Using the OpenAI Agents SDK and Puppeteer, this agent can understand natural language prompts to navigate web pages, fill out forms, and perform various actions. This README provides a detailed overview of the project, its structure, and how to get it running.

## **🌟 Features**

* **Natural Language Control:** Instruct the agent with simple English prompts.  
* **Web Navigation:** Opens URLs, clicks buttons, and navigates through websites.  
* **Form Interaction:** Intelligently fills out login, sign-up, and other forms.  
* **Visual Analysis:** Takes screenshots and uses vision models to understand the page layout and locate elements.  
* **Multi-Strategy Element Finding:** Employs a robust combination of CSS selectors, XPath, and JavaScript evaluation to reliably find elements.  
* **Extensible Automation:** Easily add new automation scripts for different websites.

## **📂 Project Structure**

Here is an overview of the project's directory structure:

/browser-cli  
|-- /src  
|   |-- /configs  
|   |   \`-- env.js        \# (Optional \- for environment variable management)  
|   |-- /prompts  
|   |   |-- amazon.prompt.js  
|   |   |-- chaicode.prompt.js  
|   |   |-- dmart.prompt.js  
|   |   \`-- piyushgargdev.prompt.js  
|   |-- /tools  
|   |   \`-- tool.js  
|   \`-- index.js  
|-- .env  
|-- .env.sample  
|-- .gitignore  
|-- package.json  
\`-- pnpm-lock.yaml

## **🚀 Getting Started**

Follow these steps to set up and run the project on your local machine.

### **1\. Clone the Repository**

First, clone the repository to your local machine using Git:

git clone https://github.com/srvjha/browser-cli.git  
cd browser-cli

### **2\. Install Dependencies**

This project uses pnpm for package management. Install the dependencies by running:

pnpm install

### **3\. Set Up Environment Variables**

You'll need to provide API keys and credentials for the agent to work.

1. Make a copy of the .env.sample file and name it .env.  
2. Open the .env file and add your credentials.

#### **.env.sample**

\# LLM MODELS  
OPENAI\_API\_KEY=your\_openai\_api\_key  
GOOGLE\_GENERATIVE\_AI\_API\_KEY=your\_gemini\_api\_key

\# GITHUB CREDENTIALS  
GITHUB\_EMAIL=your\_github\_email  
GITHUB\_PASSWORD=your\_github\_password

\# AMAZON CREDENTIALS  
AMAZON\_EMAIL=your\_amazon\_email  
AMAZON\_PASSWORD=your\_amazon\_password

MOBILE\_NUMBER=your\_mobile\_number

### **4\. Connect to a Running Chrome Instance**

For the best results, this agent connects to a running instance of Chrome with remote debugging enabled. This allows the agent to operate in a real browser environment.

1. Close all running instances of Google Chrome.  
2. Open your terminal or command prompt and run the following command:  
   * **On Windows:**  
     "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" \--remote-debugging-port=9222 \--user-data-dir="C:/chrome-data"

   * **On macOS:**  
     /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \--remote-debugging-port=9222 \--user-data-dir=\~/chrome-data

This will open a new Chrome window that the agent can connect to.

## **💻 Usage**

To run an automation task, open the src/index.js file and import the desired prompt. For example, to run the ChaiCode assignment:

// src/index.js

// ... imports  
import { CHAICODE\_AUTOMATION\_PROMPT } from "./prompts/chaicode.prompt.js";  
// ... other prompts

// In the last line, call chatWithAgent with the prompt you want to execute  
chatWithAgent(CHAICODE\_AUTOMATION\_PROMPT);

Then, run the script from your terminal:

pnpm start

The agent will then begin executing the steps outlined in the prompt.

## **📄 File Breakdown**

### **src/index.js**

This is the main entry point of the application.

* **Agent Initialization:** It sets up the websiteAutomationAgent with its name, instructions, and the tools it can use.  
* **Model Selection:** You can switch between OpenAI's gpt-4o-mini and Google's gemini-2.5-flash. The Gemini model is recommended for better accuracy.  
* **Core Logic:** The chatWithAgent function is responsible for running the agent with a given prompt and handling the conversation flow, including special logic for handling 2FA.

### **src/tools/tool.js**

This file defines all the actions the AI agent can perform. It uses puppeteer to control the browser and zod for type-safe parameter validation.

* **browser and page:** Establishes a connection to the running Chrome instance.  
* **openURL:** Navigates to a specified URL.  
* **takeScreenshotAndAnalyze:** Takes a screenshot of the current page. If a targetElement is specified, it uses a vision model to analyze the image and provide information about the element's location and type.  
* **findAndClickElement:** A powerful function that tries multiple strategies (JavaScript evaluation, XPath, CSS selectors) to find and click an element based on its text content.  
* **fillInput:** Fills an input field with a given value, trying multiple selectors for robustness.  
* **getAdvancedPageStructure:** Scans the page's DOM to find interactive elements or elements containing specific search terms, giving the agent a better understanding of the page.  
* **waitAndVerify:** Pauses execution and verifies if the browser has navigated to an expected URL.

### **src/prompts/**

This directory contains the natural language instructions for the various automation tasks. Each file exports a string template with the steps for the agent to follow.

* **chaicode.prompt.js:** The solution for the main assignment. It instructs the agent to go to ui.chaicode.com, navigate to the sign-up form, fill in the details, and submit.  
* **amazon.prompt.js, dmart.prompt.js, piyushgargdev.prompt.js:** These files contain prompts for more advanced automation tasks.

## **✨ Advanced Automation Section**

This project goes beyond the initial assignment by demonstrating more complex automation scenarios.

* **E-commerce Shopping (Amazon & DMart):** The agent can log in, search for products, add items to the cart, and navigate to the checkout page. This showcases its ability to handle multi-step commercial workflows.  
* **Complex Login Flows (Piyush Garg's Guest Book):** This task involves a multi-step login process using GitHub, which may include Two-Factor Authentication (2FA). The agent is programmed to fill in the credentials and then pause, allowing the user to manually enter the 2FA code before it continues with the rest of the task.  
* **Dynamic Content Handling:** The agent is designed to wait for elements to appear, making it resilient to websites with dynamic content that loads asynchronously.  
* **Visual Debugging:** By taking screenshots at every step, the agent provides a visual log of its actions, making it much easier to debug when things go wrong.

## **🎥 Video Demo**

[**https://youtu.be/reUhMUI02dM**](https://youtu.be/reUhMUI02dM)
