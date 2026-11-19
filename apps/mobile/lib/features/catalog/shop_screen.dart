import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/errors/app_exception.dart';
import '../../core/providers/app_providers.dart';
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

  @override
  Widget build(BuildContext context) {
    final homeAsync = ref.watch(homeDataProvider);
    final categories = homeAsync.valueOrNull?.categories ?? const [];

    return Scaffold(
      appBar: AppBar(title: const Text('Shop Catalogue')),
      body: Column(
        children: [
          // Search & Filter controls
          Container(
            color: Colors.white,
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
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchCtrl.text.isNotEmpty
                        ? IconButton(
                            tooltip: 'Clear search',
                            onPressed: () {
                              _searchCtrl.clear();
                              _fetchPage(reset: true);
                            },
                            icon: const Icon(Icons.clear),
                          )
                        : null,
                  ),
                ),
                const SizedBox(height: 10),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      // Sort selector
                      DropdownButton<String>(
                        value: _sort,
                        underline: const SizedBox.shrink(),
                        items: const [
                          DropdownMenuItem(
                            value: 'featured',
                            child: Text('Sort: Featured'),
                          ),
                          DropdownMenuItem(
                            value: 'price_asc',
                            child: Text('Price: Low to High'),
                          ),
                          DropdownMenuItem(
                            value: 'price_desc',
                            child: Text('Price: High to Low'),
                          ),
                          DropdownMenuItem(
                            value: 'name_asc',
                            child: Text('Name: A–Z'),
                          ),
                        ],
                        onChanged: (val) {
                          if (val == null) return;
                          setState(() => _sort = val);
                          _fetchPage(reset: true);
                        },
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: const Text('In Stock Only'),
                        selected: _inStockOnly,
                        onSelected: (selected) {
                          setState(() => _inStockOnly = selected);
                          _fetchPage(reset: true);
                        },
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
                ? const LoadingStateView(message: 'Loading products…')
                : _error != null
                    ? ErrorRetryView(
                        message: _error!,
                        onRetry: () => _fetchPage(reset: true),
                      )
                    : _items.isEmpty
                        ? EmptyStateView(
                            icon: Icons.search_off,
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
                                        childAspectRatio: 0.62,
                                      ),
                                      itemCount: _items.length,
                                      itemBuilder: (context, index) {
                                        final product = _items[index];
                                        return ProductCard(
                                          product: product,
                                          isAdding:
                                              _addingProductId == product.id,
                                          onTap: () => context.push(
                                            '/product/${product.slug}',
                                          ),
                                          onAddToBasket: () async {
                                            setState(() =>
                                                _addingProductId = product.id);
                                            final err = await ref
                                                .read(basketControllerProvider
                                                    .notifier)
                                                .addItem(product.id);
                                            if (!context.mounted) return;
                                            setState(
                                                () => _addingProductId = null);
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  err ??
                                                      'Added ${product.name} to basket',
                                                ),
                                                duration:
                                                    const Duration(seconds: 2),
                                              ),
                                            );
                                          },
                                        );
                                      },
                                    ),
                                    if (_hasMore) ...[
                                      const SizedBox(height: 16),
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
