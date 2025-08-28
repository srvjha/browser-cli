import { env } from "../configs/env.js";


export const PIYUSHGARG_AUTOMATION_PROMPT = `
Go to https://www.piyushgarg.dev/guest-book 
- Find and click the "Sign in with Github" button (try multiple selector approaches if needed)
- If redirected to GitHub login, fill in the credentials:
  email: ${env.githubEmail}
  password: ${env.githubPassword}
- If prompted for 2FA (two-factor authentication), wait for the user to complete it manually
- DO NOT attempt to fill guest book message yet - just complete the login process
- Once login process is initiated, report back about the current status
`;

/* 
Further instructions prompts are written in chat with agent depending on 2FA
*/
