import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:siragro_mobile/app/theme/siragro_theme.dart';
import 'package:siragro_mobile/features/basket/basket_controller.dart';
import 'package:siragro_mobile/features/checkout/checkout_screen.dart';
import 'package:siragro_mobile/shared/models/basket.dart';
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
              onAddToBasket: () {},
            ),
          ),
        ),
      ),
    );

    expect(find.text('18+'), findsOneWidget);
    expect(find.text('£5.99'), findsOneWidget);
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
