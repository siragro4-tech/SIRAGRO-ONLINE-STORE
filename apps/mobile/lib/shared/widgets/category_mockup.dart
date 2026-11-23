import 'package:flutter/material.dart';
import '../../app/theme/siragro_theme.dart';

/// Matches the website's `CategoryMockup` gradient fallback cards in
/// `src/components/products/ProductCard.tsx` when a product does not yet
/// have an uploaded photo in Supabase Storage.
class CategoryMockupCard extends StatelessWidget {
  final String? categorySlug;
  final String? brand;
  final double iconSize;

  const CategoryMockupCard({
    super.key,
    this.categorySlug,
    this.brand,
    this.iconSize = 42,
  });

  @override
  Widget build(BuildContext context) {
    final style = _resolveStyle(categorySlug, brand);

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: style.colors,
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: iconSize + 24,
                  height: iconSize + 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.14),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.22),
                    ),
                  ),
                  child: Icon(
                    style.icon,
                    size: iconSize,
                    color: Colors.white.withValues(alpha: 0.94),
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text(
                    style.label.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: style.accent,
                      fontSize: 9.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.1,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static _MockupStyle _resolveStyle(String? slug, String? brand) {
    final cleanBrand = (brand != null && brand.trim().isNotEmpty)
        ? brand.trim()
        : null;

    switch (slug) {
      case 'fresh-produce':
        return _MockupStyle(
          colors: const [Color(0xFF1E3A2E), Color(0xFF2D5A3D)],
          accent: const Color(0xFF86EFAC),
          label: cleanBrand ?? 'FARM FRESH',
          icon: Icons.eco_outlined,
        );
      case 'dairy-eggs':
        return _MockupStyle(
          colors: const [Color(0xFF1A2D4A), Color(0xFF243C5E)],
          accent: const Color(0xFF93C5FD),
          label: cleanBrand ?? 'COUNTRY PURE',
          icon: Icons.egg_alt_outlined,
        );
      case 'bakery':
        return _MockupStyle(
          colors: const [Color(0xFF3D2A0E), Color(0xFF5A3D14)],
          accent: const Color(0xFFFCD34D),
          label: cleanBrand ?? 'FRESHLY BAKED',
          icon: Icons.bakery_dining_outlined,
        );
      case 'meat-fish':
        return _MockupStyle(
          colors: const [Color(0xFF3B1212), Color(0xFF5A1A1A)],
          accent: const Color(0xFFFCA5A5),
          label: cleanBrand ?? 'PRIME CUT',
          icon: Icons.set_meal_outlined,
        );
      case 'off-licence-beverages':
      case 'drinks-off-licence':
      case 'off-licence':
        return _MockupStyle(
          colors: const [Color(0xFF1E1535), Color(0xFF2D1F52)],
          accent: const Color(0xFFC4B5FD),
          label: cleanBrand ?? 'PREMIUM SELECT',
          icon: Icons.wine_bar_outlined,
        );
      case 'cupboard-groceries':
      case 'cupboard':
        return _MockupStyle(
          colors: const [Color(0xFF2D1A06), Color(0xFF4A2D0A)],
          accent: const Color(0xFFFDBA74),
          label: cleanBrand ?? 'PANTRY STAPLE',
          icon: Icons.kitchen_outlined,
        );
      case 'frozen-goods':
        return _MockupStyle(
          colors: const [Color(0xFF0D2540), Color(0xFF153555)],
          accent: const Color(0xFF7DD3FC),
          label: cleanBrand ?? 'FROZEN BEST',
          icon: Icons.ac_unit_rounded,
        );
      case 'household-cleaning':
        return _MockupStyle(
          colors: const [Color(0xFF16333B), Color(0xFF204A56)],
          accent: const Color(0xFF67E8F9),
          label: cleanBrand ?? 'CLEAN & FRESH',
          icon: Icons.cleaning_services_outlined,
        );
      default:
        return _MockupStyle(
          colors: const [SiragroColors.brand, SiragroColors.brandDark],
          accent: SiragroColors.brassSoft,
          label: cleanBrand ?? 'SIRAGRO',
          icon: Icons.shopping_basket_outlined,
        );
    }
  }
}

class _MockupStyle {
  final List<Color> colors;
  final Color accent;
  final String label;
  final IconData icon;

  const _MockupStyle({
    required this.colors,
    required this.accent,
    required this.label,
    required this.icon,
  });
}
