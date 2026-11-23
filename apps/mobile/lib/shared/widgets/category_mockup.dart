import 'package:flutter/material.dart';

/// Faithfully reproduces the website's `CategoryMockup` visual in
/// `src/components/products/ProductCard.tsx` when a product has no uploaded
/// photo (`primaryImageUrl == null`).
class CategoryMockupCard extends StatelessWidget {
  final String? categorySlug;
  final String? brand;
  final double iconSize;

  const CategoryMockupCard({
    super.key,
    this.categorySlug,
    this.brand,
    this.iconSize = 58,
  });

  @override
  Widget build(BuildContext context) {
    final style = _resolveStyle(categorySlug, brand);

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: style.colors,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Subtle 24px dot pattern overlay (matches website opacity-10)
          CustomPaint(
            painter: _DotPatternPainter(),
          ),
          // Soft radial accent glow behind illustration
          Center(
            child: Container(
              width: iconSize * 1.65,
              height: iconSize * 1.65,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    style.accent.withValues(alpha: 0.24),
                    style.accent.withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),
          // Vector illustration + uppercase brand/category label
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: iconSize,
                  height: iconSize,
                  child: CustomPaint(
                    painter: _CategoryVectorPainter(
                      kind: style.kind,
                      accent: style.accent,
                      bgDark: style.colors.last,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Text(
                    style.label.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: style.accent,
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
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
    final cleanBrand =
        (brand != null && brand.trim().isNotEmpty) ? brand.trim() : null;

    switch (slug) {
      case 'fresh-produce':
        return _MockupStyle(
          colors: const [Color(0xFF1E3A2E), Color(0xFF2D5A3D)],
          accent: const Color(0xFF4ADE80),
          label: cleanBrand ?? 'FARM FRESH',
          kind: _VectorKind.produce,
        );
      case 'dairy-eggs':
        return _MockupStyle(
          colors: const [Color(0xFF1A2D4A), Color(0xFF243C5E)],
          accent: const Color(0xFF93C5FD),
          label: cleanBrand ?? 'COUNTRY PURE',
          kind: _VectorKind.dairy,
        );
      case 'bakery':
        return _MockupStyle(
          colors: const [Color(0xFF3D2A0E), Color(0xFF5A3D14)],
          accent: const Color(0xFFFBBF24),
          label: cleanBrand ?? 'FRESHLY BAKED',
          kind: _VectorKind.bakery,
        );
      case 'meat-fish':
        return _MockupStyle(
          colors: const [Color(0xFF3B1212), Color(0xFF5A1A1A)],
          accent: const Color(0xFFF87171),
          label: cleanBrand ?? 'PRIME CUT',
          kind: _VectorKind.meat,
        );
      case 'off-licence-beverages':
      case 'drinks-off-licence':
      case 'off-licence':
        return _MockupStyle(
          colors: const [Color(0xFF1E1535), Color(0xFF2D1F52)],
          accent: const Color(0xFFA78BFA),
          label: cleanBrand ?? 'PREMIUM SELECT',
          kind: _VectorKind.drinks,
        );
      case 'cupboard-groceries':
      case 'cupboard':
        return _MockupStyle(
          colors: const [Color(0xFF2D1A06), Color(0xFF4A2D0A)],
          accent: const Color(0xFFFB923C),
          label: cleanBrand ?? 'PANTRY STAPLE',
          kind: _VectorKind.cupboard,
        );
      case 'frozen-goods':
        return _MockupStyle(
          colors: const [Color(0xFF0D2540), Color(0xFF153555)],
          accent: const Color(0xFF7DD3FC),
          label: cleanBrand ?? 'FROZEN BEST',
          kind: _VectorKind.frozen,
        );
      case 'household-cleaning':
        return _MockupStyle(
          colors: const [Color(0xFF0D3025), Color(0xFF164237)],
          accent: const Color(0xFF34D399),
          label: cleanBrand ?? 'HOME CARE',
          kind: _VectorKind.household,
        );
      default:
        return _MockupStyle(
          colors: const [Color(0xFF1E2A38), Color(0xFF2D3F52)],
          accent: const Color(0xFF94A3B8),
          label: cleanBrand ?? 'QUALITY PICK',
          kind: _VectorKind.qualityPick,
        );
    }
  }
}

enum _VectorKind {
  produce,
  dairy,
  bakery,
  meat,
  drinks,
  cupboard,
  frozen,
  household,
  qualityPick,
}

class _MockupStyle {
  final List<Color> colors;
  final Color accent;
  final String label;
  final _VectorKind kind;

  const _MockupStyle({
    required this.colors,
    required this.accent,
    required this.label,
    required this.kind,
  });
}

class _DotPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.white.withValues(alpha: 0.08);
    const step = 22.0;
    for (double y = 6; y < size.height; y += step) {
      for (double x = 6; x < size.width; x += step) {
        canvas.drawCircle(Offset(x, y), 1.0, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _CategoryVectorPainter extends CustomPainter {
  final _VectorKind kind;
  final Color accent;
  final Color bgDark;

  const _CategoryVectorPainter({
    required this.kind,
    required this.accent,
    required this.bgDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 64.0;
    canvas.save();
    canvas.scale(s, s);

    final white90 = Paint()..color = Colors.white.withValues(alpha: 0.90);
    final white75 = Paint()..color = Colors.white.withValues(alpha: 0.75);
    final white20 = Paint()..color = Colors.white.withValues(alpha: 0.20);
    final whiteStroke = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    switch (kind) {
      case _VectorKind.produce:
        canvas.drawCircle(const Offset(32, 30), 16, white20);
        canvas.drawOval(
          Rect.fromCenter(center: const Offset(32, 32), width: 22, height: 26),
          white90,
        );
        final stem = Path()
          ..moveTo(32, 19)
          ..quadraticBezierTo(36, 13, 42, 15);
        canvas.drawPath(stem, whiteStroke);
        canvas.drawOval(
          Rect.fromCenter(center: const Offset(32, 51), width: 12, height: 4),
          white20,
        );
      case _VectorKind.dairy:
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            const Rect.fromLTWH(22, 18, 20, 32),
            const Radius.circular(5),
          ),
          white90,
        );
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            const Rect.fromLTWH(24, 10, 16, 10),
            const Radius.circular(3),
          ),
          white75,
        );
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            const Rect.fromLTWH(22, 10, 20, 4),
            const Radius.circular(2),
          ),
          Paint()..color = Colors.white,
        );
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            const Rect.fromLTWH(24, 28, 16, 8),
            const Radius.circular(2),
          ),
          Paint()..color = accent.withValues(alpha: 0.8),
        );
        canvas.drawOval(
          Rect.fromCenter(center: const Offset(32, 52), width: 16, height: 5),
          white20,
        );
      case _VectorKind.bakery:
        final dome = Path()
          ..moveTo(12, 40)
          ..quadraticBezierTo(12, 24, 32, 24)
          ..quadraticBezierTo(52, 24, 52, 40)
          ..close();
        canvas.drawPath(dome, white75);
        canvas.drawOval(
          Rect.fromCenter(center: const Offset(32, 40), width: 40, height: 20),
          white90,
        );
        final scorePaint = Paint()
          ..color = bgDark
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.0
          ..strokeCap = StrokeCap.round;
        canvas.drawPath(
          Path()
            ..moveTo(18, 32)
            ..quadraticBezierTo(23, 26, 28, 32),
          scorePaint,
        );
        canvas.drawPath(
          Path()
            ..moveTo(36, 30)
            ..quadraticBezierTo(41, 24, 46, 30),
          scorePaint,
        );
      case _VectorKind.meat:
        canvas.drawLine(
          const Offset(29, 16),
          const Offset(29, 27),
          whiteStroke..strokeWidth = 3.5,
        );
        canvas.drawLine(
          const Offset(35, 13),
          const Offset(35, 27),
          whiteStroke..strokeWidth = 3.5,
        );
        canvas.drawOval(
          Rect.fromCenter(center: const Offset(32, 13), width: 10, height: 5),
          white75,
        );
        canvas.drawOval(
          Rect.fromCenter(center: const Offset(32, 36), width: 36, height: 24),
          white90,
        );
        canvas.drawOval(
          Rect.fromCenter(center: const Offset(32, 36), width: 24, height: 14),
          Paint()..color = accent.withValues(alpha: 0.6),
        );
      case _VectorKind.drinks:
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            const Rect.fromLTWH(27, 8, 10, 8),
            const Radius.circular(2),
          ),
          white75,
        );
        final bottle = Path()
          ..moveTo(27, 16)
          ..lineTo(23, 24)
          ..lineTo(23, 50)
          ..quadraticBezierTo(23, 54, 32, 54)
          ..quadraticBezierTo(41, 54, 41, 50)
          ..lineTo(41, 24)
          ..lineTo(37, 16)
          ..close();
        canvas.drawPath(bottle, white90);
        canvas.drawOval(
          Rect.fromCenter(center: const Offset(32, 43), width: 12, height: 16),
          Paint()..color = accent.withValues(alpha: 0.45),
        );
      case _VectorKind.cupboard:
        canvas.drawRect(const Rect.fromLTWH(19, 18, 26, 26), white90);
        canvas.drawOval(
          Rect.fromCenter(center: const Offset(32, 18), width: 26, height: 9),
          white90,
        );
        canvas.drawOval(
          Rect.fromCenter(center: const Offset(32, 44), width: 26, height: 9),
          white90,
        );
        canvas.drawRect(
          const Rect.fromLTWH(19, 25, 26, 8),
          Paint()..color = accent.withValues(alpha: 0.4),
        );
      case _VectorKind.frozen:
        canvas.drawCircle(const Offset(32, 32), 20, white20);
        canvas.drawLine(
          const Offset(32, 14),
          const Offset(32, 50),
          whiteStroke..strokeWidth = 3.0,
        );
        canvas.drawLine(
          const Offset(14, 32),
          const Offset(50, 32),
          whiteStroke..strokeWidth = 3.0,
        );
        canvas.drawLine(
          const Offset(18, 18),
          const Offset(46, 46),
          whiteStroke..strokeWidth = 2.5,
        );
        canvas.drawLine(
          const Offset(46, 18),
          const Offset(18, 46),
          whiteStroke..strokeWidth = 2.5,
        );
        canvas.drawCircle(const Offset(32, 32), 5, Paint()..color = Colors.white);
      case _VectorKind.household:
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            const Rect.fromLTWH(28, 26, 16, 24),
            const Radius.circular(4),
          ),
          white90,
        );
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            const Rect.fromLTWH(30, 18, 10, 10),
            const Radius.circular(3),
          ),
          white75,
        );
        canvas.drawPath(
          Path()
            ..moveTo(30, 23)
            ..lineTo(18, 23)
            ..lineTo(18, 30)
            ..lineTo(13, 30),
          whiteStroke,
        );
        canvas.drawCircle(const Offset(11, 28), 1.5, white90);
        canvas.drawCircle(const Offset(9, 24), 1.5, white75);
      case _VectorKind.qualityPick:
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            const Rect.fromLTWH(14, 22, 36, 30),
            const Radius.circular(5),
          ),
          white90,
        );
        canvas.drawPath(
          Path()
            ..moveTo(22, 22)
            ..cubicTo(22, 14, 42, 14, 42, 22),
          whiteStroke..strokeWidth = 3.0,
        );
        final checkPaint = Paint()
          ..color = bgDark
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3.0
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round;
        canvas.drawPath(
          Path()
            ..moveTo(23, 34)
            ..lineTo(29, 40)
            ..lineTo(41, 28),
          checkPaint,
        );
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(_CategoryVectorPainter oldDelegate) =>
      oldDelegate.kind != kind || oldDelegate.accent != accent;
}
