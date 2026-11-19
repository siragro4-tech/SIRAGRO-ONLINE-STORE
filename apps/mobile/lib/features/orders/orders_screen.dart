import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../app/theme/siragro_theme.dart';
import '../../core/providers/app_providers.dart';
import '../../core/widgets/motion.dart';
import '../../core/widgets/state_views.dart';
import '../../shared/models/order.dart';
import '../auth/auth_controller.dart';

final ordersListProvider =
    FutureProvider.autoDispose<List<CustomerOrder>>((ref) async {
  final auth = ref.watch(authControllerProvider);
  if (!auth.isAuthenticated) {
    return const [];
  }
  final api = ref.read(apiClientProvider);
  final data = await api.get('/api/v1/orders');
  return (data['orders'] as List<dynamic>? ?? const [])
      .whereType<Map<String, dynamic>>()
      .map(CustomerOrder.fromJson)
      .toList();
});

final orderDetailProvider =
    FutureProvider.autoDispose.family<CustomerOrder, String>((ref, id) async {
  final api = ref.read(apiClientProvider);
  final data = await api.get('/api/v1/orders/$id');
  return CustomerOrder.fromJson(
    (data['order'] as Map<String, dynamic>?) ?? const {},
  );
});

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final textTheme = Theme.of(context).textTheme;

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('My Orders')),
        body: EmptyStateView(
          icon: Icons.lock_outline_rounded,
          title: 'Sign in to view your orders',
          subtitle: 'Order history is available for signed-in customer accounts.',
          action: ElevatedButton(
            onPressed: () => context.push('/auth/sign-in'),
            child: const Text('Sign In'),
          ),
        ),
      );
    }

    final ordersAsync = ref.watch(ordersListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Orders')),
      body: ordersAsync.when(
        loading: () => const LoadingStateView(message: 'Loading your orders…'),
        error: (err, _) => ErrorRetryView(
          message: err.toString(),
          onRetry: () => ref.invalidate(ordersListProvider),
        ),
        data: (orders) {
          if (orders.isEmpty) {
            return EmptyStateView(
              icon: Icons.receipt_long_outlined,
              title: 'No orders yet',
              subtitle: 'Your completed SIRAGRO orders will appear here.',
              action: ElevatedButton(
                onPressed: () => context.go('/shop'),
                child: const Text('Start Shopping'),
              ),
            );
          }

          return RefreshIndicator(
            color: SiragroColors.brand,
            onRefresh: () async => ref.invalidate(ordersListProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(SiragroSpacing.md),
              itemCount: orders.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: SiragroSpacing.sm),
              itemBuilder: (context, index) {
                final order = orders[index];
                return StaggeredEntrance(
                  index: index,
                  child: Card(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => context.push('/orders/${order.id}'),
                      child: Padding(
                        padding: const EdgeInsets.all(SiragroSpacing.md),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '#${order.orderNumber}',
                                  style: textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                Row(
                                  children: [
                                    Text(
                                      '£${order.total.toStringAsFixed(2)}',
                                      style: textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.w800,
                                        color: SiragroColors.brand,
                                        fontFeatures: const [
                                          FontFeature.tabularFigures(),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    const Icon(
                                      Icons.chevron_right_rounded,
                                      color: SiragroColors.textMuted,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            if (order.createdAt != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                DateFormat('dd MMM yyyy, HH:mm')
                                    .format(order.createdAt!.toLocal()),
                                style: textTheme.bodySmall,
                              ),
                            ],
                            const SizedBox(height: SiragroSpacing.sm),
                            Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: [
                                _StatusBadge(
                                  label:
                                      'Payment: ${order.paymentStatus.toUpperCase()}',
                                  color: order.paymentStatus == 'paid'
                                      ? SiragroColors.sage
                                      : SiragroColors.brass,
                                ),
                                _StatusBadge(
                                  label:
                                      'Fulfilment: ${order.status.replaceAll('_', ' ').toUpperCase()}',
                                  color: SiragroColors.brand,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class OrderDetailScreen extends ConsumerWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderAsync = ref.watch(orderDetailProvider(orderId));
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Order Details')),
      body: orderAsync.when(
        loading: () => const LoadingStateView(message: 'Loading order…'),
        error: (err, _) => ErrorRetryView(
          message: err.toString(),
          onRetry: () => ref.invalidate(orderDetailProvider(orderId)),
        ),
        data: (order) => ListView(
          padding: const EdgeInsets.all(SiragroSpacing.md),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(SiragroSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Order #${order.orderNumber}',
                      style: textTheme.titleLarge,
                    ),
                    const SizedBox(height: SiragroSpacing.sm),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _StatusBadge(
                          label: 'Payment: ${order.paymentStatus.toUpperCase()}',
                          color: order.paymentStatus == 'paid'
                              ? SiragroColors.sage
                              : SiragroColors.brass,
                        ),
                        _StatusBadge(
                          label:
                              'Fulfilment: ${order.status.replaceAll('_', ' ').toUpperCase()}',
                          color: SiragroColors.brand,
                        ),
                      ],
                    ),
                    const SizedBox(height: SiragroSpacing.sm),
                    Text(
                      'Method: ${order.fulfilmentType == 'delivery' ? 'Home Delivery' : 'In-Store Collection'}',
                      style: textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: SiragroSpacing.md),
            Text(
              'Items (Stored Order Snapshot)',
              style: textTheme.titleMedium,
            ),
            const SizedBox(height: SiragroSpacing.sm),
            Card(
              child: Column(
                children: [
                  ...order.items.map(
                    (item) => ListTile(
                      title: Text(
                        item.name,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(
                        '${item.quantity} × £${item.unitPrice.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontFeatures: [FontFeature.tabularFigures()],
                        ),
                      ),
                      trailing: Text(
                        '£${item.lineTotal.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontFeatures: [FontFeature.tabularFigures()],
                        ),
                      ),
                    ),
                  ),
                  const Divider(height: 1),
                  Padding(
                    padding: const EdgeInsets.all(SiragroSpacing.md),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Subtotal'),
                            Text(
                              '£${order.subtotal.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontFeatures: [FontFeature.tabularFigures()],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Delivery Charge'),
                            Text(
                              '£${order.deliveryCharge.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontFeatures: [FontFeature.tabularFigures()],
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Saved Total', style: textTheme.titleMedium),
                            Text(
                              '£${order.total.toStringAsFixed(2)}',
                              style: textTheme.titleLarge?.copyWith(
                                color: SiragroColors.brand,
                                fontFeatures: const [
                                  FontFeature.tabularFigures(),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String label;
  final Color color;

  const _StatusBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: color,
        ),
      ),
    );
  }
}
