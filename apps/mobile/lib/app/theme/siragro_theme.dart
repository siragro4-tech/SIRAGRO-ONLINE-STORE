import 'package:flutter/material.dart';

/// SIRAGRO Editorial Brand Design Tokens.
/// Preserves the established #323C4B slate/navy identity, paired with
/// warm alabaster neutrals and restrained muted sage & warm brass accents.
class SiragroColors {
  // Core Brand (#323C4B preserved from web storefront)
  static const Color brand = Color(0xFF323C4B);
  static const Color brandDark = Color(0xFF242C37);
  static const Color brandDarker = Color(0xFF1B2129);
  static const Color brandLight = Color(0xFF414E60);
  static const Color brandTint = Color(0xFFF1F4F8);
  static const Color brandMuted = Color(0xFFE4E9F0);

  // Warm Neutrals
  static const Color canvas = Color(0xFFFAF9F6);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceWarm = Color(0xFFF2EFE9);
  static const Color textPrimary = Color(0xFF1E2530);
  static const Color textMuted = Color(0xFF5F6B7A);
  static const Color border = Color(0xFFE5E2DC);
  static const Color borderStrong = Color(0xFFCBD5E1);

  // Restrained Accents
  static const Color sage = Color(0xFF3F6B52);
  static const Color sageTint = Color(0xFFEBF2EE);
  static const Color sageSoft = sageTint;
  static const Color brass = Color(0xFFB08948);
  static const Color brassTint = Color(0xFFF9F3E8);
  static const Color brassSoft = Color(0xFFE6CFA3);
  static const Color accentRed = Color(0xFFB91C1C);
  static const Color accentGreen = sage;
  static const Color accentGold = brass;

  // Compatibility aliases
  static const Color background = surface;
  static const Color surfaceMuted = canvas;
}

class SiragroSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;
}

class SiragroTheme {
  static ThemeData light() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: SiragroColors.brand,
      primary: SiragroColors.brand,
      onPrimary: Colors.white,
      secondary: SiragroColors.sage,
      onSecondary: Colors.white,
      error: SiragroColors.accentRed,
      surface: SiragroColors.surface,
      onSurface: SiragroColors.textPrimary,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: SiragroColors.canvas,
      textTheme: const TextTheme(
        headlineMedium: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.4,
          color: SiragroColors.textPrimary,
          height: 1.2,
        ),
        titleLarge: TextStyle(
          fontSize: 19,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.3,
          color: SiragroColors.textPrimary,
          height: 1.25,
        ),
        titleMedium: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.15,
          color: SiragroColors.textPrimary,
          height: 1.3,
        ),
        bodyLarge: TextStyle(
          fontSize: 15,
          color: SiragroColors.textPrimary,
          height: 1.5,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          color: SiragroColors.textPrimary,
          height: 1.45,
        ),
        bodySmall: TextStyle(
          fontSize: 12.5,
          color: SiragroColors.textMuted,
          height: 1.4,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: SiragroColors.brand,
        foregroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 2,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.2,
        ),
      ),
      cardTheme: CardThemeData(
        color: SiragroColors.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: SiragroColors.border, width: 1),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: SiragroColors.border,
        thickness: 1,
        space: 1,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: SiragroColors.brand,
          foregroundColor: Colors.white,
          elevation: 0,
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.1,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: SiragroColors.brand,
          minimumSize: const Size(48, 48),
          side: const BorderSide(color: SiragroColors.borderStrong, width: 1.2),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: SiragroColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: SiragroColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: SiragroColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: SiragroColors.brand, width: 1.8),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: SiragroColors.surface,
        selectedColor: SiragroColors.brand,
        side: const BorderSide(color: SiragroColors.border),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
        ),
        labelStyle: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: SiragroColors.surface,
        indicatorColor: SiragroColors.surfaceWarm,
        elevation: 0,
        height: 70,
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
