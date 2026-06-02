import { test, expect } from '@playwright/test';

test.describe('Not Authenticated Tests', () => {
    test("can open the website", async ({ page }) => {
        // 1. Open the homepage
        await page.goto('');

        // 2. Verify the page title
        await expect(page).toHaveTitle(/Automation Exercise/);

        // 3. Verify the page content
        const title = await page
            .locator('.features_items .title')
            .first()
            .textContent({ timeout: 3000 });

        await expect(title).toContain('Features Items');
    });

    test("can log into the website", async ({ page }) => {
        // 1. Open the login page
        await page.goto('/login');

        // 2. Fill in the login credentials
        await page.locator('input[data-qa="login-email"]').fill(process.env.USER_EMAIL || '');
        await page.locator('input[data-qa="login-password"]').fill(process.env.USER_PASSWORD || '');
        await page.locator('button[data-qa="login-button"]').click();

        // 3. Verify the login success
        await expect(page.locator('a[href="/logout"]')).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Authenticated Tests', () => {
    test.use({ storageState: '.states/logged-in.json' });

    test("can buy a product", async ({ page }) => {
        await test.step("Add the blue top to cart", async () => {
            await page.goto('/products');

            const product = await page.locator('.features_items .product-image-wrapper', { hasText: /Blue Top/ }).first();
            await product.hover();
            await product.locator('.product-overlay .add-to-cart').first().click();

            await page.locator('#cartModal .close-modal').first().click();
        });

        await test.step("Proceed to checkout", async () => {
            await page.goto('/view_cart');

            await page.locator('.check_out').first().click();

            await expect(page).toHaveURL(/\/checkout/);
        });

        await test.step("Place order", async () => {
            await page.locator('#ordermsg > textarea').fill('Test order');
            await page.locator('.check_out').first().click();

            await page.locator('input[data-qa="name-on-card"]').fill('John Doe');
            await page.locator('input[data-qa="card-number"]').fill('1234567890123456');
            await page.locator('input[data-qa="cvc"]').fill('123');
            await page.locator('input[data-qa="expiry-month"]').fill('12');
            await page.locator('input[data-qa="expiry-year"]').fill('25');

            await page.locator('button[data-qa="pay-button"]').click();
        });

        await test.step("Verify order success", async () => {
            await expect(page).toHaveURL(/\/payment_done\/\d+/, { timeout: 10000 });

            await expect(page.locator('h2[data-qa="order-placed"]')).toBeVisible();
        });
    });
});
