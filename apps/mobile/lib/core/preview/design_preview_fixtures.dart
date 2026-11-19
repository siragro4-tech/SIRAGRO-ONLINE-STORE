import '../../shared/models/category.dart';
import '../../shared/models/fulfilment.dart';
import '../../shared/models/product.dart';

/// Development-only sample fixtures for visual UI preview (`kDebugMode && SIRAGRO_DESIGN_PREVIEW=true`).
/// Clearly fictional sample entries; never used in normal or release builds.
class DesignPreviewFixtures {
  static const List<StoreCategory> categories = [
    StoreCategory(id: 'demo-cat-1', name: 'Fresh Produce', slug: 'fresh-produce', sortOrder: 1),
    StoreCategory(id: 'demo-cat-2', name: 'Bakery', slug: 'bakery', sortOrder: 2),
    StoreCategory(id: 'demo-cat-3', name: 'Dairy & Eggs', slug: 'dairy-eggs', sortOrder: 3),
    StoreCategory(id: 'demo-cat-4', name: 'Cupboard', slug: 'cupboard', sortOrder: 4),
    StoreCategory(id: 'demo-cat-5', name: 'Off-Licence', slug: 'off-licence', sortOrder: 5),
  ];

  static const List<Product> products = [
    Product(
      id: 'demo-prod-1',
      name: 'Sample Heritage Tomatoes',
      slug: 'sample-heritage-tomatoes',
      description: 'Sample preview item for layout testing only.',
      price: 2.40,
      unit: '400g punnet',
      brand: 'Sample Farm',
      stockQuantity: 14,
      isAvailable: true,
      isAgeRestricted: false,
      category: StoreCategory(id: 'demo-cat-1', name: 'Fresh Produce', slug: 'fresh-produce'),
    ),
    Product(
      id: 'demo-prod-2',
      name: 'Sample Stoneground Sourdough Loaf',
      slug: 'sample-sourdough-loaf',
      description: 'Sample preview item for layout testing only.',
      price: 2.85,
      compareAtPrice: 3.20,
      unit: '800g loaf',
      brand: 'Sample Bakery',
      stockQuantity: 4,
      isAvailable: true,
      isAgeRestricted: false,
      category: StoreCategory(id: 'demo-cat-2', name: 'Bakery', slug: 'bakery'),
    ),
    Product(
      id: 'demo-prod-3',
      name: 'Sample Free-Range Eggs (6 Pack)',
      slug: 'sample-free-range-eggs',
      description: 'Sample preview item for layout testing only.',
      price: 1.95,
      unit: '6 large',
      brand: 'Sample Dairy',
      stockQuantity: 18,
      isAvailable: true,
      isAgeRestricted: false,
      category: StoreCategory(id: 'demo-cat-3', name: 'Dairy & Eggs', slug: 'dairy-eggs'),
    ),
    Product(
      id: 'demo-prod-4',
      name: 'Sample Vintage Reserve (18+ Preview)',
      slug: 'sample-vintage-reserve',
      description: 'Sample preview item showing Challenge 25 badge layout.',
      price: 8.50,
      unit: '750ml',
      brand: 'Sample Cellar',
      stockQuantity: 6,
      isAvailable: true,
      isAgeRestricted: true,
      minimumAge: 18,
      category: StoreCategory(id: 'demo-cat-5', name: 'Off-Licence', slug: 'off-licence'),
    ),
  ];

  static const FulfilmentAvailability fulfilment = FulfilmentAvailability(
    settingsLoaded: true,
    deliveryAvailable: false,
    collectionAvailable: true,
    deliveryUnavailableReason:
        'Design preview: Home delivery stays disabled until store pricing is confirmed.',
    pricingConfirmed: false,
  );
}
