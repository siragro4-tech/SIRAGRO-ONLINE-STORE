import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/account/account_screen.dart';
import '../features/auth/auth_screens.dart';
import '../features/basket/basket_controller.dart';
import '../features/basket/basket_screen.dart';
import '../features/catalog/shop_screen.dart';
import '../features/checkout/checkout_screen.dart';
import '../features/home/home_screen.dart';
import '../features/orders/orders_screen.dart';
import '../features/product/product_detail_screen.dart';
import '../features/support/support_screens.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/home',
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return _AppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                builder: (_, __) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/shop',
                builder: (_, state) => ShopScreen(
                  initialCategory: state.uri.queryParameters['category'],
                  focusSearch: state.uri.queryParameters['focusSearch'] == '1',
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/basket',
                builder: (_, __) => const BasketScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/account',
                builder: (_, __) => const AccountScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/product/:slug',
        builder: (_, state) => ProductDetailScreen(
          slug: state.pathParameters['slug'] ?? '',
        ),
      ),
      GoRoute(
        path: '/checkout',
        builder: (_, __) => const CheckoutScreen(),
      ),
      GoRoute(
        path: '/auth/sign-in',
        builder: (_, __) => const SignInScreen(),
      ),
      GoRoute(
        path: '/auth/register',
        builder: (_, __) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/auth/forgot-password',
        builder: (_, __) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/orders',
        builder: (_, __) => const OrdersScreen(),
      ),
      GoRoute(
        path: '/orders/:id',
        builder: (_, state) => OrderDetailScreen(
          orderId: state.pathParameters['id'] ?? '',
        ),
      ),
      GoRoute(
        path: '/support/about',
        builder: (_, __) => const AboutSiragroScreen(),
      ),
      GoRoute(
        path: '/support/contact',
        builder: (_, __) => const ContactSiragroScreen(),
      ),
      GoRoute(
        path: '/support/delivery',
        builder: (_, __) => const DeliveryInfoScreen(),
      ),
      GoRoute(
        path: '/support/privacy',
        builder: (_, __) => const PrivacyPolicyScreen(),
      ),
      GoRoute(
        path: '/support/terms',
        builder: (_, __) => const TermsScreen(),
      ),
    ],
  );
});

class _AppShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const _AppShell({required this.navigationShell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final basketCount = ref.watch(basketControllerProvider).valueOrNull?.itemCount ?? 0;

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (idx) {
          navigationShell.goBranch(
            idx,
            initialLocation: idx == navigationShell.currentIndex,
          );
        },
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          const NavigationDestination(
            icon: Icon(Icons.storefront_outlined),
            selectedIcon: Icon(Icons.storefront),
            label: 'Shop',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: basketCount > 0,
              label: Text('$basketCount'),
              child: const Icon(Icons.shopping_basket_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: basketCount > 0,
              label: Text('$basketCount'),
              child: const Icon(Icons.shopping_basket),
            ),
            label: 'Basket',
          ),
          const NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Account',
          ),
        ],
      ),
    );
  }
}
