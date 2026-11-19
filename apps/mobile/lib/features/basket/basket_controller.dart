import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/errors/app_exception.dart';
import '../../core/providers/app_providers.dart';
import '../../shared/models/basket.dart';

class BasketController extends AsyncNotifier<BasketSummary> {
  @override
  Future<BasketSummary> build() async {
    final config = ref.watch(appConfigProvider);
    if (!config.isApiConfigured) {
      return const BasketSummary();
    }
    return _fetchBasket();
  }

  Future<BasketSummary> _fetchBasket() async {
    final api = ref.read(apiClientProvider);
    final data = await api.get('/api/v1/basket');
    final rawBasket = (data['basket'] as Map<String, dynamic>?) ?? const {};
    return BasketSummary.fromJson(rawBasket);
  }

  Future<void> refresh() async {
    final config = ref.read(appConfigProvider);
    if (!config.isApiConfigured) {
      state = const AsyncData(BasketSummary());
      return;
    }
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetchBasket);
  }

  Future<String?> addItem(String productId, {int quantity = 1}) async {
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
