import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import puppeteer from "puppeteer";
import fs from "fs";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({
    headless: false,
    args: [
        "--start-maximized",
        "--disable-extensions",
        "--disable-file-system",
    ],
    defaultViewport: null,
});

const page = await browser.newPage();

const takeScreenShot = tool({
    name: "take_screenshot",
    description: "Take screenshot of current page for inspection",
    parameters: z.object({}),
    async execute() {
        const buffer = await page.screenshot();
        const filePath = `screenshot-${Date.now()}.png`;
        await fs.promises.writeFile(filePath, buffer);
        return { filePath };
    },
});

const openURL = tool({
    name: "open_url",
    description: "Open a webpage",
    parameters: z.object({ url: z.string() }),
    async execute({ url }) {
        await page.goto(url, { waitUntil: "networkidle2" });
        await delay(5000);
        console.log("Navigated to:", url);
        return { success: true };
    },
});

const fillInput = tool({
    name: "fill_input",
    description: "Fill a form input field by CSS selector",
    parameters: z.object({
        selector: z.string().describe("CSS selector of the input field"),
        value: z.string().describe("Value to type in"),
    }),
    async execute({ selector, value }) {
        await page.waitForSelector(selector, { visible: true });
        await page.click(selector, { clickCount: 3 }); // clear
        await page.type(selector, value);
        console.log(`Filled ${selector} with "${value}"`);
        return { success: true };
    },
});

const clickElement = tool({
    name: "click_element",
    description: "Click an element using a CSS selector",
    parameters: z.object({
        selector: z.string().describe("CSS selector of the element"),
    }),
    async execute({ selector }) {
        await page.waitForSelector(selector, { visible: true });
        await page.click(selector);
        console.log(`Clicked element: ${selector}`);
        return { success: true };
    },
});

const websiteAutomationAgent = new Agent({
    name: "Website Automation Agent",
    instructions: `
You are a **reliable DOM-based browser automation agent**.

Your primary goal is to automate actions in a web browser using the available tools.  
You have no direct vision of the page; your only way to understand changes is through screenshots and DOM selectors.  
Be precise, cautious, and always validate your steps.  

---

## General Rules:
1. **Always start by opening the given URL** with 'open_url'.  
2. **After every action**, call 'take_screenshot' to confirm the result before deciding the next step.  
3. **Never skip screenshots**. They are your only way to "see" progress.  
4. Prefer **DOM-based actions** ('fill_input', 'click_element') instead of pixel coordinates.  
5. Stop immediately once the requested task is successfully completed (e.g., form submission).  

---

## Tools Usage:
- **open_url(url)** → Navigate to a webpage. Always use it as the first step.  
- **take_screenshot** → Must be called after *every action*. The returned file path is your reference.  
- **fill_input(selector, value)** → Use only when you know the exact CSS selector of an input field. Always clear the field before typing.  
- **click_element(selector)** → Use only when you know the exact selector of a clickable element (e.g., button, link).  


---

## Form Filling Workflow:
1. Navigate to the signup page using 'open_url'.  
2. Take a screenshot to confirm the form is visible.  
3. For each input field:
   - Use 'fill_input' with the exact CSS selector and required value.  
   - Take a screenshot to verify the text was filled correctly.  
4. Once all fields are filled, use 'click_element' to press the "Create Account" button.  
5. Take a screenshot immediately after submission to verify success.  

---

## Safety & Best Practices:
- Do **not** guess element selectors or coordinates. Always use valid CSS selectors.  
- Do **not** repeat the same action unless the previous step clearly failed.  
- If an element is missing or not interactable, scroll or wait, then retry.  
- Do **not** continue executing actions once the goal is achieved.  

---

Now, follow these rules strictly to complete the user’s request.
  `,
    tools: [takeScreenShot, openURL, fillInput, clickElement],
    model: "gpt-4.1-mini",
});

async function chatWithAgent(query) {
    const response = await run(websiteAutomationAgent, query, {
        maxTurns: 30,
    });
    console.log(response.history);
    console.log(response.finalOutput);
}

chatWithAgent(`
Go to https://ui.chaicode.com/auth/signup and fill the form with:
- First Name: Saurav
- Last Name: Jha
- Email: srvjha@example.com
- Password: Test@12345
- Confirm Password: Test@12345
Then click the "Create Account" button.
`);
