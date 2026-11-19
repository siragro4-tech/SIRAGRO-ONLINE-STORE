import 'product.dart';

class BasketItem {
  final String productId;
  final int quantity;
  final double lineTotal;
  final Product product;

  const BasketItem({
    required this.productId,
    required this.quantity,
    required this.lineTotal,
    required this.product,
  });

  factory BasketItem.fromJson(Map<String, dynamic> json) {
    return BasketItem(
      productId: json['productId']?.toString() ?? '',
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      lineTotal: (json['lineTotal'] as num?)?.toDouble() ?? 0.0,
      product: Product.fromJson(
        (json['product'] as Map<String, dynamic>?) ?? const {},
      ),
    );
  }
}

class BasketSummary {
  final List<BasketItem> items;
  final int itemCount;
  final double subtotal;
  final bool hasAgeRestrictedItems;
  final String? error;

  const BasketSummary({
    this.items = const [],
    this.itemCount = 0,
    this.subtotal = 0.0,
    this.hasAgeRestrictedItems = false,
    this.error,
  });

  factory BasketSummary.fromJson(Map<String, dynamic> json) {
    final rawItems = (json['items'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(BasketItem.fromJson)
        .toList();

    return BasketSummary(
      items: rawItems,
      itemCount: (json['itemCount'] as num?)?.toInt() ?? 0,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      hasAgeRestrictedItems: json['hasAgeRestrictedItems'] == true,
      error: json['error']?.toString(),
    );
  }
}
