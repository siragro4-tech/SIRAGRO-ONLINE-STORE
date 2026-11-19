import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../app/theme/siragro_theme.dart';
import '../../core/widgets/motion.dart';
import '../models/product.dart';

class ProductCard extends StatefulWidget {
  final Product product;
  final VoidCallback onTap;
  final Future<void> Function()? onAddToBasket;
  final bool isAdding;

  const ProductCard({
    super.key,
    required this.product,
    required this.onTap,
    this.onAddToBasket,
    this.isAdding = false,
  });

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  bool _justAdded = false;

  Future<void> _handleAdd() async {
    if (widget.onAddToBasket == null || widget.isAdding) return;
    HapticFeedback.lightImpact();
    await widget.onAddToBasket!();
    if (!mounted) return;
    setState(() => _justAdded = true);
    await Future<void>.delayed(const Duration(milliseconds: 1100));
    if (mounted) {
      setState(() => _justAdded = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final animDuration = SiragroMotion.duration(
      context,
      normal: const Duration(milliseconds: 220),
    );

    return Container(
      decoration: BoxDecoration(
        color: SiragroColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: SiragroColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: widget.onTap,
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AspectRatio(
                  aspectRatio: 1,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Hero(
                        tag: 'product-image-${product.id}',
                        child: Container(
                          decoration: BoxDecoration(
                            color: SiragroColors.surfaceWarm,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: _buildProductImage(product),
                        ),
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
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ),
                        ),
                      if (product.isLowStock && !product.isOutOfStock)
                        Positioned(
                          bottom: 6,
                          left: 6,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: SiragroColors.brassTint,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: SiragroColors.brass.withValues(alpha: 0.4),
                              ),
                            ),
                            child: Text(
                              'Only ${product.stockQuantity} left',
                              style: const TextStyle(
                                color: SiragroColors.brandDark,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      if (product.isOutOfStock)
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              color: SiragroColors.surface.withValues(alpha: 0.84),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            alignment: Alignment.center,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: SiragroColors.brand,
                                borderRadius: BorderRadius.circular(8),
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
                    product.category!.name.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                      color: SiragroColors.sage,
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
                              fontFeatures: [FontFeature.tabularFigures()],
                            ),
                          ),
                          if (product.hasDiscount)
                            Text(
                              '£${product.compareAtPrice!.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: SiragroColors.textMuted,
                                decoration: TextDecoration.lineThrough,
                                fontFeatures: [FontFeature.tabularFigures()],
                              ),
                            ),
                        ],
                      ),
                    ),
                    if (!product.isOutOfStock && widget.onAddToBasket != null)
                      AnimatedContainer(
                        duration: animDuration,
                        height: 40,
                        decoration: BoxDecoration(
                          color: _justAdded
                              ? SiragroColors.sage
                              : SiragroColors.brand,
                          borderRadius: BorderRadius.circular(11),
                        ),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(11),
                          onTap: widget.isAdding ? null : _handleAdd,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 11),
                            child: AnimatedSwitcher(
                              duration: animDuration,
                              child: widget.isAdding
                                  ? const SizedBox(
                                      key: ValueKey('loading'),
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : _justAdded
                                      ? const Icon(
                                          Icons.check_rounded,
                                          key: ValueKey('added'),
                                          color: Colors.white,
                                          size: 18,
                                        )
                                      : const Icon(
                                          Icons.add_shopping_cart_rounded,
                                          key: ValueKey('add'),
                                          color: Colors.white,
                                          size: 18,
                                        ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProductImage(Product product) {
    final url = product.primaryImageUrl;
    if (url == null || url.isEmpty || url.startsWith('/images/placeholder')) {
      return Center(
        child: Icon(
          product.isAgeRestricted
              ? Icons.wine_bar_outlined
              : Icons.shopping_basket_outlined,
          size: 36,
          color: SiragroColors.brandLight.withValues(alpha: 0.55),
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
