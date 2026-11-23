import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/siragro_theme.dart';
import '../../core/errors/app_exception.dart';
import '../../core/preview/design_preview_fixtures.dart';
import '../../core/providers/app_providers.dart';
import '../../core/widgets/motion.dart';
import '../../core/widgets/state_views.dart';
import '../../shared/models/product.dart';
import '../../shared/widgets/product_card.dart';
import '../basket/basket_controller.dart';
import '../home/home_screen.dart';

class ShopScreen extends ConsumerStatefulWidget {
  final String? initialCategory;
  final bool focusSearch;

  const ShopScreen({
    super.key,
    this.initialCategory,
    this.focusSearch = false,
  });

  @override
  ConsumerState<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends ConsumerState<ShopScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  Timer? _debounce;

  String? _selectedCategory;
  String _sort = 'featured';
  bool _inStockOnly = false;
  int _page = 1;
  bool _hasMore = false;
  bool _isLoading = false;
  bool _isLoadingMore = false;
  String? _error;
  String? _addingProductId;
  List<Product> _items = [];

  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.initialCategory;
    if (widget.focusSearch) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _searchFocus.requestFocus();
      });
    }
    _fetchPage(reset: true);
  }

  @override
  void didUpdateWidget(covariant ShopScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialCategory != oldWidget.initialCategory) {
      _selectedCategory = widget.initialCategory;
      _fetchPage(reset: true);
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  void _onSearchChanged(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      _fetchPage(reset: true);
    });
  }

  Future<void> _fetchPage({required bool reset}) async {
    final config = ref.read(appConfigProvider);
    if (config.isDesignPreview) {
      final q = _searchCtrl.text.trim().toLowerCase();
      var list = DesignPreviewFixtures.products.where((p) {
        if (_selectedCategory != null && p.category?.slug != _selectedCategory) {
          return false;
        }
        if (_inStockOnly && p.isOutOfStock) return false;
        if (q.isNotEmpty &&
            !p.name.toLowerCase().contains(q) &&
            !(p.brand?.toLowerCase().contains(q) ?? false)) {
          return false;
        }
        return true;
      }).toList();

      if (_sort == 'price_asc') {
        list.sort((a, b) => a.price.compareTo(b.price));
      } else if (_sort == 'price_desc') {
        list.sort((a, b) => b.price.compareTo(a.price));
      } else if (_sort == 'name_asc') {
        list.sort((a, b) => a.name.compareTo(b.name));
      }

      setState(() {
        _items = list;
        _hasMore = false;
        _isLoading = false;
        _error = null;
      });
      return;
    }

    if (!config.isApiConfigured) {
      setState(() {
        _error =
            'Store API URL is not configured. Connect a staging environment in .env / --dart-define.';
        _isLoading = false;
      });
      return;
    }

    if (reset) {
      setState(() {
        _page = 1;
        _isLoading = true;
        _error = null;
      });
    } else {
      setState(() => _isLoadingMore = true);
    }

    try {
      final api = ref.read(apiClientProvider);
      final query = <String, String>{
        'page': _page.toString(),
        'limit': '24',
        'sort': _sort,
        if (_inStockOnly) 'in_stock': 'true',
        if (_selectedCategory != null && _selectedCategory!.isNotEmpty)
          'category': _selectedCategory!,
        if (_searchCtrl.text.trim().isNotEmpty) 'q': _searchCtrl.text.trim(),
      };

      final data = await api.get('/api/v1/products', query: query);
      final fetched = (data['items'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(Product.fromJson)
          .toList();

      if (!mounted) return;
      setState(() {
        _items = reset ? fetched : [..._items, ...fetched];
        _hasMore = data['hasMore'] == true;
        _isLoading = false;
        _isLoadingMore = false;
      });
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _isLoading = false;
        _isLoadingMore = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load products right now. Please try again.';
        _isLoading = false;
        _isLoadingMore = false;
      });
    }
  }

  Future<void> _openFilterSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: SiragroColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Sort & Availability',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ChoiceChip(
                      label: const Text('Featured'),
                      selected: _sort == 'featured',
                      onSelected: (_) {
                        setState(() => _sort = 'featured');
                        setSheetState(() {});
                      },
                    ),
                    ChoiceChip(
                      label: const Text('Price: Low–High'),
                      selected: _sort == 'price_asc',
                      onSelected: (_) {
                        setState(() => _sort = 'price_asc');
                        setSheetState(() {});
                      },
                    ),
                    ChoiceChip(
                      label: const Text('Price: High–Low'),
                      selected: _sort == 'price_desc',
                      onSelected: (_) {
                        setState(() => _sort = 'price_desc');
                        setSheetState(() {});
                      },
                    ),
                    ChoiceChip(
                      label: const Text('Name: A–Z'),
                      selected: _sort == 'name_asc',
                      onSelected: (_) {
                        setState(() => _sort = 'name_asc');
                        setSheetState(() {});
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text(
                    'In Stock Only',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  value: _inStockOnly,
                  onChanged: (v) {
                    setState(() => _inStockOnly = v);
                    setSheetState(() {});
                  },
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _fetchPage(reset: true);
                    },
                    child: const Text('Apply Filters'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final homeAsync = ref.watch(homeDataProvider);
    final categories = homeAsync.valueOrNull?.categories ?? const [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Shop Catalogue'),
        actions: [
          IconButton(
            tooltip: 'Sort & filter',
            onPressed: _openFilterSheet,
            icon: const Icon(Icons.tune_rounded),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            decoration: const BoxDecoration(
              color: SiragroColors.surface,
              border: Border(bottom: BorderSide(color: SiragroColors.border)),
            ),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Column(
              children: [
                TextField(
                  controller: _searchCtrl,
                  focusNode: _searchFocus,
                  onChanged: _onSearchChanged,
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: 'Search 1,500+ products by name or brand…',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: _searchCtrl.text.isNotEmpty
                        ? IconButton(
                            tooltip: 'Clear search',
                            onPressed: () {
                              _searchCtrl.clear();
                              _fetchPage(reset: true);
                            },
                            icon: const Icon(Icons.clear_rounded),
                          )
                        : null,
                  ),
                ),
                const SizedBox(height: 10),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      ActionChip(
                        avatar: const Icon(Icons.tune_rounded, size: 16),
                        label: const Text('Filter & Sort'),
                        onPressed: _openFilterSheet,
                      ),
                      if (categories.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        ChoiceChip(
                          label: const Text('All Aisles'),
                          selected: _selectedCategory == null,
                          onSelected: (_) {
                            setState(() => _selectedCategory = null);
                            _fetchPage(reset: true);
                          },
                        ),
                        ...categories.map(
                          (cat) => Padding(
                            padding: const EdgeInsets.only(left: 6),
                            child: ChoiceChip(
                              label: Text(cat.name),
                              selected: _selectedCategory == cat.slug,
                              onSelected: (_) {
                                setState(() => _selectedCategory = cat.slug);
                                _fetchPage(reset: true);
                              },
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const SingleChildScrollView(
                    padding: EdgeInsets.only(top: 16),
                    child: SkeletonProductGrid(itemCount: 6),
                  )
                : _error != null
                    ? ErrorRetryView(
                        title: 'Catalogue Unavailable',
                        message: _error!,
                        onRetry: () => _fetchPage(reset: true),
                      )
                    : _items.isEmpty
                        ? EmptyStateView(
                            icon: Icons.search_off_rounded,
                            title: 'No matching products found',
                            subtitle:
                                'Try adjusting your search term or clearing filters.',
                            action: OutlinedButton(
                              onPressed: () {
                                _searchCtrl.clear();
                                setState(() {
                                  _selectedCategory = null;
                                  _inStockOnly = false;
                                  _sort = 'featured';
                                });
                                _fetchPage(reset: true);
                              },
                              child: const Text('Reset Filters'),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => _fetchPage(reset: true),
                            child: LayoutBuilder(
                              builder: (context, constraints) {
                                final width = constraints.maxWidth;
                                final cols = width >= 900
                                    ? 4
                                    : width >= 600
                                        ? 3
                                        : 2;

                                return ListView(
                                  padding: const EdgeInsets.all(16),
                                  children: [
                                    GridView.builder(
                                      shrinkWrap: true,
                                      physics:
                                          const NeverScrollableScrollPhysics(),
                                      gridDelegate:
                                          SliverGridDelegateWithFixedCrossAxisCount(
                                        crossAxisCount: cols,
                                        crossAxisSpacing: 12,
                                        mainAxisSpacing: 12,
                                        childAspectRatio: 0.50,
                                      ),
                                      itemCount: _items.length,
                                      itemBuilder: (context, index) {
                                        final product = _items[index];
                                        return StaggeredEntrance(
                                          index: index,
                                          child: ProductCard(
                                            product: product,
                                            isAdding:
                                                _addingProductId == product.id,
                                            onTap: () => context.push(
                                              '/product/${product.slug}',
                                            ),
                                            onAddToBasket: () async {
                                              setState(() => _addingProductId =
                                                  product.id);
                                              final err = await ref
                                                  .read(basketControllerProvider
                                                      .notifier)
                                                  .addItem(product.id);
                                              if (!context.mounted) return;
                                              setState(() =>
                                                  _addingProductId = null);
                                              ScaffoldMessenger.of(context)
                                                  .showSnackBar(
                                                SnackBar(
                                                  behavior:
                                                      SnackBarBehavior.floating,
                                                  content: Text(
                                                    err ??
                                                        'Added ${product.name} to basket',
                                                  ),
                                                  duration: const Duration(
                                                    seconds: 2,
                                                  ),
                                                ),
                                              );
                                            },
                                          ),
                                        );
                                      },
                                    ),
                                    if (_hasMore) ...[
                                      const SizedBox(height: 18),
                                      Center(
                                        child: OutlinedButton(
                                          onPressed: _isLoadingMore
                                              ? null
                                              : () {
                                                  setState(() => _page += 1);
                                                  _fetchPage(reset: false);
                                                },
                                          child: _isLoadingMore
                                              ? const SizedBox(
                                                  width: 18,
                                                  height: 18,
                                                  child:
                                                      CircularProgressIndicator(
                                                    strokeWidth: 2,
                                                  ),
                                                )
                                              : const Text(
                                                  'Load More Products',
                                                ),
                                        ),
                                      ),
                                    ],
                                  ],
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
