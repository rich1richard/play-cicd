export interface Product {
    id: string;
    name: string;
    price: string;
    image: string;
}


export function getRandomProducts(products: Product[], count: number = 1): Product[] {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
