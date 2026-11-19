import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/errors/app_exception.dart';
import '../../core/preview/design_preview_fixtures.dart';
import '../../core/providers/app_providers.dart';
import '../../shared/models/basket.dart';

class BasketController extends AsyncNotifier<BasketSummary> {
  final Map<String, int> _previewQuantities = {};

  @override
  Future<BasketSummary> build() async {
    final config = ref.watch(appConfigProvider);
    if (config.isDesignPreview) {
      return _buildPreviewSummary();
    }
    if (!config.isApiConfigured) {
      return const BasketSummary();
    }
    return _fetchBasket();
  }

  BasketSummary _buildPreviewSummary() {
    final items = <BasketItem>[];
    var count = 0;
    var subtotal = 0.0;
    var hasAgeRestricted = false;

    for (final entry in _previewQuantities.entries) {
      final product = DesignPreviewFixtures.products
          .where((p) => p.id == entry.key)
          .firstOrNull;
      if (product == null || entry.value <= 0) continue;
      final lineTotal = double.parse((product.price * entry.value).toStringAsFixed(2));
      items.add(
        BasketItem(
          productId: product.id,
          quantity: entry.value,
          lineTotal: lineTotal,
          product: product,
        ),
      );
      count += entry.value;
      subtotal += lineTotal;
      if (product.isAgeRestricted) hasAgeRestricted = true;
    }

    return BasketSummary(
      items: items,
      itemCount: count,
      subtotal: double.parse(subtotal.toStringAsFixed(2)),
      hasAgeRestrictedItems: hasAgeRestricted,
    );
  }

  Future<BasketSummary> _fetchBasket() async {
    final api = ref.read(apiClientProvider);
    final data = await api.get('/api/v1/basket');
    final rawBasket = (data['basket'] as Map<String, dynamic>?) ?? const {};
    return BasketSummary.fromJson(rawBasket);
  }

  Future<void> refresh() async {
    final config = ref.read(appConfigProvider);
    if (config.isDesignPreview) {
      state = AsyncData(_buildPreviewSummary());
      return;
    }
    if (!config.isApiConfigured) {
      state = const AsyncData(BasketSummary());
      return;
    }
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetchBasket);
  }

  Future<String?> addItem(String productId, {int quantity = 1}) async {
    final config = ref.read(appConfigProvider);
    if (config.isDesignPreview) {
      final next = ((_previewQuantities[productId] ?? 0) + quantity).clamp(1, 20);
      _previewQuantities[productId] = next;
      state = AsyncData(_buildPreviewSummary());
      return null;
    }

    try {
      final api = ref.read(apiClientProvider);
      final data = await api.post(
        '/api/v1/basket/items',
        body: {'productId': productId, 'quantity': quantity},
      );
      final rawBasket = (data['basket'] as Map<String, dynamic>?) ?? const {};
      state = AsyncData(BasketSummary.fromJson(rawBasket));
      return null;
    } on AppException catch (e) {
      return e.message;
    } catch (_) {
      return 'Unable to add item to basket right now.';
    }
  }

  Future<String?> updateQuantity(String productId, int quantity) async {
    final config = ref.read(appConfigProvider);
    if (config.isDesignPreview) {
      if (quantity <= 0) {
        _previewQuantities.remove(productId);
      } else {
        _previewQuantities[productId] = quantity.clamp(1, 20);
      }
      state = AsyncData(_buildPreviewSummary());
      return null;
    }

    try {
      final api = ref.read(apiClientProvider);
      final data = quantity <= 0
          ? await api.delete('/api/v1/basket/items/$productId')
          : await api.patch(
              '/api/v1/basket/items/$productId',
              body: {'quantity': quantity},
            );
      final rawBasket = (data['basket'] as Map<String, dynamic>?) ?? const {};
      state = AsyncData(BasketSummary.fromJson(rawBasket));
      return null;
    } on AppException catch (e) {
      return e.message;
    } catch (_) {
      return 'Unable to update basket quantity.';
    }
  }

  Future<void> mergeGuestBasketOnSignIn() async {
    if (ref.read(appConfigProvider).isDesignPreview) return;

    final storage = ref.read(secureTokenStorageProvider);
    final guestToken = await storage.readGuestToken();
    if (guestToken == null || guestToken.isEmpty) {
      await refresh();
      return;
    }

    try {
      final api = ref.read(apiClientProvider);
      final data = await api.post('/api/v1/basket/merge');
      await storage.clearGuestToken();
      final rawBasket = (data['basket'] as Map<String, dynamic>?) ?? const {};
      state = AsyncData(BasketSummary.fromJson(rawBasket));
    } catch (_) {
      await refresh();
    }
  }
}

final basketControllerProvider =
    AsyncNotifierProvider<BasketController, BasketSummary>(
  BasketController.new,
);
