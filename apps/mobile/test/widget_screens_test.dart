import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:siragro_mobile/app/theme/siragro_theme.dart';
import 'package:siragro_mobile/features/basket/basket_controller.dart';
import 'package:siragro_mobile/features/checkout/checkout_screen.dart';
import 'package:siragro_mobile/shared/models/basket.dart';
import 'package:siragro_mobile/shared/models/category.dart';
import 'package:siragro_mobile/shared/models/fulfilment.dart';
import 'package:siragro_mobile/shared/models/product.dart';
import 'package:siragro_mobile/shared/widgets/product_card.dart';

class _FakeBasketController extends BasketController {
  final BasketSummary _summary;
  _FakeBasketController(this._summary);

  @override
  Future<BasketSummary> build() async => _summary;
}

void main() {
  testWidgets('ProductCard renders on 360px screen without overflow and shows 18+ badge',
      (tester) async {
    tester.view.physicalSize = const Size(360, 740);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    const product = Product(
      id: 'p-1',
      name: 'Sample Age Restricted Beverage 4x440ml',
      slug: 'sample-beverage',
      price: 5.99,
      unit: '4 x 440ml',
      stockQuantity: 10,
      isAvailable: true,
      isAgeRestricted: true,
      minimumAge: 18,
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: SiragroTheme.light(),
        home: Scaffold(
          body: SizedBox(
            width: 170,
            height: 290,
            child: ProductCard(
              product: product,
              onTap: () {},
              onAddToBasket: () async {},
            ),
          ),
        ),
      ),
    );

    expect(find.text('18+'), findsOneWidget);
    expect(find.text('£5.99'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets(
      'ProductCard fits inside 2-column GridView at 360px with long name, discount, and 1.3x text scale',
      (tester) async {
    tester.view.physicalSize = const Size(360, 740);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    const product = Product(
      id: 'p-overflow',
      name: 'Extra Long Heritage Farmhouse Stoneground Sourdough Loaf 800g',
      slug: 'long-sourdough',
      price: 2.85,
      compareAtPrice: 3.40,
      unit: '800g Family Loaf',
      brand: 'Baker & Son',
      stockQuantity: 3,
      isAvailable: true,
      isAgeRestricted: true,
      minimumAge: 18,
      category: StoreCategory(
        id: 'c-1',
        name: 'Fresh Bakery & Pastries',
        slug: 'bakery',
      ),
    );

    await tester.pumpWidget(
      MediaQuery(
        data: const MediaQueryData(textScaler: TextScaler.linear(1.3)),
        child: MaterialApp(
          theme: SiragroTheme.light(),
          home: Scaffold(
            body: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.54,
              ),
              itemCount: 2,
              itemBuilder: (_, __) => ProductCard(
                product: product,
                onTap: () {},
                onAddToBasket: () async {},
              ),
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.text('£2.85'), findsNWidgets(2));
  });

  testWidgets('CheckoutScreen blocks Home Delivery when pricing is unconfirmed',
      (tester) async {
    const product = Product(
      id: 'p-2',
      name: 'Fresh Milk 2L',
      slug: 'fresh-milk',
      price: 1.65,
      stockQuantity: 12,
      isAvailable: true,
      isAgeRestricted: false,
    );

    const basket = BasketSummary(
      items: [
        BasketItem(
          productId: 'p-2',
          quantity: 1,
          lineTotal: 1.65,
          product: product,
        ),
      ],
      itemCount: 1,
      subtotal: 1.65,
    );

    const unconfirmedFulfilment = FulfilmentAvailability(
      settingsLoaded: true,
      deliveryAvailable: false,
      collectionAvailable: true,
      deliveryUnavailableReason:
          'Home delivery checkout is currently disabled while local delivery fees and boundary rules are being confirmed.',
      pricingConfirmed: false,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          basketControllerProvider.overrideWith(
            () => _FakeBasketController(basket),
          ),
          fulfilmentAvailabilityProvider.overrideWith(
            (ref) async => unconfirmedFulfilment,
          ),
        ],
        child: MaterialApp(
          theme: SiragroTheme.light(),
          home: const CheckoutScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('In-Store Collection (Free £0.00)'), findsOneWidget);
    expect(find.text('Home Delivery'), findsOneWidget);
    expect(
      find.textContaining('currently disabled while local delivery fees'),
      findsOneWidget,
    );
  });
}
