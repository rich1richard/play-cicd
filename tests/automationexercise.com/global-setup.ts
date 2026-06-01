import { chromium } from '@playwright/test';

export default async function globalSetup() {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(`${process.env.BASE_URL}/login`);
    await page.locator('input[data-qa="login-email"]').fill(process.env.USER_EMAIL || '');
    await page.locator('input[data-qa="login-password"]').fill(process.env.USER_PASSWORD || '');
    await page.locator('button[data-qa="login-button"]').click();

    await page.context().storageState({ path: 'storageState.json' });

    await browser.close();
}
