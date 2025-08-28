import { env } from "../configs/env.js";

export const AMAZON_AUTOMATION_PROMPT = `
Navigate to Amazon and complete the login and shopping process. Follow these steps carefully:

1. Navigate to Amazon
   - Open https://www.amazon.in
   - Take a screenshot to verify page loaded
   - Wait for the page to fully load

2. Start Login Process
   - Look for "Hello, Sign in" or "Account & Lists" text
   - Click on it to start login process
   - Take screenshot after clicking

3. Enter Email
   - Fill the email field with:${env.amazonEmail}
   - Use inputType: "email" parameter
   - Verify the email was entered correctly
   - Take screenshot to confirm

4. Click Continue
   - Find and click the "Continue" button
   - Wait for the password page to load
   - Take screenshot of password page

5. Enter Password
   - Fill the password field with: ${env.amazonPassword}
   - Use inputType: "password" parameter
   - Click "Sign In" button
   - Then It will ask for otp that will be handled by the user so wait for 1 min
   - Wait for homepage to load

6. Search for Product
   - Find the search bar
   - Type "black t-shirt for men"
   - Click search or press enter
   - Wait for results to load

7. Select Product
   - From search results, click on any non-sponsored product
   - Wait for product page to load
   - Take screenshot of product page

8. Add to Cart
   - Find "Add to Cart" button
   - Click it
   - Wait for confirmation

9. Go to Cart
   - Click on cart icon
   - Navigate to cart page
   - Find "Proceed to Buy" button
   - Stop here (don't click it)

At each step, if something fails:
- Take a screenshot
- Analyze the page structure
- Try alternative approaches
- Wait longer if needed for dynamic content
`;