import 'package:flutter/material.dart';

class SiragroLogo extends StatelessWidget {
  final double size;

  const SiragroLogo({super.key, this.size = 44});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white,
        border: Border.all(color: Colors.white.withValues(alpha: 0.25), width: 1.5),
      ),
      clipBehavior: Clip.antiAlias,
      child: Image.asset(
        'assets/images/siragro-logo.jpg',
        fit: BoxFit.cover,
        semanticLabel: 'SIRAGRO Supermarket & Off-Licence',
        errorBuilder: (_, __, ___) => const Icon(Icons.storefront),
      ),
    );
  }
}
