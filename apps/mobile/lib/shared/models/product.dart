import 'category.dart';

class ProductImageItem {
  final String id;
  final String url;
  final String? altText;
  final bool isPrimary;

  const ProductImageItem({
    required this.id,
    required this.url,
    this.altText,
    this.isPrimary = false,
  });

  factory ProductImageItem.fromJson(Map<String, dynamic> json) {
    return ProductImageItem(
      id: json['id']?.toString() ?? '',
      url: json['url']?.toString() ?? '',
      altText: json['altText']?.toString(),
      isPrimary: json['isPrimary'] == true,
    );
  }
}

class Product {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final double price;
  final double? compareAtPrice;
  final String? unit;
  final String? brand;
  final int stockQuantity;
  final bool isAvailable;
  final bool isAgeRestricted;
  final int minimumAge;
  final StoreCategory? category;
  final String? primaryImageUrl;
  final List<ProductImageItem> images;

  const Product({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    required this.price,
    this.compareAtPrice,
    this.unit,
    this.brand,
    required this.stockQuantity,
    required this.isAvailable,
    required this.isAgeRestricted,
    this.minimumAge = 18,
    this.category,
    this.primaryImageUrl,
    this.images = const [],
  });

  bool get isOutOfStock => !isAvailable || stockQuantity <= 0;
  bool get isLowStock => !isOutOfStock && stockQuantity < 5;
  bool get hasDiscount => compareAtPrice != null && compareAtPrice! > price;

  factory Product.fromJson(Map<String, dynamic> json) {
    final imagesList = (json['images'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(ProductImageItem.fromJson)
        .toList();

    return Product(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      description: json['description']?.toString(),
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      compareAtPrice: (json['compareAtPrice'] as num?)?.toDouble(),
      unit: json['unit']?.toString(),
      brand: json['brand']?.toString(),
      stockQuantity: (json['stockQuantity'] as num?)?.toInt() ?? 0,
      isAvailable: json['isAvailable'] != false,
      isAgeRestricted: json['isAgeRestricted'] == true,
      minimumAge: (json['minimumAge'] as num?)?.toInt() ?? 18,
      category: json['category'] is Map<String, dynamic>
          ? StoreCategory.fromJson(json['category'] as Map<String, dynamic>)
          : null,
      primaryImageUrl: json['primaryImageUrl']?.toString(),
      images: imagesList,
    );
  }
}
