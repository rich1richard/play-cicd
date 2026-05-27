import { test, expect } from '@playwright/test';

test("can open the website", async ({ page }) => {
    await page.goto('https://www.automationexercise.com');

    const pageTitle = await page.title();
    await expect(pageTitle).toContain('Automation Exercise');

    const title = await page
        .locator('.features_items .title')
        .first()
        .textContent();

    await expect(title).toContain('Features Items');
})
