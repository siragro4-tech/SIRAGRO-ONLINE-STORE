class StoreCategory {
  final String id;
  final String name;
  final String slug;
  final String? icon;
  final int sortOrder;

  const StoreCategory({
    required this.id,
    required this.name,
    required this.slug,
    this.icon,
    this.sortOrder = 0,
  });

  factory StoreCategory.fromJson(Map<String, dynamic> json) {
    return StoreCategory(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      icon: json['icon']?.toString(),
      sortOrder: (json['sort_order'] as num?)?.toInt() ??
          (json['sortOrder'] as num?)?.toInt() ??
          0,
    );
  }
}
