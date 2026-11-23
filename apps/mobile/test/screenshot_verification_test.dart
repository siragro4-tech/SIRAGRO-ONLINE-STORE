import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:siragro_mobile/app/theme/siragro_theme.dart';
import 'package:siragro_mobile/features/account/account_screen.dart';
import 'package:siragro_mobile/features/basket/basket_controller.dart';
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

Future<void> _savePngIfEnabled(
  WidgetTester tester,
  String filename,
) async {
  if (!_captureScreenshots) return;
  final element = tester.element(find.byType(MaterialApp));
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

  testWidgets(
      'Phone viewport (390x844) Home, ProductDetail, and Account render without overflow',
      (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    final homeData = HomeData(
      categories: sampleCategories,
      featuredProducts: sampleProducts,
      fulfilment: const FulfilmentAvailability(
        settingsLoaded: true,
        deliveryAvailable: false,
        collectionAvailable: true,
        pricingConfirmed: false,
      ),
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          homeDataProvider.overrideWith((ref) async => homeData),
          basketControllerProvider.overrideWith(() => _EmptyBasketController()),
        ],
        child: MaterialApp(
          theme: SiragroTheme.light(),
          home: const HomeScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await _savePngIfEnabled(tester, 'flutter_home_top.png');

    await tester.drag(find.byType(CustomScrollView), const Offset(0, -650));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await _savePngIfEnabled(tester, 'flutter_home_mid.png');

    await tester.drag(find.byType(CustomScrollView), const Offset(0, -1100));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await _savePngIfEnabled(tester, 'flutter_home_footer.png');

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          productDetailProvider('dev-gala-apples-6pk')
              .overrideWith((ref) async => sampleProducts.first),
          basketControllerProvider.overrideWith(() => _EmptyBasketController()),
        ],
        child: MaterialApp(
          theme: SiragroTheme.light(),
          home: const ProductDetailScreen(slug: 'dev-gala-apples-6pk'),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await _savePngIfEnabled(tester, 'flutter_product_detail.png');

    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          theme: SiragroTheme.light(),
          home: const AccountScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await _savePngIfEnabled(tester, 'flutter_account.png');
  });
}
