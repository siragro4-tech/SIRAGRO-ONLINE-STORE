import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById, getCategories } from "@/lib/products";
import { ProductForm } from "@/components/admin/ProductForm";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  return {
    title: product ? `Edit: ${product.name}` : "Product Not Found",
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <ProductForm initialProduct={product} categories={categories} />
    </div>
  );
}

