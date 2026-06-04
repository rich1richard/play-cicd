import { test, expect } from '@playwright/test';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { getRandomProducts, Product } from './utils';

test.describe('API Tests', () => {
    test.use({ storageState: '.states/logged-in.json' });

    test('can get product data', async ({ request }) => {
        const response = await request.get('/products');

        expect(response.ok()).toBeTruthy();
        expect(await response.text()).toMatch(/All Products/);
    });

    test("can add product to cart", async ({ request }) => {
        const products = await test.step("Get products", () => {
            // make sure the test runs on the same data if flaky
            if(test.info().attachments[0]){
                return JSON.parse(test.info().attachments[0]?.body?.toString() || '[]');
            }

            const products: Array<Product> = JSON.parse(fs.readFileSync('.states/products.json', 'utf-8'));
            const selectedProducts = getRandomProducts(products, 3);

            test.info().attachments.push({
                name: 'added-products.json',
                contentType: 'application/json',
                body: Buffer.from(JSON.stringify(selectedProducts))
            })

            return selectedProducts;
        });

        await test.step("Add products to cart", async () => {
            for (const product of products) {
                const addProductResponse = await request.get(`/add_to_cart/${product.id}`);

                expect(addProductResponse.ok()).toBeTruthy();
                expect(await addProductResponse.text()).toContain('Added To Cart');
            }
        });
    });

    test("can checkout", async ({ request }) => {
        const product = await test.step("Get a product", () => {
            // make sure the test runs on the same data if flaky
            if(test.info().attachments[0]){
                return JSON.parse(test.info().attachments[0]?.body?.toString() || '{}');
            }

            const products: Array<Product> = JSON.parse(fs.readFileSync('.states/products.json', 'utf-8'));
            const selectedProduct = getRandomProducts(products)[0];

            test.info().attachments.push({
                name: 'checkout-product.json',
                contentType: 'application/json',
                body: Buffer.from(JSON.stringify(selectedProduct))
            })

            return selectedProduct;
        });

        await test.step("Add the product to cart", async () => {
            const addProductResponse = await request.get(`/add_to_cart/${product.id}`);

            expect(addProductResponse.ok()).toBeTruthy();
            expect(await addProductResponse.text()).toContain('Added To Cart');
        });

        const token = await test.step("Extract the secret token", async () => {
            const paymentResponse = await request.get('/payment');
            expect(paymentResponse.ok()).toBeTruthy();

            const $ = cheerio.load(await paymentResponse.text());

            const token = $('input[name="csrfmiddlewaretoken"]').val();
            expect(token).toBeTruthy();

            return token as string;
        });

        await test.step("Checkout with the token", async () => {
            const checkoutResponse = await request.post('/payment', {
                form: {
                    csrfmiddlewaretoken: token,
                    name_on_card: 'John Doe',
                    card_number: '1234567890123456',
                    cvc: '311',
                    expiry_month: '12',
                    expiry_year: '24'
                },
                headers: {
                    Referer: `${process.env.BASE_URL}/payment`,
                    Origin: `${process.env.BASE_URL}`
                }
            });

            expect(checkoutResponse.ok()).toBeTruthy();
            expect(checkoutResponse.url()).toMatch(/\/payment_done\/\d+/);
        });
    });

    test("can see the product", async ({ page }) => {
        const product = await test.step("Get a product", () => {
            // make sure the test runs on the same data if flaky
            if(test.info().attachments[0]){
                return JSON.parse(test.info().attachments[0]?.body?.toString() || '{}');
            }

            const products: Array<Product> = JSON.parse(fs.readFileSync('.states/products.json', 'utf-8'));
            const selectedProduct = getRandomProducts(products)[0];

            test.info().attachments.push({
                name: 'display-product.json',
                contentType: 'application/json',
                body: Buffer.from(JSON.stringify(selectedProduct))
            })

            return selectedProduct;
        });

        await test.step("Find product in view", async () => {
            await page.goto('/products');
            // await page.waitForLoadState('networkidle');

            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });

            const targetProduct = await page.locator('.productinfo', { hasText: new RegExp(product.name, 'i') }).first();
            expect(targetProduct, `Product "${product.name}" should be visible`).toBeVisible();
        });
    });
});


