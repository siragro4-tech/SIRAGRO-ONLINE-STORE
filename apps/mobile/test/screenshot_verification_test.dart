import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:siragro_mobile/app/theme/siragro_theme.dart';
import 'package:siragro_mobile/core/config/app_config.dart';
import 'package:siragro_mobile/core/networking/api_client.dart';
import 'package:siragro_mobile/core/providers/app_providers.dart';
import 'package:siragro_mobile/core/storage/secure_token_storage.dart';
import 'package:siragro_mobile/features/account/account_screen.dart';
import 'package:siragro_mobile/features/basket/basket_controller.dart';
import 'package:siragro_mobile/features/catalog/shop_screen.dart';
import 'package:siragro_mobile/features/home/home_screen.dart';
import 'package:siragro_mobile/features/product/product_detail_screen.dart';
import 'package:siragro_mobile/shared/models/basket.dart';
import 'package:siragro_mobile/shared/models/category.dart';
import 'package:siragro_mobile/shared/models/fulfilment.dart';
import 'package:siragro_mobile/shared/models/product.dart';

const bool _captureScreenshots =
    bool.fromEnvironment('SIRAGRO_CAPTURE_SCREENSHOTS', defaultValue: false);

class _EmptyBasketController extends BasketController {
  @override
  Future<BasketSummary> build() async =>
      const BasketSummary(items: [], itemCount: 0, subtotal: 0);
}

class _FakeProductsApiClient extends SiragroApiClient {
  final List<Map<String, dynamic>> rawProducts;

  _FakeProductsApiClient({
    required super.config,
    required this.rawProducts,
  }) : super(
          tokenStorage: const SecureTokenStorage(),
          accessTokenProvider: () => null,
        );

  @override
  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, String>? query,
  }) async {
    return {
      'items': rawProducts,
      'hasMore': false,
      'totalCount': rawProducts.length,
    };
  }
}

Map<String, dynamic>? _loadJsonMap(String path) {
  final file = File(path);
  if (!file.existsSync()) return null;
  final decoded = jsonDecode(file.readAsStringSync());
  return decoded is Map<String, dynamic> ? decoded : null;
}

Future<void> _savePngIfEnabled(
  WidgetTester tester,
  GlobalKey boundaryKey,
  String filename,
) async {
  if (!_captureScreenshots) return;
  final element = tester.element(find.byKey(boundaryKey));
  await tester.binding.runAsync(() async {
    final image = await captureImage(element);
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    image.dispose();
    if (byteData == null) return;
    final dir = Directory('build/screenshots');
    if (!dir.existsSync()) {
      dir.createSync(recursive: true);
    }
    File('${dir.path}/$filename')
        .writeAsBytesSync(byteData.buffer.asUint8List());
  });
}

void main() {
  final sampleCategories = [
    StoreCategory.fromJson({
      'id': 'c1',
      'name': 'Fresh Produce',
      'slug': 'fresh-produce',
      'sort_order': 1,
    }),
    StoreCategory.fromJson({
      'id': 'c2',
      'name': 'Dairy & Eggs',
      'slug': 'dairy-eggs',
      'sort_order': 2,
    }),
    StoreCategory.fromJson({
      'id': 'c3',
      'name': 'Bakery',
      'slug': 'bakery',
      'sort_order': 3,
    }),
    StoreCategory.fromJson({
      'id': 'c4',
      'name': 'Drinks & Off-Licence',
      'slug': 'drinks-off-licence',
      'sort_order': 4,
    }),
  ];

  final sampleProducts = [
    Product.fromJson({
      'id': 'a1',
      'name': '[DEV ONLY] Crisp Red Gala Apples',
      'slug': 'dev-gala-apples-6pk',
      'description': 'Sweet and crunchy British red gala apples.',
      'price': 1.85,
      'compareAtPrice': 2.10,
      'unit': 'Pack of 6',
      'brand': 'Farm Fresh',
      'stockQuantity': 45,
      'isAvailable': true,
      'isAgeRestricted': false,
      'category': {'id': 'c1', 'name': 'Fresh Produce', 'slug': 'fresh-produce'},
      'primaryImageUrl': null,
      'images': [],
    }),
    Product.fromJson({
      'id': 'a2',
      'name': '[DEV ONLY] British Semi-Skimmed Milk 2L',
      'slug': 'dev-semi-skimmed-milk-2l',
      'description': 'Fresh pasteurised semi-skimmed cow milk.',
      'price': 1.65,
      'unit': '2 Litres',
      'brand': 'Country Pure',
      'stockQuantity': 50,
      'isAvailable': true,
      'isAgeRestricted': false,
      'category': {'id': 'c2', 'name': 'Dairy & Eggs', 'slug': 'dairy-eggs'},
      'primaryImageUrl': null,
      'images': [],
    }),
  ];

  testWidgets('Phone viewport (390x844) HomeScreen renders all sections without overflow',
      (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    final stagingHome = _loadJsonMap('build/staging_home.json');
    final homeCategories = stagingHome != null
        ? (stagingHome['categories'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(StoreCategory.fromJson)
            .toList()
        : sampleCategories;
    final homeProducts = stagingHome != null
        ? (stagingHome['featuredProducts'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(Product.fromJson)
            .toList()
        : sampleProducts;
    final homeFulfilment = stagingHome != null &&
            stagingHome['fulfilment'] is Map<String, dynamic>
        ? FulfilmentAvailability.fromJson(
            stagingHome['fulfilment'] as Map<String, dynamic>,
          )
        : const FulfilmentAvailability(
            settingsLoaded: true,
            deliveryAvailable: false,
            collectionAvailable: true,
            pricingConfirmed: false,
          );

    final boundaryKey = GlobalKey();
    final homeData = HomeData(
      categories: homeCategories,
      featuredProducts: homeProducts,
      fulfilment: homeFulfilment,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          homeDataProvider.overrideWith((ref) async => homeData),
          basketControllerProvider.overrideWith(() => _EmptyBasketController()),
        ],
        child: RepaintBoundary(
          key: boundaryKey,
          child: MaterialApp(
            theme: SiragroTheme.light(),
            home: const HomeScreen(),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();
    await tester.binding.runAsync(() async {
      final ctx = tester.element(find.byType(HomeScreen));
      await precacheImage(
        const AssetImage('assets/images/hero-supermarket.jpg'),
        ctx,
      );
      await precacheImage(
        const AssetImage('assets/images/siragro-logo.jpg'),
        ctx,
      );
    });
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await _savePngIfEnabled(tester, boundaryKey, 'flutter_home_top.png');

    await tester.drag(find.byType(CustomScrollView), const Offset(0, -650));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await _savePngIfEnabled(tester, boundaryKey, 'flutter_home_mid.png');

    await tester.drag(find.byType(CustomScrollView), const Offset(0, -1100));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await _savePngIfEnabled(tester, boundaryKey, 'flutter_home_footer.png');
  });

  testWidgets('Phone viewport (390x844) ProductDetailScreen renders without overflow',
      (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    final stagingProductsJson = _loadJsonMap('build/staging_products.json');
    final stagingItems = stagingProductsJson != null
        ? (stagingProductsJson['items'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(Product.fromJson)
            .toList()
        : sampleProducts;
    final detailProduct = stagingItems.firstWhere(
      (p) => p.slug == 'perfume-atomizer',
      orElse: () => stagingItems.first,
    );

    final boundaryKey = GlobalKey();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          productDetailProvider(detailProduct.slug)
              .overrideWith((ref) async => detailProduct),
          basketControllerProvider.overrideWith(() => _EmptyBasketController()),
        ],
        child: RepaintBoundary(
          key: boundaryKey,
          child: MaterialApp(
            theme: SiragroTheme.light(),
            home: ProductDetailScreen(slug: detailProduct.slug),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await _savePngIfEnabled(tester, boundaryKey, 'flutter_product_detail.png');
  });

  testWidgets('Phone viewport (390x844) AccountScreen renders without overflow',
      (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    final boundaryKey = GlobalKey();
    await tester.pumpWidget(
      ProviderScope(
        child: RepaintBoundary(
          key: boundaryKey,
          child: MaterialApp(
            theme: SiragroTheme.light(),
            home: const AccountScreen(),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await _savePngIfEnabled(tester, boundaryKey, 'flutter_account.png');
  });

  testWidgets('Phone viewport (390x844) ShopScreen renders without overflow',
      (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    const testConfig = AppConfig(
      environment: 'test',
      apiBaseUrl: 'https://example.invalid',
      supabaseUrl: '',
      supabaseAnonKey: '',
      appScheme: 'siragro',
    );
    final rawProducts = [
      {
        'id': 'a1',
        'name': '[DEV ONLY] Crisp Red Gala Apples',
        'slug': 'dev-gala-apples-6pk',
        'description': 'Sweet and crunchy British red gala apples.',
        'price': 1.85,
        'compareAtPrice': 2.10,
        'unit': 'Pack of 6',
        'brand': 'Farm Fresh',
        'stockQuantity': 45,
        'isAvailable': true,
        'isAgeRestricted': false,
        'category': {
          'id': 'c1',
          'name': 'Fresh Produce',
          'slug': 'fresh-produce',
        },
        'primaryImageUrl': null,
        'images': <dynamic>[],
      },
      {
        'id': 'a2',
        'name': '[DEV ONLY] British Semi-Skimmed Milk 2L',
        'slug': 'dev-semi-skimmed-milk-2l',
        'description': 'Fresh pasteurised semi-skimmed cow milk.',
        'price': 1.65,
        'unit': '2 Litres',
        'brand': 'Country Pure',
        'stockQuantity': 50,
        'isAvailable': true,
        'isAgeRestricted': false,
        'category': {
          'id': 'c2',
          'name': 'Dairy & Eggs',
          'slug': 'dairy-eggs',
        },
      'primaryImageUrl': null,
      'images': <dynamic>[],
    },
  ];
    final stagingHomeJson = _loadJsonMap('build/staging_home.json');
    final stagingProductsJson = _loadJsonMap('build/staging_products.json');
    final shopCategories = stagingHomeJson != null
        ? (stagingHomeJson['categories'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(StoreCategory.fromJson)
            .toList()
        : sampleCategories;
    final shopRawProducts = stagingProductsJson != null
        ? (stagingProductsJson['items'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .toList()
        : rawProducts;
    final homeData = HomeData(
      categories: shopCategories,
      featuredProducts: sampleProducts,
      fulfilment: const FulfilmentAvailability(
        settingsLoaded: true,
        deliveryAvailable: false,
        collectionAvailable: true,
        pricingConfirmed: false,
      ),
    );

    final boundaryKey = GlobalKey();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appConfigProvider.overrideWithValue(testConfig),
          apiClientProvider.overrideWithValue(
            _FakeProductsApiClient(
              config: testConfig,
              rawProducts: shopRawProducts,
            ),
          ),
          homeDataProvider.overrideWith((ref) async => homeData),
          basketControllerProvider.overrideWith(() => _EmptyBasketController()),
        ],
        child: RepaintBoundary(
          key: boundaryKey,
          child: MaterialApp(
            theme: SiragroTheme.light(),
            home: const ShopScreen(),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await _savePngIfEnabled(tester, boundaryKey, 'flutter_shop.png');
  });
}
