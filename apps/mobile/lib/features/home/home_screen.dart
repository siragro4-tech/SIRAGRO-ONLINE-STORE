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
  final PageController _bannerController = PageController();
  int _bannerIndex = 0;
  String? _addingProductId;

  @override
  void dispose() {
    _bannerController.dispose();
    super.dispose();
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
                        '147 North Hyde Rd, Hayes UB3 4NS • Daily 7am–10pm • Challenge 25',
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

            // Editorial search entry bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Material(
                  color: SiragroColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: () => context.go('/shop?focusSearch=1'),
                    child: Container(
                      height: 50,
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

            // Refined swipeable storefront carousel (approved assets only)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: _StoreHeroCarousel(
                  controller: _bannerController,
                  currentIndex: _bannerIndex,
                  onPageChanged: (idx) => setState(() => _bannerIndex = idx),
                  onBrowseShop: () => context.go('/shop'),
                  onDeliveryInfo: () => context.push('/support/delivery'),
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
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Shop by Aisle',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          TextButton(
                            onPressed: () => context.go('/shop'),
                            child: const Text('All aisles'),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(
                      height: 44,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: data.categories.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          final cat = data.categories[index];
                          return ActionChip(
                            label: Text(cat.name),
                            backgroundColor: SiragroColors.surface,
                            side: const BorderSide(color: SiragroColors.border),
                            onPressed: () =>
                                context.go('/shop?category=${cat.slug}'),
                          );
                        },
                      ),
                    ),
                  ],

                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 22, 16, 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'In Store Selection',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        TextButton(
                          onPressed: () => context.go('/shop'),
                          child: const Text('Browse all'),
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
                  if (data.featuredProducts.isNotEmpty) ...[
                    // In-Store Counter Services (matches website section 4)
                    _InStoreServicesSection(),
                    // Local Delivery Coverage (matches website section 5)
                    _DeliveryCoverageSection(
                      onViewDetails: () => context.push('/support/delivery'),
                    ),
                  ],
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StoreHeroCarousel extends StatelessWidget {
  final PageController controller;
  final int currentIndex;
  final ValueChanged<int> onPageChanged;
  final VoidCallback onBrowseShop;
  final VoidCallback onDeliveryInfo;

  const _StoreHeroCarousel({
    required this.controller,
    required this.currentIndex,
    required this.onPageChanged,
    required this.onBrowseShop,
    required this.onDeliveryInfo,
  });

  @override
  Widget build(BuildContext context) {
    final slides = [
      _HeroSlide(
        eyebrow: 'SIRAGRO SUPERMARKET & OFF-LICENCE',
        title: 'Fresh Choices.\nEveryday Essentials.',
        subtitle:
            'Your local supermarket for fresh groceries, everyday essentials and more.',
        buttonLabel: 'Shop Now',
        onPressed: onBrowseShop,
        usePhoto: true,
      ),
      _HeroSlide(
        eyebrow: 'CLICK & COLLECT • HAYES UB3 4NS',
        title: '147 North Hyde Road',
        subtitle:
            'Free in-store collection in 30 mins. Check live delivery availability before checkout.',
        buttonLabel: 'Delivery & Collection',
        onPressed: onDeliveryInfo,
        usePhoto: false,
      ),
    ];

    final animDuration = SiragroMotion.duration(
      context,
      normal: const Duration(milliseconds: 240),
    );

    return Column(
      children: [
        SizedBox(
          height: 212,
          child: PageView.builder(
            controller: controller,
            itemCount: slides.length,
            onPageChanged: onPageChanged,
            itemBuilder: (context, index) => slides[index],
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton(
              tooltip: 'Previous slide',
              visualDensity: VisualDensity.compact,
              onPressed: currentIndex > 0
                  ? () => controller.previousPage(
                        duration: const Duration(milliseconds: 260),
                        curve: Curves.easeOutCubic,
                      )
                  : null,
              icon: const Icon(Icons.chevron_left_rounded, size: 22),
            ),
            ...List.generate(slides.length, (idx) {
              final active = idx == currentIndex;
              return Semantics(
                label: 'Slide ${idx + 1} of ${slides.length}',
                selected: active,
                child: AnimatedContainer(
                  duration: animDuration,
                  curve: Curves.easeOutCubic,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: active ? 22 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: active ? SiragroColors.brand : SiragroColors.borderStrong,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              );
            }),
            IconButton(
              tooltip: 'Next slide',
              visualDensity: VisualDensity.compact,
              onPressed: currentIndex < slides.length - 1
                  ? () => controller.nextPage(
                        duration: const Duration(milliseconds: 260),
                        curve: Curves.easeOutCubic,
                      )
                  : null,
              icon: const Icon(Icons.chevron_right_rounded, size: 22),
            ),
          ],
        ),
      ],
    );
  }
}

class _HeroSlide extends StatelessWidget {
  final String eyebrow;
  final String title;
  final String subtitle;
  final String buttonLabel;
  final VoidCallback onPressed;
  final bool usePhoto;

  const _HeroSlide({
    required this.eyebrow,
    required this.title,
    required this.subtitle,
    required this.buttonLabel,
    required this.onPressed,
    required this.usePhoto,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: SiragroColors.brand,
        borderRadius: BorderRadius.circular(18),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (usePhoto) ...[
            Image.asset(
              'assets/images/hero-supermarket.jpg',
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const SizedBox.shrink(),
            ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    SiragroColors.brandDark.withValues(alpha: 0.88),
                    SiragroColors.brand.withValues(alpha: 0.68),
                    SiragroColors.brand.withValues(alpha: 0.35),
                  ],
                ),
              ),
            ),
          ],
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  eyebrow,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: SiragroColors.brassTint,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.3,
                    height: 1.15,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFFE2E8F0),
                    fontSize: 13,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 14),
                ElevatedButton(
                  onPressed: onPressed,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: SiragroColors.brand,
                    minimumSize: const Size(44, 40),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                  ),
                  child: Text(buttonLabel),
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
            ],
          ),
        ),
      ),
    );
  }
}
