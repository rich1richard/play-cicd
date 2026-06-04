import { test, expect } from '@playwright/test';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { Product } from './utils';

const PRODUCTS_ADDED_COUNT = 3;

test.describe('API Tests', () => {
    test.use({ storageState: '.states/logged-in.json' });

    test('can get product data', async ({ page }) => {
        const response = await page.request.get('/products');

        expect(response.ok()).toBeTruthy();
        expect(await response.text()).toMatch(/All Products/);
    });

    test("can add product to cart", async ({ page }, testInfo) => {
        const products = await test.step("Get products", () => {
            const products: Array<Product> = JSON.parse(fs.readFileSync('.states/products.json', 'utf-8'));
            const selectedProducts = products.sort(() => Math.random() - 0.5).slice(0, PRODUCTS_ADDED_COUNT);

            const projectName = testInfo.project.name.replace(/\s+/g, '-').toLowerCase();
            fs.writeFileSync(`./playwright-report/added-products-${projectName}.json`, JSON.stringify(selectedProducts));

            return selectedProducts;
        });

        await test.step("Add products to cart", async () => {
            for (const product of products) {
                const addProductResponse = await page.request.get(`/add_to_cart/${product.id}`);

                expect(addProductResponse.ok()).toBeTruthy();
                expect(await addProductResponse.text()).toContain('Added To Cart');
            }
        });
    });

    test("can checkout", async ({ page }) => {
        const product = await test.step("Get a product", () => {
            const products: Array<Product> = JSON.parse(fs.readFileSync('.states/products.json', 'utf-8'));
            const selectedProduct = products.sort(() => Math.random() - 0.5)[0];

            fs.writeFileSync('./playwright-report/checkout-product.json', JSON.stringify(selectedProduct));

            return selectedProduct;
        });

        await test.step("Add the product to cart", async () => {
            const addProductResponse = await page.request.get(`/add_to_cart/${product.id}`);

            expect(addProductResponse.ok()).toBeTruthy();
            expect(await addProductResponse.text()).toContain('Added To Cart');
        });

        const token = await test.step("Extract the secret token", async () => {
            const paymentResponse = await page.request.get('/payment');
            expect(paymentResponse.ok()).toBeTruthy();

            const $ = cheerio.load(await paymentResponse.text());

            const token = $('input[name="csrfmiddlewaretoken"]').val();
            expect(token).toBeTruthy();

            return token as string;
        });

        await test.step("Checkout with the token", async () => {
            const checkoutResponse = await page.request.post('/payment', {
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

    test("can verify the order", async ({ page }) => {
        const product = await test.step("Get a product", () => {
            const products: Array<Product> = JSON.parse(fs.readFileSync('.states/products.json', 'utf-8'));
            const selectedProduct = products.sort(() => Math.random() - 0.5)[0];

            fs.writeFileSync('./playwright-report/display-product.json', JSON.stringify(selectedProduct));

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


