import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:siragro_mobile/core/config/app_config.dart';
import 'package:siragro_mobile/core/errors/app_exception.dart';
import 'package:siragro_mobile/core/networking/api_client.dart';
import 'package:siragro_mobile/core/preview/design_preview_fixtures.dart';
import 'package:siragro_mobile/core/storage/secure_token_storage.dart';
import 'package:siragro_mobile/shared/models/fulfilment.dart';
import 'package:siragro_mobile/shared/models/order.dart';
import 'package:siragro_mobile/shared/models/product.dart';

class _InMemoryTokenStorage extends SecureTokenStorage {
  String? _token;

  @override
  Future<String?> readGuestToken() async => _token;

  @override
  Future<void> saveGuestToken(String token) async {
    _token = token;
  }

  @override
  Future<void> clearGuestToken() async {
    _token = null;
  }
}

void main() {
  group('AppConfig safety', () {
    test('rejects placeholder values and unconfigured state', () {
      const cfg = AppConfig(
        environment: 'staging',
        apiBaseUrl: 'https://your-staging-siragro-domain.example',
        supabaseUrl: 'https://your-staging-project.supabase.co',
        supabaseAnonKey: 'your-staging-supabase-anon-key',
        appScheme: 'siragro',
      );
      expect(cfg.isApiConfigured, isFalse);
      expect(cfg.isSupabaseConfigured, isFalse);
      expect(cfg.isStoreConnected, isFalse);
      expect(cfg.isDesignPreview, isFalse);
    });

    test('design preview flag is opt-in and fixtures keep delivery unconfirmed', () {
      const previewCfg = AppConfig(
        environment: 'unconfigured',
        apiBaseUrl: '',
        supabaseUrl: '',
        supabaseAnonKey: '',
        appScheme: 'siragro',
        designPreviewFlag: true,
      );
      expect(previewCfg.isDesignPreview, isTrue);
      expect(previewCfg.isStoreConnected, isFalse);
      expect(DesignPreviewFixtures.categories, isNotEmpty);
      expect(DesignPreviewFixtures.products, isNotEmpty);
      expect(DesignPreviewFixtures.fulfilment.deliveryAvailable, isFalse);
      expect(DesignPreviewFixtures.fulfilment.pricingConfirmed, isFalse);
    });
  });

  group('FulfilmentAvailability fail-closed rules', () {
    test('unverified defaults block both delivery and collection', () {
      const unverified = FulfilmentAvailability.unverified();
      expect(unverified.settingsLoaded, isFalse);
      expect(unverified.deliveryAvailable, isFalse);
      expect(unverified.collectionAvailable, isFalse);
      expect(unverified.pricingConfirmed, isFalse);
    });
  });

  group('Product & Order snapshot models', () {
    test('Product parses age restriction, discount, and stock state', () {
      final product = Product.fromJson({
        'id': 'p-1',
        'name': 'Craft Lager 4-Pack',
        'slug': 'craft-lager',
        'price': 5.50,
        'compareAtPrice': 6.50,
        'stockQuantity': 3,
        'isAvailable': true,
        'isAgeRestricted': true,
        'minimumAge': 18,
      });
      expect(product.isOutOfStock, isFalse);
      expect(product.isLowStock, isTrue);
      expect(product.hasDiscount, isTrue);
      expect(product.isAgeRestricted, isTrue);
      expect(product.minimumAge, 18);
    });

    test('CustomerOrder preserves stored snapshot totals and separate statuses', () {
      final order = CustomerOrder.fromJson({
        'id': 'ord-1',
        'orderNumber': 'SIR-100200',
        'status': 'processing',
        'paymentStatus': 'paid',
        'fulfilmentType': 'collection',
        'subtotal': 12.00,
        'deliveryCharge': 0.0,
        'total': 12.00,
        'items': [
          {
            'id': 'oi-1',
            'productId': 'p-1',
            'name': 'Whole Milk 2L',
            'unitPrice': 1.50,
            'quantity': 2,
            'lineTotal': 3.00,
          }
        ],
      });
      expect(order.paymentStatus, 'paid');
      expect(order.status, 'processing');
      expect(order.total, 12.00);
      expect(order.items.single.unitPrice, 1.50);
    });
  });

  group('SiragroApiClient guest isolation & auth headers', () {
    test('sends signed guest token and persists newly issued guest token', () async {
      final storage = _InMemoryTokenStorage();
      await storage.saveGuestToken('signed-guest-1');

      String? seenGuestHeader;
      final mockHttp = MockClient((request) async {
        seenGuestHeader = request.headers[SiragroApiClient.guestTokenHeader];
        return http.Response(
          jsonEncode({'basket': {'items': [], 'itemCount': 0, 'subtotal': 0}}),
          200,
          headers: {SiragroApiClient.guestTokenHeader: 'signed-guest-2'},
        );
      });

      final client = SiragroApiClient(
        config: const AppConfig(
          environment: 'staging',
          apiBaseUrl: 'https://staging.example.com',
          supabaseUrl: 'https://staging.supabase.co',
          supabaseAnonKey: 'anon-key',
          appScheme: 'siragro',
        ),
        tokenStorage: storage,
        accessTokenProvider: () => null,
        httpClient: mockHttp,
      );

      await client.get('/api/v1/basket');
      expect(seenGuestHeader, 'signed-guest-1');
      expect(await storage.readGuestToken(), 'signed-guest-2');
    });

    test('throws policy-blocked AppException on HTTP 503 checkout gate', () async {
      final storage = _InMemoryTokenStorage();
      final mockHttp = MockClient((_) async {
        return http.Response(
          jsonEncode({
            'checkoutBlocked': true,
            'error': 'Mobile checkout is paused until migration 006 is verified.',
          }),
          503,
        );
      });

      final client = SiragroApiClient(
        config: const AppConfig(
          environment: 'staging',
          apiBaseUrl: 'https://staging.example.com',
          supabaseUrl: 'https://staging.supabase.co',
          supabaseAnonKey: 'anon-key',
          appScheme: 'siragro',
        ),
        tokenStorage: storage,
        accessTokenProvider: () => 'user-jwt',
        httpClient: mockHttp,
      );

      await expectLater(
        client.post('/api/v1/checkout', body: {}),
        throwsA(
          isA<AppException>()
              .having((e) => e.isBlockedByPolicy, 'isBlockedByPolicy', isTrue)
              .having((e) => e.statusCode, 'statusCode', 503),
        ),
      );
    });
  });
}
