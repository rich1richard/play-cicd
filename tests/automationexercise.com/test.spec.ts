import { test, expect } from '@playwright/test';

test("can open the website", async ({ page }) => {
    await page.goto('https://www.automationexercise.com');

    await expect(page).toHaveTitle(/Automation Exercise/);

    const title = await page
        .locator('.features_items .title')
        .first()
        .textContent();

    await expect(title).toContain('Features Items');
});
