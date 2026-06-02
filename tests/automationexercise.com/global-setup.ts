import { chromium, Page } from '@playwright/test';

export default async function globalSetup() {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page: Page = await context.newPage();

    const consentView = page.locator('.fc-consent-root');

    // ---------------------------------------------------------------------
    await page.goto(`${process.env.BASE_URL}/login`);

    try {
        await consentView.waitFor({ state: 'attached', timeout: 20000 });

        await page.locator('.fc-cta-consent').first().click();

        await consentView.waitFor({ state: 'detached', timeout: 10000 });
        await page.waitForLoadState('networkidle');
    } catch (error) {
        // Consent not found or failed to handle, continue
    }

    await page.context().storageState({ path: '.states/fc-consent-done.json' });

    // ---------------------------------------------------------------------
    await page.locator('input[data-qa="login-email"]').fill(process.env.USER_EMAIL || '');
    await page.locator('input[data-qa="login-password"]').fill(process.env.USER_PASSWORD || '');
    await page.locator('button[data-qa="login-button"]').click();

    await page.locator('a[href="/logout"]').waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForLoadState('networkidle');

    await page.context().storageState({ path: '.states/logged-in.json' });

    await browser.close();
}
