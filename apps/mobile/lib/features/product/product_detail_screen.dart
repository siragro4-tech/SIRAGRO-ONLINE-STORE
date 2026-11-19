import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme/siragro_theme.dart';
import '../../core/providers/app_providers.dart';
import '../../core/widgets/state_views.dart';
import '../../shared/models/product.dart';
import '../basket/basket_controller.dart';

final productDetailProvider =
    FutureProvider.autoDispose.family<Product, String>((ref, slug) async {
  final api = ref.read(apiClientProvider);
  final data = await api.get('/api/v1/products/$slug');
  return Product.fromJson((data['product'] as Map<String, dynamic>?) ?? const {});
});

class ProductDetailScreen extends ConsumerStatefulWidget {
  final String slug;

  const ProductDetailScreen({super.key, required this.slug});

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  int _quantity = 1;
  int _imageIndex = 0;
  bool _isAdding = false;

  @override
  Widget build(BuildContext context) {
    final productAsync = ref.watch(productDetailProvider(widget.slug));

    return Scaffold(
      appBar: AppBar(title: const Text('Product Details')),
      body: productAsync.when(
        loading: () => const LoadingStateView(message: 'Loading product…'),
        error: (err, _) => ErrorRetryView(
          message: err.toString(),
          onRetry: () => ref.invalidate(productDetailProvider(widget.slug)),
        ),
        data: (product) {
          final gallery = product.images.isNotEmpty
              ? product.images.map((i) => i.url).toList()
              : (product.primaryImageUrl != null
                  ? [product.primaryImageUrl!]
                  : <String>[]);

          final maxSelectable =
              product.stockQuantity > 0 ? product.stockQuantity.clamp(1, 20) : 1;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Image gallery
              AspectRatio(
                aspectRatio: 1,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: SiragroColors.border),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: gallery.isEmpty
                      ? const Center(
                          child: Icon(
                            Icons.shopping_basket_outlined,
                            size: 64,
                            color: SiragroColors.textMuted,
                          ),
                        )
                      : Stack(
                          children: [
                            PageView.builder(
                              itemCount: gallery.length,
                              onPageChanged: (i) =>
                                  setState(() => _imageIndex = i),
                              itemBuilder: (_, idx) => CachedNetworkImage(
                                imageUrl: gallery[idx],
                                fit: BoxFit.contain,
                                placeholder: (_, __) => const Center(
                                  child: CircularProgressIndicator(),
                                ),
                                errorWidget: (_, __, ___) => const Center(
                                  child: Icon(
                                    Icons.image_not_supported_outlined,
                                    size: 48,
                                    color: SiragroColors.textMuted,
                                  ),
                                ),
                              ),
                            ),
                            if (gallery.length > 1)
                              Positioned(
                                bottom: 10,
                                left: 0,
                                right: 0,
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: List.generate(
                                    gallery.length,
                                    (idx) => Container(
                                      margin: const EdgeInsets.symmetric(
                                        horizontal: 3,
                                      ),
                                      width: _imageIndex == idx ? 18 : 8,
                                      height: 8,
                                      decoration: BoxDecoration(
                                        color: _imageIndex == idx
                                            ? SiragroColors.brand
                                            : SiragroColors.border,
                                        borderRadius: BorderRadius.circular(999),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 16),

              if (product.category != null)
                Text(
                  product.category!.name.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.6,
                    color: SiragroColors.brand,
                  ),
                ),
              const SizedBox(height: 4),
              Text(
                product.name,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: SiragroColors.textPrimary,
                ),
              ),
              if (product.brand != null || product.unit != null) ...[
                const SizedBox(height: 4),
                Text(
                  [product.brand, product.unit]
                      .where((s) => s != null && s.isNotEmpty)
                      .join(' • '),
                  style: const TextStyle(
                    fontSize: 14,
                    color: SiragroColors.textMuted,
                  ),
                ),
              ],
              const SizedBox(height: 12),

              // Price & Availability
              Row(
                children: [
                  Text(
                    '£${product.price.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: SiragroColors.brand,
                    ),
                  ),
                  if (product.hasDiscount) ...[
                    const SizedBox(width: 10),
                    Text(
                      '£${product.compareAtPrice!.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 16,
                        color: SiragroColors.textMuted,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                  ],
                  const Spacer(),
                  Chip(
                    label: Text(
                      product.isOutOfStock
                          ? 'Out of Stock'
                          : product.isLowStock
                              ? 'Only ${product.stockQuantity} left'
                              : 'In Stock',
                    ),
                    backgroundColor: product.isOutOfStock
                        ? SiragroColors.accentRed.withValues(alpha: 0.1)
                        : SiragroColors.accentGreen.withValues(alpha: 0.1),
                    labelStyle: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: product.isOutOfStock
                          ? SiragroColors.accentRed
                          : SiragroColors.accentGreen,
                    ),
                  ),
                ],
              ),

              if (product.isAgeRestricted) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: SiragroColors.accentRed.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: SiragroColors.accentRed.withValues(alpha: 0.35),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.verified_user_outlined,
                        color: SiragroColors.accentRed,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Challenge 25 (${product.minimumAge}+): Valid photo ID is required upon in-store collection or delivery.',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: SiragroColors.accentRed,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              if (product.description != null &&
                  product.description!.trim().isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text(
                  'Product Information',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: SiragroColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  product.description!,
                  style: const TextStyle(
                    fontSize: 14,
                    color: SiragroColors.textPrimary,
                    height: 1.5,
                  ),
                ),
              ],

              const SizedBox(height: 24),

              // Quantity + Add to Basket
              if (!product.isOutOfStock)
                Row(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: SiragroColors.border),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            tooltip: 'Decrease quantity',
                            onPressed: _quantity > 1
                                ? () => setState(() => _quantity -= 1)
                                : null,
                            icon: const Icon(Icons.remove),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            child: Text(
                              '$_quantity',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          IconButton(
                            tooltip: 'Increase quantity',
                            onPressed: _quantity < maxSelectable
                                ? () => setState(() => _quantity += 1)
                                : null,
                            icon: const Icon(Icons.add),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _isAdding
                            ? null
                            : () async {
                                setState(() => _isAdding = true);
                                final err = await ref
                                    .read(basketControllerProvider.notifier)
                                    .addItem(product.id, quantity: _quantity);
                                if (!context.mounted) return;
                                setState(() => _isAdding = false);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      err ??
                                          'Added $_quantity × ${product.name} to basket',
                                    ),
                                  ),
                                );
                              },
                        icon: const Icon(Icons.shopping_basket_outlined),
                        label: Text(
                          _isAdding
                              ? 'Adding…'
                              : 'Add • £${(product.price * _quantity).toStringAsFixed(2)}',
                        ),
                      ),
                    ),
                  ],
                ),
            ],
          );
        },
      ),
    );
  }
}
