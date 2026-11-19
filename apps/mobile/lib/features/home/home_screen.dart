import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/siragro_theme.dart';
import '../../core/errors/app_exception.dart';
import '../../core/providers/app_providers.dart';
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
  if (!config.isApiConfigured) {
    throw const AppException(
      'No staging store API is configured yet. Connect a staging backend in .env to browse live products.',
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
        titleSpacing: 16,
        title: const Row(
          children: [
            SiragroLogo(size: 36),
            SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'SIRAGRO',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.6,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    'Supermarket & Off-Licence',
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w600,
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
            icon: const Icon(Icons.search),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(homeDataProvider),
        child: CustomScrollView(
          slivers: [
            // Search entry bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => context.go('/shop?focusSearch=1'),
                  child: Container(
                    height: 48,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: SiragroColors.border),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.search, color: SiragroColors.textMuted),
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
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Restrained, manually swipeable storefront carousel (approved store assets only, no fake promos)
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
              loading: () => const SliverFillRemaining(
                hasScrollBody: false,
                child: LoadingStateView(message: 'Loading store catalogue…'),
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
                  // Category shortcuts
                  if (data.categories.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Shop by Aisle',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              color: SiragroColors.textPrimary,
                            ),
                          ),
                          TextButton(
                            onPressed: () => context.go('/shop'),
                            child: const Text('View all'),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(
                      height: 46,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: data.categories.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          final cat = data.categories[index];
                          return ActionChip(
                            label: Text(cat.name),
                            backgroundColor: Colors.white,
                            side: const BorderSide(color: SiragroColors.border),
                            onPressed: () =>
                                context.go('/shop?category=${cat.slug}'),
                          );
                        },
                      ),
                    ),
                  ],

                  // Featured products header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Available In Store',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: SiragroColors.textPrimary,
                          ),
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
                      padding: EdgeInsets.all(24),
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
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
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
                            return ProductCard(
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
                                    content: Text(
                                      err ?? 'Added ${product.name} to basket',
                                    ),
                                    duration: const Duration(seconds: 2),
                                  ),
                                );
                              },
                            );
                          },
                        );
                      },
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
        title: 'SIRAGRO Hayes (UB3 4NS)',
        subtitle:
            'Fresh groceries, pantry staples, chilled drinks & licensed off-licence.',
        buttonLabel: 'Browse Groceries',
        onPressed: onBrowseShop,
        usePhoto: true,
      ),
      _HeroSlide(
        title: 'Click & Collect & Local Info',
        subtitle:
            '147 North Hyde Road, Hayes UB3 4NS. Check live collection & delivery availability.',
        buttonLabel: 'Fulfilment Info',
        onPressed: onDeliveryInfo,
        usePhoto: false,
      ),
    ];

    return Column(
      children: [
        SizedBox(
          height: 176,
          child: PageView.builder(
            controller: controller,
            itemCount: slides.length,
            onPageChanged: onPageChanged,
            itemBuilder: (context, index) => slides[index],
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton(
              tooltip: 'Previous slide',
              visualDensity: VisualDensity.compact,
              onPressed: currentIndex > 0
                  ? () => controller.previousPage(
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeOut,
                      )
                  : null,
              icon: const Icon(Icons.chevron_left, size: 20),
            ),
            ...List.generate(slides.length, (idx) {
              final active = idx == currentIndex;
              return Semantics(
                label: 'Slide ${idx + 1} of ${slides.length}',
                selected: active,
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: active ? 20 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: active
                        ? SiragroColors.brand
                        : SiragroColors.border,
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
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeOut,
                      )
                  : null,
              icon: const Icon(Icons.chevron_right, size: 20),
            ),
          ],
        ),
      ],
    );
  }
}

class _HeroSlide extends StatelessWidget {
  final String title;
  final String subtitle;
  final String buttonLabel;
  final VoidCallback onPressed;
  final bool usePhoto;

  const _HeroSlide({
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
        borderRadius: BorderRadius.circular(16),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (usePhoto)
            Opacity(
              opacity: 0.25,
              child: Image.asset(
                'assets/images/hero-supermarket.jpg',
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
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
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: onPressed,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: SiragroColors.brand,
                    minimumSize: const Size(44, 40),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
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
