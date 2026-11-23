import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/siragro_theme.dart';
import '../../core/errors/app_exception.dart';
import '../../core/preview/design_preview_fixtures.dart';
import '../../core/providers/app_providers.dart';
import '../../core/widgets/motion.dart';
import '../../core/widgets/state_views.dart';
import '../../shared/models/category.dart';
import '../../shared/models/fulfilment.dart';
import '../../shared/models/product.dart';
import '../../shared/widgets/product_card.dart';
import '../../shared/widgets/siragro_logo.dart';
import '../basket/basket_controller.dart';

class HomeData {
  final List<StoreCategory> categories;
  final List<Product> featuredProducts;
  final FulfilmentAvailability fulfilment;

  const HomeData({
    required this.categories,
    required this.featuredProducts,
    required this.fulfilment,
  });
}

final homeDataProvider = FutureProvider.autoDispose<HomeData>((ref) async {
  final config = ref.watch(appConfigProvider);
  if (config.isDesignPreview) {
    return const HomeData(
      categories: DesignPreviewFixtures.categories,
      featuredProducts: DesignPreviewFixtures.products,
      fulfilment: DesignPreviewFixtures.fulfilment,
    );
  }

  if (!config.isApiConfigured) {
    throw const AppException(
      'No staging store API is configured yet. Connect a staging backend in .env / --dart-define to browse live products.',
      statusCode: 503,
      isBlockedByPolicy: true,
    );
  }

  final api = ref.read(apiClientProvider);
  final data = await api.get('/api/v1/home');

  final categories = (data['categories'] as List<dynamic>? ?? const [])
      .whereType<Map<String, dynamic>>()
      .map(StoreCategory.fromJson)
      .toList();

  final products = (data['featuredProducts'] as List<dynamic>? ?? const [])
      .whereType<Map<String, dynamic>>()
      .map(Product.fromJson)
      .toList();

  final fulfilment = data['fulfilment'] is Map<String, dynamic>
      ? FulfilmentAvailability.fromJson(
          data['fulfilment'] as Map<String, dynamic>,
        )
      : const FulfilmentAvailability.unverified();

  return HomeData(
    categories: categories,
    featuredProducts: products,
    fulfilment: fulfilment,
  );
});

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final GlobalKey _deptKey = GlobalKey();
  String? _addingProductId;

  void _scrollToDepartments() {
    final targetContext = _deptKey.currentContext;
    if (targetContext == null) {
      context.go('/shop');
      return;
    }
    Scrollable.ensureVisible(
      targetContext,
      duration: SiragroMotion.duration(
        context,
        normal: const Duration(milliseconds: 360),
      ),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    final homeAsync = ref.watch(homeDataProvider);

    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 64,
        titleSpacing: 16,
        title: const Row(
          children: [
            SiragroLogo(size: 38),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'SIRAGRO',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.8,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    'Hayes • 147 North Hyde Road',
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFFDCE3EC),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Search products',
            onPressed: () => context.go('/shop?focusSearch=1'),
            icon: const Icon(Icons.search_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(homeDataProvider),
        child: CustomScrollView(
          slivers: [
            // Store utility strip (matches website Header top bar)
            SliverToBoxAdapter(
              child: Container(
                color: SiragroColors.brandDark,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: const Row(
                  children: [
                    Icon(Icons.location_on_outlined, size: 14, color: Colors.white70),
                    SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        '147 North Hyde Road, Hayes UB3 4NS • 020 8813 6458 • Daily: 7am – 10pm • Challenge 25',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: Color(0xFFE2E8F0),
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 1. Cinematic Hero Section (matches website section 1)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: _WebsiteHeroBanner(
                  onShopNow: () => context.go('/shop'),
                  onExploreStore: _scrollToDepartments,
                ),
              ),
            ),

            // Quick search bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                child: Material(
                  color: SiragroColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: () => context.go('/shop?focusSearch=1'),
                    child: Container(
                      height: 48,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: SiragroColors.border),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.search_rounded, color: SiragroColors.brand),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Search groceries, drinks, fresh produce…',
                              style: TextStyle(
                                color: SiragroColors.textMuted,
                                fontSize: 14,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Icon(
                            Icons.tune_rounded,
                            size: 18,
                            color: SiragroColors.textMuted,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

            homeAsync.when(
              loading: () => const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.only(top: 12),
                  child: SkeletonProductGrid(itemCount: 4),
                ),
              ),
              error: (err, _) => SliverFillRemaining(
                hasScrollBody: false,
                child: ErrorRetryView(
                  title: 'Storefront Unavailable',
                  message: err.toString(),
                  onRetry: () => ref.invalidate(homeDataProvider),
                ),
              ),
              data: (data) => SliverList(
                delegate: SliverChildListDelegate([
                  if (data.categories.isNotEmpty) ...[
                    Padding(
                      key: _deptKey,
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Shop by Department',
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                const Text(
                                  'Everyday supermarket fresh stock',
                                  style: TextStyle(
                                    color: SiragroColors.textMuted,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          TextButton(
                            onPressed: () => context.go('/shop'),
                            child: const Text('View All →'),
                          ),
                        ],
                      ),
                    ),
                    _DepartmentGrid(
                      categories: data.categories,
                      onSelect: (slug) => context.go('/shop?category=$slug'),
                    ),
                  ],

                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 22, 16, 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Popular In Store',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              const Text(
                                'Available for same-day delivery or collection',
                                style: TextStyle(
                                  color: SiragroColors.textMuted,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.go('/shop'),
                          child: const Text('Explore Catalogue →'),
                        ),
                      ],
                    ),
                  ),

                  if (data.featuredProducts.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(16),
                      child: EmptyStateView(
                        icon: Icons.inventory_2_outlined,
                        title: 'No featured products yet',
                        subtitle: 'Browse the Shop tab to view available items.',
                      ),
                    )
                  else
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final width = constraints.maxWidth;
                        final crossAxisCount = width >= 900
                            ? 4
                            : width >= 600
                                ? 3
                                : 2;
                        return GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
                          gridDelegate:
                              SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: crossAxisCount,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 0.62,
                          ),
                          itemCount: data.featuredProducts.length,
                          itemBuilder: (context, index) {
                            final product = data.featuredProducts[index];
                            return StaggeredEntrance(
                              index: index,
                              child: ProductCard(
                                product: product,
                                isAdding: _addingProductId == product.id,
                                onTap: () =>
                                    context.push('/product/${product.slug}'),
                                onAddToBasket: () async {
                                  setState(() => _addingProductId = product.id);
                                  final err = await ref
                                      .read(basketControllerProvider.notifier)
                                      .addItem(product.id);
                                  if (!context.mounted) return;
                                  setState(() => _addingProductId = null);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      behavior: SnackBarBehavior.floating,
                                      content: Text(
                                        err ?? 'Added ${product.name} to basket',
                                      ),
                                      duration: const Duration(seconds: 2),
                                    ),
                                  );
                                },
                              ),
                            );
                          },
                        );
                      },
                    ),
                  // 4. In-Store Counter Services (matches website section 4)
                  _InStoreServicesSection(),
                  // 5. Local Delivery Coverage (matches website section 5)
                  _DeliveryCoverageSection(
                    onViewDetails: () => context.push('/support/delivery'),
                  ),
                  // 6. Storefront Footer (matches website Footer.tsx)
                  _StorefrontFooterSection(
                    onDeliveryInfo: () => context.push('/support/delivery'),
                    onContact: () => context.push('/support/contact'),
                    onAbout: () => context.push('/support/about'),
                    onAccount: () => context.go('/account'),
                    onTerms: () => context.push('/support/terms'),
                    onPrivacy: () => context.push('/support/privacy'),
                  ),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WebsiteHeroBanner extends StatelessWidget {
  final VoidCallback onShopNow;
  final VoidCallback onExploreStore;

  const _WebsiteHeroBanner({
    required this.onShopNow,
    required this.onExploreStore,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: SiragroColors.brandDark,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: SiragroColors.brandDark),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              'assets/images/hero-supermarket.jpg',
              fit: BoxFit.cover,
              alignment: const Alignment(0, -0.24),
              errorBuilder: (_, __, ___) => const SizedBox.shrink(),
            ),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    SiragroColors.brandDark.withValues(alpha: 0.86),
                    SiragroColors.brand.withValues(alpha: 0.56),
                    SiragroColors.brand.withValues(alpha: 0.24),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.95),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Text(
                    'SIRAGRO SUPERMARKET & OFF-LICENCE',
                    style: TextStyle(
                      color: SiragroColors.brand,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.7,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Fresh Choices.\nEveryday Essentials.',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.4,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Your local supermarket for fresh groceries, everyday essentials and more. Shop with us today!',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w500,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    ElevatedButton(
                      onPressed: onShopNow,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: SiragroColors.brand,
                        minimumSize: const Size(44, 42),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 10,
                        ),
                      ),
                      child: const Text('Shop Now'),
                    ),
                    OutlinedButton(
                      onPressed: onExploreStore,
                      style: OutlinedButton.styleFrom(
                        backgroundColor:
                            SiragroColors.brandDark.withValues(alpha: 0.85),
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white, width: 1.5),
                        minimumSize: const Size(44, 42),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                      ),
                      child: const Text('Explore Our Store'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InStoreServicesSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const services = [
      (icon: Icons.payments_outlined, name: 'PayPoint', desc: 'Bills & energy'),
      (icon: Icons.confirmation_num_outlined, name: 'National Lottery', desc: 'Tickets & scratch'),
      (icon: Icons.currency_exchange_rounded, name: 'Ria Money', desc: 'Global transfer'),
      (icon: Icons.key_outlined, name: 'KeyNest', desc: 'Key exchange'),
      (icon: Icons.phone_android_outlined, name: 'Phone Repair', desc: 'Screen fix'),
      (icon: Icons.wine_bar_outlined, name: 'Off Licence', desc: 'Beers & spirits'),
    ];

    return Container(
      color: SiragroColors.brand,
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 26),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'In-Store Services',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Convenient counter services at 147 North Hyde Road, Hayes',
            style: TextStyle(color: Color(0xFFDCE3EC), fontSize: 12.5),
          ),
          const SizedBox(height: 14),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.05,
            ),
            itemCount: services.length,
            itemBuilder: (context, index) {
              final srv = services[index];
              return Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: SiragroColors.brandDark,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.14),
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(srv.icon, color: SiragroColors.brassSoft, size: 24),
                    const SizedBox(height: 6),
                    Text(
                      srv.name,
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      srv.desc,
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFFCBD5E1),
                        fontSize: 10.5,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _DeliveryCoverageSection extends StatelessWidget {
  final VoidCallback onViewDetails;

  const _DeliveryCoverageSection({required this.onViewDetails});

  @override
  Widget build(BuildContext context) {
    const zones = [
      (
        zone: 'Local Delivery (Up to 1 mile)',
        fee: 'FREE on orders strictly over £25',
      ),
      (
        zone: 'Local Delivery (1 – 5 miles)',
        fee: 'Delivery charge applies (awaiting store confirmation)',
      ),
      (
        zone: 'Beyond 5 miles',
        fee: 'Home delivery unavailable',
      ),
      (
        zone: 'Click & Collect (UB3 4NS)',
        fee: 'Store collection available (Free, ready in 30 mins)',
      ),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 22, 16, 32),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'Local Delivery Coverage',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  TextButton(
                    onPressed: onViewDetails,
                    child: const Text('Full info'),
                  ),
                ],
              ),
              const Text(
                'Dispatched from 147 North Hyde Road, Hayes UB3 4NS (up to 5 miles)',
                style: TextStyle(color: SiragroColors.textMuted, fontSize: 12.5),
              ),
              const SizedBox(height: 12),
              ...zones.map(
                (z) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.local_shipping_outlined,
                        size: 16,
                        color: SiragroColors.brand,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              z.zone,
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                              ),
                            ),
                            Text(
                              z.fee,
                              style: const TextStyle(
                                color: SiragroColors.textMuted,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Postcode verified at checkout using straight-line distance from UB3 4NS. Home delivery checkout opens once all store delivery fees are confirmed.',
                style: TextStyle(
                  color: SiragroColors.textMuted,
                  fontSize: 11.5,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DepartmentGrid extends StatelessWidget {
  final List<StoreCategory> categories;
  final ValueChanged<String> onSelect;

  const _DepartmentGrid({
    required this.categories,
    required this.onSelect,
  });

  static IconData _iconForSlug(String slug) {
    switch (slug) {
      case 'fresh-produce':
        return Icons.eco_outlined;
      case 'dairy-eggs':
        return Icons.egg_alt_outlined;
      case 'bakery':
        return Icons.bakery_dining_outlined;
      case 'meat-fish':
        return Icons.set_meal_outlined;
      case 'off-licence-beverages':
      case 'drinks-off-licence':
        return Icons.wine_bar_outlined;
      case 'cupboard-groceries':
        return Icons.kitchen_outlined;
      case 'frozen-goods':
        return Icons.ac_unit_rounded;
      case 'household-cleaning':
        return Icons.cleaning_services_outlined;
      default:
        return Icons.shopping_basket_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cols = constraints.maxWidth >= 720 ? 4 : 2;
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: cols,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 2.35,
          ),
          itemCount: categories.length,
          itemBuilder: (context, index) {
            final cat = categories[index];
            return Material(
              color: SiragroColors.surfaceWarm,
              borderRadius: BorderRadius.circular(14),
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => onSelect(cat.slug),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: SiragroColors.border),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: SiragroColors.surface,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: SiragroColors.border),
                        ),
                        child: Icon(
                          _iconForSlug(cat.slug),
                          size: 18,
                          color: SiragroColors.brand,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          cat.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: SiragroColors.brand,
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                            height: 1.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class _StorefrontFooterSection extends StatelessWidget {
  final VoidCallback onDeliveryInfo;
  final VoidCallback onContact;
  final VoidCallback onAbout;
  final VoidCallback onAccount;
  final VoidCallback onTerms;
  final VoidCallback onPrivacy;

  const _StorefrontFooterSection({
    required this.onDeliveryInfo,
    required this.onContact,
    required this.onAbout,
    required this.onAccount,
    required this.onTerms,
    required this.onPrivacy,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: SiragroColors.brandDark,
      padding: const EdgeInsets.fromLTRB(16, 26, 16, 34),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              SiragroLogo(size: 46),
              SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'SIRAGRO',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                    ),
                  ),
                  Text(
                    'SUPERMARKET & OFF-LICENCE',
                    style: TextStyle(
                      color: Color(0xFFCBD5E1),
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.1,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Your trusted local supermarket and licensed off-licence in Hayes, UB3. Fresh groceries, chilled beverages, pantry goods and friendly counter service.',
            style: TextStyle(
              color: Color(0xFFDCE3EC),
              fontSize: 12.5,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _FooterLinkChip(label: 'Delivery Info', onTap: onDeliveryInfo),
              _FooterLinkChip(label: 'Contact Us & Map', onTap: onContact),
              _FooterLinkChip(label: 'About SIRAGRO', onTap: onAbout),
              _FooterLinkChip(label: 'My Account', onTap: onAccount),
              _FooterLinkChip(label: 'Terms & Conditions', onTap: onTerms),
              _FooterLinkChip(label: 'Privacy Policy', onTap: onPrivacy),
            ],
          ),
          const SizedBox(height: 18),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: SiragroColors.brand,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.16),
              ),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'CHALLENGE 25',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.9,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Under the Licensing Act 2003, it is an offence to sell alcohol to anyone under 18. Valid photo ID required.',
                  style: TextStyle(
                    color: Color(0xFFDCE3EC),
                    fontSize: 11.5,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Divider(color: Color(0xFF3D495B), height: 1),
          const SizedBox(height: 12),
          const Text(
            '© 2026 SIRAGRO. 147 North Hyde Road, Hayes, Middlesex UB3 4NS. All rights reserved.',
            style: TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

class _FooterLinkChip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _FooterLinkChip({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      label: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11.5,
          fontWeight: FontWeight.w600,
        ),
      ),
      backgroundColor: SiragroColors.brand,
      side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
      onPressed: onTap,
    );
  }
}
