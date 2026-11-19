import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/siragro_theme.dart';
import '../../core/widgets/state_views.dart';
import 'basket_controller.dart';

class BasketScreen extends ConsumerStatefulWidget {
  const BasketScreen({super.key});

  @override
  ConsumerState<BasketScreen> createState() => _BasketScreenState();
}

class _BasketScreenState extends ConsumerState<BasketScreen> {
  String? _updatingProductId;

  @override
  Widget build(BuildContext context) {
    final basketAsync = ref.watch(basketControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your Basket'),
        actions: [
          IconButton(
            tooltip: 'Refresh prices & stock',
            onPressed: () => ref.read(basketControllerProvider.notifier).refresh(),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: basketAsync.when(
        loading: () => const LoadingStateView(message: 'Loading your basket…'),
        error: (err, _) => ErrorRetryView(
          title: 'Basket Unavailable',
          message: err.toString(),
          onRetry: () => ref.read(basketControllerProvider.notifier).refresh(),
        ),
        data: (basket) {
          if (basket.error != null) {
            return ErrorRetryView(
              title: 'Basket Unavailable',
              message: basket.error!,
              onRetry: () =>
                  ref.read(basketControllerProvider.notifier).refresh(),
            );
          }

          if (basket.items.isEmpty) {
            return EmptyStateView(
              icon: Icons.shopping_basket_outlined,
              title: 'Your basket is empty',
              subtitle:
                  'Explore fresh produce, everyday groceries, and chilled drinks from our Hayes store.',
              action: ElevatedButton.icon(
                onPressed: () => context.go('/shop'),
                icon: const Icon(Icons.storefront_outlined),
                label: const Text('Browse Groceries'),
              ),
            );
          }

          return Column(
            children: [
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () =>
                      ref.read(basketControllerProvider.notifier).refresh(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: basket.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final item = basket.items[index];
                      final isBusy = _updatingProductId == item.productId;
                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              Container(
                                width: 68,
                                height: 68,
                                decoration: BoxDecoration(
                                  color: SiragroColors.surfaceWarm,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                clipBehavior: Clip.antiAlias,
                                child: item.product.primaryImageUrl != null &&
                                        !item.product.primaryImageUrl!
                                            .startsWith('/images/placeholder')
                                    ? CachedNetworkImage(
                                        imageUrl:
                                            item.product.primaryImageUrl!,
                                        fit: BoxFit.contain,
                                        errorWidget: (_, __, ___) => const Icon(
                                          Icons.shopping_basket_outlined,
                                        ),
                                      )
                                    : const Icon(
                                        Icons.shopping_basket_outlined,
                                        color: SiragroColors.brandLight,
                                      ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.product.name,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      '£${item.product.price.toStringAsFixed(2)} each',
                                      style: const TextStyle(
                                        fontSize: 12.5,
                                        color: SiragroColors.textMuted,
                                        fontFeatures: [
                                          FontFeature.tabularFigures(),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        IconButton(
                                          tooltip: 'Decrease quantity',
                                          visualDensity: VisualDensity.compact,
                                          onPressed: isBusy
                                              ? null
                                              : () {
                                                  HapticFeedback.selectionClick();
                                                  _changeQty(
                                                    item.productId,
                                                    item.quantity - 1,
                                                  );
                                                },
                                          icon: const Icon(
                                            Icons.remove_circle_outline_rounded,
                                          ),
                                        ),
                                        Padding(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 6,
                                          ),
                                          child: Text(
                                            '${item.quantity}',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w800,
                                              fontSize: 15,
                                              fontFeatures: [
                                                FontFeature.tabularFigures(),
                                              ],
                                            ),
                                          ),
                                        ),
                                        IconButton(
                                          tooltip: 'Increase quantity',
                                          visualDensity: VisualDensity.compact,
                                          onPressed: isBusy ||
                                                  item.quantity >= 20
                                              ? null
                                              : () {
                                                  HapticFeedback.selectionClick();
                                                  _changeQty(
                                                    item.productId,
                                                    item.quantity + 1,
                                                  );
                                                },
                                          icon: const Icon(
                                            Icons.add_circle_outline_rounded,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '£${item.lineTotal.toStringAsFixed(2)}',
                                    style: const TextStyle(
                                      fontSize: 15.5,
                                      fontWeight: FontWeight.w900,
                                      color: SiragroColors.brand,
                                      fontFeatures: [
                                        FontFeature.tabularFigures(),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  IconButton(
                                    tooltip: 'Remove item',
                                    onPressed: isBusy
                                        ? null
                                        : () {
                                            HapticFeedback.lightImpact();
                                            _changeQty(item.productId, 0);
                                          },
                                    icon: const Icon(
                                      Icons.delete_outline_rounded,
                                      color: SiragroColors.accentRed,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: SiragroColors.surface,
                  border: Border(top: BorderSide(color: SiragroColors.border)),
                ),
                child: SafeArea(
                  top: false,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (basket.hasAgeRestrictedItems)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.verified_user_outlined,
                                size: 18,
                                color: SiragroColors.accentRed,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Contains age-restricted items (Challenge 25 photo ID required).',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        color: SiragroColors.accentRed,
                                        fontWeight: FontWeight.w600,
                                      ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Server Subtotal (${basket.itemCount} items)',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: SiragroColors.textMuted,
                            ),
                          ),
                          Text(
                            '£${basket.subtotal.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: SiragroColors.brand,
                              fontFeatures: [FontFeature.tabularFigures()],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () async {
                            await ref
                                .read(basketControllerProvider.notifier)
                                .refresh();
                            if (!context.mounted) return;
                            context.push('/checkout');
                          },
                          child: const Text('Proceed to Checkout'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _changeQty(String productId, int quantity) async {
    setState(() => _updatingProductId = productId);
    final err = await ref
        .read(basketControllerProvider.notifier)
        .updateQuantity(productId, quantity);
    if (!mounted) return;
    setState(() => _updatingProductId = null);
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(err),
        ),
      );
    }
  }
}
