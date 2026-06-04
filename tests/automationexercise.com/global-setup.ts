import { chromium, Page } from '@playwright/test';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import { Product } from './utils';

export default async function globalSetup() {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page: Page = await context.newPage();

    const consentView = page.locator('.fc-consent-root');

    // HANDLE CONSENT ---------------------------------------------------------------------
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

    // LOGIN ---------------------------------------------------------------------
    await page.locator('input[data-qa="login-email"]').fill(process.env.USER_EMAIL || '');
    await page.locator('input[data-qa="login-password"]').fill(process.env.USER_PASSWORD || '');
    await page.locator('button[data-qa="login-button"]').click();

    await page.locator('a[href="/logout"]').waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForLoadState('networkidle');

    await page.context().storageState({ path: '.states/logged-in.json' });

    // GET PRODUCTS ---------------------------------------------------------------------
    const response = await page.request.get(`${process.env.BASE_URL}/products`);

    if (response.ok()) {
        const $ = cheerio.load(await response.text());

        const products: Product[] = $('.productinfo').map((_, el) => {
            return {
                id: $(el).find('a.add-to-cart').attr('data-product-id') || '',
                name: $(el).find('p').text(),
                price: $(el).find('h2').text(),
                image: $(el).find('img').attr('src') || '',
            };
        }).get();

        if(products.length > 0){
            fs.writeFileSync('.states/products.json', JSON.stringify(products));
        }
    }

    // ---------------------------------------------------------------------
    const cartResponse = await page.request.get(`${process.env.BASE_URL}/view_cart`);

    if(cartResponse.ok()) {
        const $ = cheerio.load(await cartResponse.text());

        for(const product of $('#cart_info_table tbody tr').get()) {
            const productId = $(product).attr('id')?.replace('product-', '');

            await page.request.get(`${process.env.BASE_URL}/delete_cart/${productId}`);
        }
    }

    await browser.close();
}
