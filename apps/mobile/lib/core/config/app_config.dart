import 'package:flutter/foundation.dart';

/// Environment-specific configuration injected via --dart-define.
/// Never stores backend secrets (service_role, Stripe secret, Resend key).
class AppConfig {
  final String environment;
  final String apiBaseUrl;
  final String supabaseUrl;
  final String supabaseAnonKey;
  final String appScheme;
  final bool designPreviewFlag;

  const AppConfig({
    required this.environment,
    required this.apiBaseUrl,
    required this.supabaseUrl,
    required this.supabaseAnonKey,
    required this.appScheme,
    this.designPreviewFlag = false,
  });

  factory AppConfig.fromEnvironment() {
    return const AppConfig(
      environment: String.fromEnvironment('SIRAGRO_ENV', defaultValue: 'unconfigured'),
      apiBaseUrl: String.fromEnvironment('SIRAGRO_API_BASE_URL', defaultValue: ''),
      supabaseUrl: String.fromEnvironment('SIRAGRO_SUPABASE_URL', defaultValue: ''),
      supabaseAnonKey: String.fromEnvironment('SIRAGRO_SUPABASE_ANON_KEY', defaultValue: ''),
      appScheme: String.fromEnvironment('SIRAGRO_APP_SCHEME', defaultValue: 'siragro'),
      designPreviewFlag: bool.fromEnvironment('SIRAGRO_DESIGN_PREVIEW', defaultValue: false),
    );
  }

  /// Design-preview mode is strictly off by default and ONLY permitted in debug builds.
  /// It can never activate in a release/production build.
  bool get isDesignPreview => kDebugMode && designPreviewFlag;

  bool get isSupabaseConfigured =>
      !isDesignPreview &&
      supabaseUrl.isNotEmpty &&
      supabaseAnonKey.isNotEmpty &&
      !supabaseUrl.contains('your-staging-project') &&
      !supabaseAnonKey.contains('your-staging-supabase');

  bool get isApiConfigured =>
      !isDesignPreview &&
      apiBaseUrl.isNotEmpty &&
      !apiBaseUrl.contains('your-staging-siragro-domain');

  bool get isStoreConnected => isSupabaseConfigured && isApiConfigured;

  Uri get passwordResetRedirectUri => Uri.parse('$appScheme://auth/reset-password');
  Uri get emailVerifyRedirectUri => Uri.parse('$appScheme://auth/callback');
}
