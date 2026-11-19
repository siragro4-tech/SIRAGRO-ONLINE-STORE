import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../app/theme/siragro_theme.dart';
import '../models/product.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onTap;
  final VoidCallback? onAddToBasket;
  final bool isAdding;

  const ProductCard({
    super.key,
    required this.product,
    required this.onTap,
    this.onAddToBasket,
    this.isAdding = false,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Consistent 1:1 product image box with loading & missing-image states
              AspectRatio(
                aspectRatio: 1,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: SiragroColors.surfaceMuted,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: _buildProductImage(),
                    ),
                    if (product.isAgeRestricted)
                      Positioned(
                        top: 6,
                        left: 6,
                        child: Semantics(
                          label: 'Age restricted ${product.minimumAge} plus',
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: SiragroColors.accentRed,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '${product.minimumAge}+',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                      ),
                    if (product.isOutOfStock)
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.8),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          alignment: Alignment.center,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: SiragroColors.brand,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'Out of Stock',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              if (product.category != null)
                Text(
                  product.category!.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: SiragroColors.brand,
                  ),
                ),
              const SizedBox(height: 2),
              Text(
                product.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                  color: SiragroColors.textPrimary,
                  height: 1.25,
                ),
              ),
              if (product.unit != null && product.unit!.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  product.unit!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: SiragroColors.textMuted,
                  ),
                ),
              ],
              const Spacer(),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Flexible(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '£${product.price.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: SiragroColors.brand,
                          ),
                        ),
                        if (product.hasDiscount)
                          Text(
                            '£${product.compareAtPrice!.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: SiragroColors.textMuted,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (!product.isOutOfStock && onAddToBasket != null)
                    SizedBox(
                      height: 40,
                      child: ElevatedButton(
                        onPressed: isAdding ? null : onAddToBasket,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          minimumSize: const Size(44, 40),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: isAdding
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.add_shopping_cart, size: 18),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProductImage() {
    final url = product.primaryImageUrl;
    if (url == null || url.isEmpty || url.startsWith('/images/placeholder')) {
      return const Center(
        child: Icon(
          Icons.shopping_basket_outlined,
          size: 36,
          color: SiragroColors.textMuted,
        ),
      );
    }

    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.contain,
      placeholder: (_, __) => const Center(
        child: SizedBox(
          width: 22,
          height: 22,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: SiragroColors.brandLight,
          ),
        ),
      ),
      errorWidget: (_, __, ___) => const Center(
        child: Icon(
          Icons.image_not_supported_outlined,
          size: 32,
          color: SiragroColors.textMuted,
        ),
      ),
    );
  }
}
