import OpenAI from "openai";
import { z } from "zod";
import puppeteer from "puppeteer";
import { tool } from "@openai/agents";
import fs from "fs";
import "dotenv/config";

/*
Type
``` chrome.exe --remote-debugging-port=9222 --user-data-dir="C:/chrome-data
``` 
in file explorer to connnect other wise use


const browser = await puppeteer.launch({
  headless: false,
  args: ["--start-maximized", "--disable-extensions", "--disable-file-system"],
  defaultViewport: null,
});

*/

const openai = new OpenAI();

export const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    args: ["--start-maximized"],
    defaultViewport: null,
});
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const page = await browser.newPage();

const openURL = tool({
    name: "open_url",
    description: "Open a webpage",
    parameters: z.object({ url: z.string() }),
    async execute({ url }) {
        await page.goto(url, { waitUntil: "networkidle2" });
        await delay(3000);
        console.log("Navigated to:", url);
        return { success: true };
    },
});

const takeScreenshotAndAnalyze = tool({
    name: "take_screenshot_and_analyze",
    description: "Take screenshot and analyze it to find specific elements",
    parameters: z.object({
        targetElement: z
            .string()
            .nullable()
            .optional()
            .nullable()
            .describe("What element to look for (e.g., 'Continue button')"),
        analysisType: z
            .string()
            .nullable()
            .optional()
            .nullable()
            .describe("Type of analysis needed"),
    }),
    async execute({ targetElement, analysisType }) {
        const buffer = await page.screenshot();
        const filePath = `screenshot-${Date.now()}.png`;
        await fs.promises.writeFile(filePath, buffer);

        let analysis = null;

        if (targetElement) {
            try {
                const base64Image = buffer.toString("base64");

                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: `Analyze this screenshot and help me locate the "${targetElement}". Provide:
                    1. Whether the element is visible
                    2. Approximate coordinates or position
                    3. What type of element it appears to be (button, link, etc.)
                    4. Any surrounding context that might help identify it
                    5. Suggested CSS selectors or approaches to interact with it
                    6. If it's a form, identify all input fields and buttons`,
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:image/png;base64,${base64Image}`,
                                    },
                                },
                            ],
                        },
                    ],
                    max_tokens: 1000,
                });

                analysis = response.choices[0].message.content;
                console.log("Visual analysis:", analysis);
            } catch (error) {
                console.log("Vision analysis failed:", error.message);
            }
        }

        return { filePath, analysis };
    },
});

const findAndClickElement = tool({
    name: "find_and_click_element",
    description: "Find and click element using multiple modern strategies",
    parameters: z.object({
        targetText: z.string().describe("Text content to search for"),
        elementTypes: z
            .array(z.string())
            .nullable()
            .optional()
            .nullable()
            .default(["button", "a", "div", "span", "input"])
            .describe("HTML element types to search"),
        waitTime: z
            .number()
            .nullable()
            .optional()
            .nullable()
            .default(10000)
            .describe("Wait time in milliseconds"),
    }),
    async execute({ targetText, elementTypes, waitTime }) {
        console.log(`Searching for element with text: "${targetText}"`);

        // 1: Try CSS selector with text content using page.evaluate
        try {
            const element = await page.evaluateHandle(
                (text, types) => {
                    const searchText = text.toLowerCase().trim();

                    // First try exact text match
                    for (const type of types) {
                        const elements = document.querySelectorAll(type);
                        for (const el of elements) {
                            const textContent = el.textContent
                                ?.trim()
                                .toLowerCase();
                            if (textContent === searchText) {
                                return el;
                            }
                        }
                    }

                    // Then try partial text match
                    for (const type of types) {
                        const elements = document.querySelectorAll(type);
                        for (const el of elements) {
                            const textContent = el.textContent
                                ?.trim()
                                .toLowerCase();
                            if (textContent?.includes(searchText)) {
                                return el;
                            }
                        }
                    }

                    // Try by value attribute for inputs
                    const inputs = document.querySelectorAll(
                        'input[type="submit"], input[type="button"], button',
                    );
                    for (const input of inputs) {
                        const value = input.value?.toLowerCase().trim();
                        if (
                            value === searchText ||
                            value?.includes(searchText)
                        ) {
                            return input;
                        }
                    }

                    return null;
                },
                targetText,
                elementTypes,
            );

            if (element) {
                // Scroll element
                await element.evaluate((el) =>
                    el.scrollIntoView({ behavior: "smooth", block: "center" }),
                );
                await delay(500);

                // Try clicking the element
                await element.click();
                console.log(`Successfully clicked element using JS evaluation`);
                await delay(1000);
                return { success: true, method: "javascript_evaluation" };
            }
        } catch (error) {
            console.log(`JavaScript evaluation failed: ${error.message}`);
        }

        //  2: Use XPath with modern page.$x method
        const xpathSelectors = [
            `//*[contains(text(), '${targetText}')]`,
            `//*[@value='${targetText}']`,
            `//*[@aria-label='${targetText}']`,
            `//*[@title='${targetText}']`,
        ];

        for (const xpath of xpathSelectors) {
            try {
                await page.waitForFunction(
                    (xpath) => {
                        const result = document.evaluate(
                            xpath,
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null,
                        );
                        return result.singleNodeValue !== null;
                    },
                    { timeout: waitTime },
                    xpath,
                );

                const elements = await page.$x(xpath);
                if (elements.length > 0) {
                    await elements[0].scrollIntoView();
                    await delay(500);
                    await elements[0].click();
                    console.log(
                        `Successfully clicked element using XPath: ${xpath}`,
                    );
                    await delay(1000);
                    return { success: true, method: "xpath", selector: xpath };
                }
            } catch (error) {
                console.log(`XPath failed: ${xpath} - ${error.message}`);
            }
        }

        // 3: Try common selectors for specific text
        const commonSelectors = [
            `button:contains("${targetText}")`,
            `a:contains("${targetText}")`,
            `input[value="${targetText}"]`,
            `[aria-label="${targetText}"]`,
            `[title="${targetText}"]`,
        ];

        for (const selector of commonSelectors) {
            try {
                const element = await page.evaluateHandle(
                    (sel, text) => {
                        // Custom contains implementation since CSS :contains is not standard
                        if (sel.includes(":contains")) {
                            const baseSelector = sel.split(":contains")[0];
                            const elements =
                                document.querySelectorAll(baseSelector);
                            for (const el of elements) {
                                if (
                                    el.textContent
                                        ?.trim()
                                        .toLowerCase()
                                        .includes(text.toLowerCase())
                                ) {
                                    return el;
                                }
                            }
                            return null;
                        } else {
                            return document.querySelector(sel);
                        }
                    },
                    selector,
                    targetText,
                );

                if (element) {
                    await element.scrollIntoView();
                    await delay(500);
                    await element.click();
                    console.log(
                        `Successfully clicked element using selector: ${selector}`,
                    );
                    await delay(1000);
                    return { success: true, method: "css_selector", selector };
                }
            } catch (error) {
                console.log(
                    `CSS selector failed: ${selector} - ${error.message}`,
                );
            }
        }

        throw new Error(
            `Could not find clickable element with text: "${targetText}"`,
        );
    },
});

const fillInput = tool({
    name: "fill_input",
    description:
        "Fill a form input field, will try multiple selectors if provided",
    parameters: z.object({
        selectors: z
            .array(z.string())
            .describe("Array of CSS selectors to try in order"),
        value: z.string().describe("Value to type in"),
    }),
    async execute({ selectors, value }) {
        let success = false;
        let lastError = null;

        for (const selector of selectors) {
            try {
                await page.waitForSelector(selector, {
                    visible: true,
                    timeout: 5000,
                });
                await page.focus(selector);
                await page.keyboard.down("Control");
                await page.keyboard.press("KeyA");
                await page.keyboard.up("Control");
                await page.keyboard.press("Delete");
                await delay(200);
                await page.type(selector, value, { delay: 100 });

                success = true;
                console.log(
                    `Successfully filled input with selector: ${selector}`,
                );
                break;
            } catch (error) {
                lastError = error.message;
                console.log(`Failed to fill ${selector}: ${error.message}`);
                continue;
            }
        }

        if (!success) {
            throw new Error(`Failed to fill input. Last error: ${lastError}`);
        }

        return { success: true };
    },
});

const getAdvancedPageStructure = tool({
    name: "get_advanced_page_structure",
    description: "Get detailed page structure with text content analysis",
    parameters: z.object({
        searchTerm: z
            .string()
            .nullable()
            .optional()
            .nullable()
            .describe("Specific term to search for in elements"),
    }),
    async execute({ searchTerm }) {
        const structure = await page.evaluate((term) => {
            const elements = [];

            if (term) {
                const allElements = document.querySelectorAll("*");
                const searchText = term.toLowerCase();

                for (let el of allElements) {
                    const textContent = el.textContent?.trim();
                    if (
                        textContent &&
                        textContent.toLowerCase().includes(searchText)
                    ) {
                        elements.push({
                            tag: el.tagName.toLowerCase(),
                            textContent: textContent.substring(0, 100),
                            className: el.className,
                            id: el.id,
                            name: el.name,
                            type: el.type,
                            value: el.value,
                            placeholder: el.placeholder,
                            visible: el.offsetParent !== null,
                            clickable:
                                ["A", "BUTTON", "INPUT"].includes(el.tagName) ||
                                el.onclick !== null ||
                                window.getComputedStyle(el).cursor ===
                                    "pointer",
                        });
                    }
                }
            } else {
                const interactiveSelectors = [
                    "button",
                    "a",
                    "input",
                    "select",
                    "textarea",
                    "[onclick]",
                    '[role="button"]',
                    "[tabindex]",
                ];

                interactiveSelectors.forEach((selector) => {
                    const els = document.querySelectorAll(selector);
                    els.forEach((el) => {
                        elements.push({
                            tag: el.tagName.toLowerCase(),
                            textContent: el.textContent
                                ?.trim()
                                .substring(0, 50),
                            className: el.className,
                            id: el.id,
                            name: el.name,
                            type: el.type,
                            value: el.value,
                            placeholder: el.placeholder,
                            visible: el.offsetParent !== null,
                            selector: selector,
                        });
                    });
                });
            }

            return elements;
        }, searchTerm);

        console.log(
            `Found ${structure.length} elements${
                searchTerm ? ` containing "${searchTerm}"` : ""
            }`,
        );

        structure.slice(0, 5).forEach((el, index) => {
            console.log(`Element ${index + 1}:`, {
                tag: el.tag,
                text: el.textContent?.substring(0, 30),
                id: el.id,
                className: el.className?.substring(0, 30),
            });
        });

        return { structure };
    },
});

const waitAndVerify = tool({
    name: "wait_and_verify",
    description: "Wait for page changes and verify navigation",
    parameters: z.object({
        expectedUrl: z
            .string()
            .nullable()
            .default(null)
            .describe("Expected URL pattern after action"),
        waitTime: z
            .number()
            .default(3000)
            .describe("Time to wait in milliseconds"),
    }),
    async execute({ expectedUrl, waitTime = 3000 }) {
        await delay(waitTime);
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);

        if (expectedUrl && !currentUrl.includes(expectedUrl)) {
            console.log(
                `Warning: Expected URL pattern '${expectedUrl}' not found in '${currentUrl}'`,
            );
        }

        return { currentUrl, success: true };
    },
});

export {
    openURL,
    takeScreenshotAndAnalyze,
    findAndClickElement,
    fillInput,
    getAdvancedPageStructure,
    waitAndVerify,
};
