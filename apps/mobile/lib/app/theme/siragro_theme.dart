import 'package:flutter/material.dart';

/// SIRAGRO Brand Design Tokens — verified against src/app/globals.css.
class SiragroColors {
  static const Color brand = Color(0xFF323C4B);
  static const Color brandDark = Color(0xFF242C37);
  static const Color brandDarker = Color(0xFF1B2129);
  static const Color brandLight = Color(0xFF414E60);
  static const Color brandTint = Color(0xFFF1F4F8);
  static const Color brandMuted = Color(0xFFE4E9F0);

  static const Color background = Color(0xFFFFFFFF);
  static const Color surfaceMuted = Color(0xFFF4F6F9);
  static const Color textPrimary = Color(0xFF1E2530);
  static const Color textMuted = Color(0xFF64748B);
  static const Color border = Color(0xFFCBD5E1);

  static const Color accentGreen = Color(0xFF15803D);
  static const Color accentGold = Color(0xFFD97706);
  static const Color accentRed = Color(0xFFB91C1C);
}

class SiragroTheme {
  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: SiragroColors.brand,
      primary: SiragroColors.brand,
      onPrimary: Colors.white,
      secondary: SiragroColors.brandLight,
      onSecondary: Colors.white,
      error: SiragroColors.accentRed,
      surface: SiragroColors.background,
      onSurface: SiragroColors.textPrimary,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: SiragroColors.surfaceMuted,
      appBarTheme: const AppBarTheme(
        backgroundColor: SiragroColors.brand,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.2,
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: SiragroColors.border, width: 1.2),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: SiragroColors.brand,
          foregroundColor: Colors.white,
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: SiragroColors.brand,
          minimumSize: const Size(48, 48),
          side: const BorderSide(color: SiragroColors.brand, width: 1.4),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: SiragroColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: SiragroColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: SiragroColors.brand, width: 2),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: SiragroColors.brandMuted,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final isSelected = states.contains(WidgetState.selected);
          return TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected ? SiragroColors.brand : SiragroColors.textMuted,
          );
        }),
      ),
    );
  }
}
