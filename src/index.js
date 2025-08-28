import "dotenv/config";
import { Agent, run } from "@openai/agents";
import { aisdk } from "@openai/agents-extensions";
import { google } from "@ai-sdk/google";
import { CHAICODE_AUTOMATION_PROMPT } from "./prompts/chaicode.prompt.js";
import {
  browser,
  fillInput,
  findAndClickElement,
  getAdvancedPageStructure,
  openURL,
  takeScreenshotAndAnalyze,
  waitAndVerify,
} from "./tools/tool.js";
import { PIYUSHGARG_AUTOMATION_PROMPT } from "./prompts/piyushgargdev.prompt.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// for gpt model will use gpt-4o-mini (May get wayward accuracy)
// for gemini aisdk(google("gemini-2.5-flash")) (Recommended to use this because accuracy is very well here)

const model = "gpt-4o-mini";

const websiteAutomationAgent = new Agent({
  name: "Website Automation Agent",
  instructions: `
  You are a web automation agent that can navigate websites and interact with forms.
  
   IMPORTANT GUIDELINES:
  1. Always take screenshot after and before each and every actions
  2. Use get_advanced_page_structure to understand available elements
  3. For login forms, use the enhanced fillInput with inputType parameter
  4. Always wait and verify after important actions
  5. If an element is not found, take a screenshot to debug
  6. Handle dynamic content by waiting longer if needed
  7. Use multiple strategies for finding elements
  
  DEBUGGING APPROACH:
  1. If an action fails, take screenshot immediately
  2. Analyze the page structure to see what's actually available
  3. Try alternative selectors or approaches
  4. Wait longer for dynamic content if needed
  
  ERROR RECOVERY:
  1. If element not found, wait and retry
  2. Try different selector strategies
  3. Check if page navigation occurred unexpectedly
  4. Use visual analysis to understand current state
  `,
  tools: [
    takeScreenshotAndAnalyze,
    openURL,
    getAdvancedPageStructure,
    fillInput,
    findAndClickElement,
    waitAndVerify,
  ],
  model,
});

async function chatWithAgent(query) {
  try {
    const response = await run(websiteAutomationAgent, query, {
      maxTurns: 60,
    });

    console.log("Final response:", response.finalOutput);
    if (
      response.finalOutput &&
      (response.finalOutput.includes("two-factor authentication") ||
        response.finalOutput.includes("2FA") ||
        response.finalOutput.includes("verification"))
    ) {
      console.log(
        "2FA detected. Waiting for 45 seconds for user to complete authentication...",
      );
      await delay(45 * 1000);
      const currentUrl = page.url();
      console.log(`After 2FA wait, current URL: ${currentUrl}`);
      if (currentUrl.includes("piyushgarg.dev/guest-book")) {
        console.log("2FA successful! Continuing with guest book message...");
        const continueQuery = `
        Now that we're logged in to the guest book page:
        1. Take a screenshot to see the current state.
        2. Look for the text input field with placeholder "Please type your message here...".
        3. Type the message: "hello fellow developers".
        4. Instead of looking for a normal button with text, find the button that only contains an SVG (it looks like a send arrow) and click it. Use a selector like 'button:has(svg)'.
        5. Take a final screenshot to confirm the message was sent.
        `;

        const continueResponse = await runner.run(
          websiteAutomationAgent,
          continueQuery,
          {
            maxTurns: 60,
          },
        );

        console.log("Continue response:", continueResponse.finalOutput);
      } else {
        console.log(
          "Still not on the guest book page after 2FA wait. Authentication may have failed.",
        );
      }
    }

    await browser.close();
  } catch (error) {
    console.error("Agent execution failed:", error);
    await browser.close();
  }
}

chatWithAgent(PIYUSHGARG_AUTOMATION_PROMPT);
