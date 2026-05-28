import { test, expect } from '@playwright/test';

test("can open the website", async ({ page }) => {
    await page.goto('');

    await expect(page).toHaveTitle(/Automation Exercise/);

    const title = await page
        .locator('.features_items .title')
        .first()
        .textContent({ timeout: 3000 });

    await expect(title).toContain('Features Items');
});
