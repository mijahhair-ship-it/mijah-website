import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PRODUCT_PAGES = [
  { file: 'product-elixir.html', productType: 'Soins capillaires > Elixirs anti-chute' },
  { file: 'product-rosemary.html', productType: 'Soins capillaires > Huiles de croissance' },
  { file: 'product-mango.html', productType: 'Soins capillaires > Beurres hydratants' },
];

const GOOGLE_PRODUCT_CATEGORY = 'Health & Beauty > Personal Care > Hair Care';

function jsonLdDocuments(html, sourceName) {
  const scripts = html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  return [...scripts].map((match) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      throw new Error(`Invalid JSON-LD in ${sourceName}`, { cause: error });
    }
  });
}

function findDocument(documents, type, sourceName) {
  const document = documents.find((item) => item?.['@type'] === type);
  if (!document) throw new Error(`Missing ${type} JSON-LD in ${sourceName}`);
  return document;
}

function availabilityValue(value) {
  const normalized = String(value || '').split('/').pop();
  const values = {
    InStock: 'in stock',
    OutOfStock: 'out of stock',
    PreOrder: 'available for order',
    PreSale: 'available for order',
    Discontinued: 'discontinued',
  };
  const result = values[normalized];
  if (!result) throw new Error(`Unsupported product availability: ${value}`);
  return result;
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function productRow(product, productType) {
  const offer = product.offers;
  if (!offer?.price || !offer?.priceCurrency || !offer?.url) {
    throw new Error(`Incomplete Offer JSON-LD for ${product.name || 'unknown product'}`);
  }
  if (!product.sku || !product.name || !product.description || !product.image) {
    throw new Error(`Incomplete Product JSON-LD for ${product.name || 'unknown product'}`);
  }

  return {
    id: product.sku,
    title: product.name,
    description: product.description,
    availability: availabilityValue(offer.availability),
    condition: 'new',
    price: `${Number(offer.price).toFixed(2)} ${offer.priceCurrency}`,
    link: offer.url,
    image_link: product.image,
    brand: product.brand?.name || 'MÎJAH',
    google_product_category: GOOGLE_PRODUCT_CATEGORY,
    product_type: productType,
  };
}

export async function generateMetaCatalog(root, outputPath) {
  const rows = [];

  for (const page of PRODUCT_PAGES) {
    const html = await readFile(path.join(root, page.file), 'utf8');
    const product = findDocument(jsonLdDocuments(html, page.file), 'Product', page.file);
    rows.push(productRow(product, page.productType));
  }

  const collectionFile = 'collection.html';
  const collectionHtml = await readFile(path.join(root, collectionFile), 'utf8');
  const collection = findDocument(
    jsonLdDocuments(collectionHtml, collectionFile),
    'CollectionPage',
    collectionFile,
  );
  const trio = collection.hasPart?.find((item) => item?.name?.includes('Trio'));
  if (!trio?.offers?.price || !trio?.image) {
    throw new Error('Missing MÎJAH Trio data in collection.html');
  }

  rows.push({
    id: 'MIJAH-TRIO-SET',
    title: trio.name,
    description:
      "Routine capillaire complète réunissant l'Elixir Anti-Chute, l'Huile de Croissance Rosemary et le Beurre de Mangue MÎJAH.",
    availability: availabilityValue(trio.offers.availability || 'InStock'),
    condition: 'new',
    price: `${Number(trio.offers.price).toFixed(2)} ${trio.offers.priceCurrency || 'EUR'}`,
    link: 'https://mijah.fr/gamme-complete',
    image_link: trio.image,
    brand: 'MÎJAH',
    google_product_category: GOOGLE_PRODUCT_CATEGORY,
    product_type: 'Soins capillaires > Coffrets',
  });

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n');

  await writeFile(outputPath, `${csv}\n`, 'utf8');
}
