import dotenv from 'dotenv';
dotenv.config();

export const env = {
       githubEmail:process.env.GITHUB_EMAIL,
       githubPassword:process.env.GITHUB_PASSWORD,
       amazonEmail:process.env.AMAZON_EMAIL,
       amazonPassword:process.env.AMAZON_PASSWORD,
       phoneNumber:process.env.MOBILE_NUMBER
}