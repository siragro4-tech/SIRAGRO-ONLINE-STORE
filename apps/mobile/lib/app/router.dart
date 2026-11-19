import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/providers/app_providers.dart';
import '../core/widgets/motion.dart';
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
import 'theme/siragro_theme.dart';

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
        pageBuilder: (_, state) => siragroFadeSlidePage(
          key: state.pageKey,
          child: ProductDetailScreen(
            slug: state.pathParameters['slug'] ?? '',
          ),
        ),
      ),
      GoRoute(
        path: '/checkout',
        pageBuilder: (_, state) => siragroFadeSlidePage(
          key: state.pageKey,
          child: const CheckoutScreen(),
        ),
      ),
      GoRoute(
        path: '/auth/sign-in',
        pageBuilder: (_, state) => siragroFadeSlidePage(
          key: state.pageKey,
          child: const SignInScreen(),
        ),
      ),
      GoRoute(
        path: '/auth/register',
        pageBuilder: (_, state) => siragroFadeSlidePage(
          key: state.pageKey,
          child: const RegisterScreen(),
        ),
      ),
      GoRoute(
        path: '/auth/forgot-password',
        pageBuilder: (_, state) => siragroFadeSlidePage(
          key: state.pageKey,
          child: const ForgotPasswordScreen(),
        ),
      ),
      GoRoute(
        path: '/orders',
        pageBuilder: (_, state) => siragroFadeSlidePage(
          key: state.pageKey,
          child: const OrdersScreen(),
        ),
      ),
      GoRoute(
        path: '/orders/:id',
        pageBuilder: (_, state) => siragroFadeSlidePage(
          key: state.pageKey,
          child: OrderDetailScreen(
            orderId: state.pathParameters['id'] ?? '',
          ),
        ),
      ),
      GoRoute(
        path: '/support/about',
        pageBuilder: (_, state) => siragroFadeSlidePage(
          key: state.pageKey,
          child: const AboutSiragroScreen(),
        ),
      ),
      GoRoute(
        path: '/support/contact',
        pageBuilder: (_, state) => siragroFadeSlidePage(
          key: state.pageKey,
          child: const ContactSiragroScreen(),
        ),
      ),
      GoRoute(
        path: '/support/delivery',
        pageBuilder: (_, state) => siragroFadeSlidePage(
          key: state.pageKey,
          child: const DeliveryInfoScreen(),
        ),
      ),
      GoRoute(
        path: '/support/privacy',
        pageBuilder: (_, state) => siragroFadeSlidePage(
          key: state.pageKey,
          child: const PrivacyPolicyScreen(),
        ),
      ),
      GoRoute(
        path: '/support/terms',
        pageBuilder: (_, state) => siragroFadeSlidePage(
          key: state.pageKey,
          child: const TermsScreen(),
        ),
      ),
    ],
  );
});

class _AppShell extends ConsumerWidget {
  final StatefulNavigationShell navigationShell;

  const _AppShell({required this.navigationShell});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final basketCount =
        ref.watch(basketControllerProvider).valueOrNull?.itemCount ?? 0;
    final isDesignPreview = ref.watch(appConfigProvider).isDesignPreview;
    final animDuration = SiragroMotion.duration(
      context,
      normal: const Duration(milliseconds: 200),
    );

    return Scaffold(
      body: Column(
        children: [
          if (isDesignPreview)
            Material(
              color: SiragroColors.brassTint,
              child: SafeArea(
                bottom: false,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: const BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: SiragroColors.brass, width: 1),
                    ),
                  ),
                  child: const Text(
                    'DESIGN PREVIEW • SAMPLE DATA (No live backend calls)',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.6,
                      color: SiragroColors.brandDark,
                    ),
                  ),
                ),
              ),
            ),
          Expanded(child: navigationShell),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: SiragroColors.border)),
        ),
        child: NavigationBar(
          selectedIndex: navigationShell.currentIndex,
          onDestinationSelected: (idx) {
            HapticFeedback.selectionClick();
            navigationShell.goBranch(
              idx,
              initialLocation: idx == navigationShell.currentIndex,
            );
          },
          destinations: [
            const NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home_rounded),
              label: 'Home',
            ),
            const NavigationDestination(
              icon: Icon(Icons.storefront_outlined),
              selectedIcon: Icon(Icons.storefront_rounded),
              label: 'Shop',
            ),
            NavigationDestination(
              icon: _AnimatedBasketBadge(
                count: basketCount,
                duration: animDuration,
                selected: false,
              ),
              selectedIcon: _AnimatedBasketBadge(
                count: basketCount,
                duration: animDuration,
                selected: true,
              ),
              label: 'Basket',
            ),
            const NavigationDestination(
              icon: Icon(Icons.person_outline_rounded),
              selectedIcon: Icon(Icons.person_rounded),
              label: 'Account',
            ),
          ],
        ),
      ),
    );
  }
}

class _AnimatedBasketBadge extends StatelessWidget {
  final int count;
  final Duration duration;
  final bool selected;

  const _AnimatedBasketBadge({
    required this.count,
    required this.duration,
    required this.selected,
  });

  @override
  Widget build(BuildContext context) {
    return Badge(
      isLabelVisible: count > 0,
      backgroundColor: SiragroColors.sage,
      label: AnimatedSwitcher(
        duration: duration,
        transitionBuilder: (child, anim) =>
            ScaleTransition(scale: anim, child: child),
        child: Text(
          '$count',
          key: ValueKey<int>(count),
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      child: Icon(
        selected
            ? Icons.shopping_basket_rounded
            : Icons.shopping_basket_outlined,
      ),
    );
  }
}
