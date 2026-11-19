import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme/siragro_theme.dart';
import '../../core/errors/app_exception.dart';
import '../../core/providers/app_providers.dart';
import '../../core/widgets/state_views.dart';
import '../../shared/models/fulfilment.dart';
import '../auth/auth_controller.dart';
import '../basket/basket_controller.dart';

final fulfilmentAvailabilityProvider =
    FutureProvider.autoDispose<FulfilmentAvailability>((ref) async {
  final config = ref.watch(appConfigProvider);
  if (!config.isApiConfigured) {
    return const FulfilmentAvailability.unverified();
  }
  final api = ref.read(apiClientProvider);
  final data = await api.get('/api/v1/fulfilment');
  final raw = data['fulfilment'] as Map<String, dynamic>?;
  return raw != null
      ? FulfilmentAvailability.fromJson(raw)
      : const FulfilmentAvailability.unverified();
});

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _line1Ctrl = TextEditingController();
  final _line2Ctrl = TextEditingController();
  final _cityCtrl = TextEditingController(text: 'Hayes');
  final _postcodeCtrl = TextEditingController();

  String _fulfilmentType = 'collection';
  bool _ageAcknowledged = false;
  bool _isSubmitting = false;
  String? _statusMessage;
  bool _isBlockedError = false;
  DeliveryCalculation? _serverCalculation;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).user;
    if (user?.email != null) {
      _emailCtrl.text = user!.email!;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _line1Ctrl.dispose();
    _line2Ctrl.dispose();
    _cityCtrl.dispose();
    _postcodeCtrl.dispose();
    super.dispose();
  }

  Future<void> _recalculateServerTotal() async {
    try {
      final api = ref.read(apiClientProvider);
      final data = await api.post(
        '/api/v1/fulfilment',
        body: {
          'fulfilmentType': _fulfilmentType,
          if (_fulfilmentType == 'delivery') 'postcode': _postcodeCtrl.text.trim(),
        },
      );
      if (!mounted) return;
      final calc = data['calculation'] is Map<String, dynamic>
          ? DeliveryCalculation.fromJson(
              data['calculation'] as Map<String, dynamic>,
            )
          : null;
      setState(() => _serverCalculation = calc);
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _statusMessage = e.message;
        _isBlockedError = e.isBlockedByPolicy;
      });
    }
  }

  Future<void> _submitCheckout() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
      _statusMessage = null;
      _isBlockedError = false;
    });

    try {
      final api = ref.read(apiClientProvider);
      await api.post(
        '/api/v1/checkout',
        body: {
          'customerName': _nameCtrl.text.trim(),
          'customerEmail': _emailCtrl.text.trim(),
          'customerPhone': _phoneCtrl.text.trim(),
          'fulfilmentType': _fulfilmentType,
          'postcode': _postcodeCtrl.text.trim(),
          'addressLine1': _line1Ctrl.text.trim(),
          'addressLine2': _line2Ctrl.text.trim(),
          'city': _cityCtrl.text.trim(),
          'ageRestrictionAcknowledged': _ageAcknowledged,
        },
      );
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _statusMessage = e.message;
        _isBlockedError = e.isBlockedByPolicy;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _statusMessage = 'Unable to contact checkout server. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final basketAsync = ref.watch(basketControllerProvider);
    final fulfilmentAsync = ref.watch(fulfilmentAvailabilityProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: basketAsync.when(
        loading: () => const LoadingStateView(message: 'Verifying basket…'),
        error: (err, _) => ErrorRetryView(
          message: err.toString(),
          onRetry: () => ref.read(basketControllerProvider.notifier).refresh(),
        ),
        data: (basket) {
          if (basket.items.isEmpty) {
            return const EmptyStateView(
              icon: Icons.shopping_basket_outlined,
              title: 'Basket is empty',
              subtitle: 'Add items to your basket before checking out.',
            );
          }

          return fulfilmentAsync.when(
            loading: () => const LoadingStateView(
              message: 'Checking delivery & collection rules…',
            ),
            error: (_, __) => ErrorRetryView(
              title: 'Fulfilment Rules Unavailable',
              message:
                  'Could not verify server delivery/collection settings. Checkout is paused safely.',
              onRetry: () => ref.invalidate(fulfilmentAvailabilityProvider),
            ),
            data: (fulfilment) {
              // Ensure selected option stays valid if server disabled delivery
              if (_fulfilmentType == 'delivery' &&
                  !fulfilment.deliveryAvailable &&
                  fulfilment.collectionAvailable) {
                _fulfilmentType = 'collection';
              }

              final neitherAvailable =
                  !fulfilment.deliveryAvailable && !fulfilment.collectionAvailable;
              final deliveryFee = _serverCalculation?.deliveryFee ?? 0.0;
              final total = basket.subtotal + deliveryFee;

              return Form(
                key: _formKey,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // 1. Fulfilment Selection (Fail-Closed)
                    const Text(
                      '1. Fulfilment Method',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Card(
                      child: Column(
                        children: [
                          RadioListTile<String>(
                            value: 'collection',
                            groupValue: _fulfilmentType,
                            onChanged: fulfilment.collectionAvailable
                                ? (v) {
                                    setState(() => _fulfilmentType = v!);
                                    _recalculateServerTotal();
                                  }
                                : null,
                            title: const Text(
                              'In-Store Collection (Free £0.00)',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                            subtitle: Text(
                              fulfilment.collectionAvailable
                                  ? '147 North Hyde Road, Hayes UB3 4NS'
                                  : (fulfilment.collectionUnavailableReason ??
                                      'Currently unavailable'),
                            ),
                          ),
                          const Divider(height: 1),
                          RadioListTile<String>(
                            value: 'delivery',
                            groupValue: _fulfilmentType,
                            onChanged: fulfilment.deliveryAvailable
                                ? (v) {
                                    setState(() => _fulfilmentType = v!);
                                    _recalculateServerTotal();
                                  }
                                : null,
                            title: const Text(
                              'Home Delivery',
                              style: TextStyle(fontWeight: FontWeight.w700),
                            ),
                            subtitle: Text(
                              fulfilment.deliveryAvailable
                                  ? 'Fee calculated on server from postcode'
                                  : (fulfilment.deliveryUnavailableReason ??
                                      'Home delivery is currently unavailable while delivery fees and boundaries await store confirmation.'),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),

                    // 2. Contact Details
                    const Text(
                      '2. Contact Details',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _nameCtrl,
                      decoration: const InputDecoration(labelText: 'Full name'),
                      validator: (v) => (v == null || v.trim().isEmpty)
                          ? 'Please enter your full name'
                          : null,
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'Email'),
                      validator: (v) => (v == null || !v.contains('@'))
                          ? 'Please enter a valid email'
                          : null,
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration:
                          const InputDecoration(labelText: 'Contact phone'),
                      validator: (v) => (v == null || v.trim().length < 7)
                          ? 'Please enter a contact phone number'
                          : null,
                    ),

                    if (_fulfilmentType == 'delivery') ...[
                      const SizedBox(height: 18),
                      const Text(
                        '3. Delivery Address',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _line1Ctrl,
                        decoration:
                            const InputDecoration(labelText: 'Street address'),
                        validator: (v) => (v == null || v.trim().isEmpty)
                            ? 'Required for delivery'
                            : null,
                      ),
                      const SizedBox(height: 10),
                      TextFormField(
                        controller: _line2Ctrl,
                        decoration: const InputDecoration(
                          labelText: 'Flat / Building (optional)',
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _cityCtrl,
                              decoration:
                                  const InputDecoration(labelText: 'Town / City'),
                              validator: (v) => (v == null || v.trim().isEmpty)
                                  ? 'Required'
                                  : null,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextFormField(
                              controller: _postcodeCtrl,
                              decoration:
                                  const InputDecoration(labelText: 'Postcode'),
                              validator: (v) => (v == null || v.trim().isEmpty)
                                  ? 'Required'
                                  : null,
                            ),
                          ),
                        ],
                      ),
                    ],

                    if (basket.hasAgeRestrictedItems) ...[
                      const SizedBox(height: 18),
                      Card(
                        color: SiragroColors.accentRed.withValues(alpha: 0.06),
                        child: CheckboxListTile(
                          value: _ageAcknowledged,
                          onChanged: (v) =>
                              setState(() => _ageAcknowledged = v ?? false),
                          title: const Text(
                            'Challenge 25 Age Verification Required',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              color: SiragroColors.accentRed,
                            ),
                          ),
                          subtitle: const Text(
                            'I confirm I am 18+. Note: Checking this box does not complete age verification — valid photo ID must be checked in person upon collection or delivery.',
                            style: TextStyle(fontSize: 12.5),
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 18),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Server Subtotal'),
                                Text('£${basket.subtotal.toStringAsFixed(2)}'),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Fulfilment Charge'),
                                Text('£${deliveryFee.toStringAsFixed(2)}'),
                              ],
                            ),
                            const Divider(height: 18),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Server Total',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 16,
                                  ),
                                ),
                                Text(
                                  '£${total.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 18,
                                    color: SiragroColors.brand,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),

                    if (_statusMessage != null) ...[
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: (_isBlockedError
                                  ? SiragroColors.accentGold
                                  : SiragroColors.accentRed)
                              .withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _isBlockedError
                                ? SiragroColors.accentGold
                                : SiragroColors.accentRed,
                          ),
                        ),
                        child: Text(
                          _statusMessage!,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: SiragroColors.textPrimary,
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 18),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed:
                            (neitherAvailable || _isSubmitting) ? null : _submitCheckout,
                        child: Text(
                          _isSubmitting
                              ? 'Checking server readiness…'
                              : neitherAvailable
                                  ? 'Checkout Unavailable'
                                  : 'Continue to Secure Payment',
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
