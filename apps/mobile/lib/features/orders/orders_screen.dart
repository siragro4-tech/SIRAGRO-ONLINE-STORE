import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../app/theme/siragro_theme.dart';
import '../../core/providers/app_providers.dart';
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
    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('My Orders')),
        body: EmptyStateView(
          icon: Icons.lock_outline,
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
            onRefresh: () async => ref.invalidate(ordersListProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final order = orders[index];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(14),
                    onTap: () => context.push('/orders/${order.id}'),
                    title: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '#${order.orderNumber}',
                          style: const TextStyle(fontWeight: FontWeight.w900),
                        ),
                        Text(
                          '£${order.total.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            color: SiragroColors.brand,
                          ),
                        ),
                      ],
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (order.createdAt != null)
                            Text(
                              DateFormat('dd MMM yyyy, HH:mm')
                                  .format(order.createdAt!.toLocal()),
                              style: const TextStyle(fontSize: 12),
                            ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: [
                              _StatusBadge(
                                label: 'Payment: ${order.paymentStatus.toUpperCase()}',
                                color: order.paymentStatus == 'paid'
                                    ? SiragroColors.accentGreen
                                    : SiragroColors.accentGold,
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
                    trailing: const Icon(Icons.chevron_right),
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

    return Scaffold(
      appBar: AppBar(title: const Text('Order Details')),
      body: orderAsync.when(
        loading: () => const LoadingStateView(message: 'Loading order…'),
        error: (err, _) => ErrorRetryView(
          message: err.toString(),
          onRetry: () => ref.invalidate(orderDetailProvider(orderId)),
        ),
        data: (order) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Order #${order.orderNumber}',
                      style: const TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _StatusBadge(
                          label: 'Payment: ${order.paymentStatus.toUpperCase()}',
                          color: order.paymentStatus == 'paid'
                              ? SiragroColors.accentGreen
                              : SiragroColors.accentGold,
                        ),
                        _StatusBadge(
                          label:
                              'Fulfilment: ${order.status.replaceAll('_', ' ').toUpperCase()}',
                          color: SiragroColors.brand,
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Method: ${order.fulfilmentType == 'delivery' ? 'Home Delivery' : 'In-Store Collection'}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'Items (Stored Order Snapshot)',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
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
                      ),
                      trailing: Text(
                        '£${item.lineTotal.toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                  const Divider(height: 1),
                  Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Subtotal'),
                            Text('£${order.subtotal.toStringAsFixed(2)}'),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Delivery Charge'),
                            Text('£${order.deliveryCharge.toStringAsFixed(2)}'),
                          ],
                        ),
                        const Divider(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Saved Total',
                              style: TextStyle(fontWeight: FontWeight.w900),
                            ),
                            Text(
                              '£${order.total.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 17,
                                color: SiragroColors.brand,
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
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
