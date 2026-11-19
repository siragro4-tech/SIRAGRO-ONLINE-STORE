/// Environment-specific configuration injected via --dart-define.
/// Never stores backend secrets (service_role, Stripe secret, Resend key).
class AppConfig {
  final String environment;
  final String apiBaseUrl;
  final String supabaseUrl;
  final String supabaseAnonKey;
  final String appScheme;

  const AppConfig({
    required this.environment,
    required this.apiBaseUrl,
    required this.supabaseUrl,
    required this.supabaseAnonKey,
    required this.appScheme,
  });

  factory AppConfig.fromEnvironment() {
    return const AppConfig(
      environment: String.fromEnvironment('SIRAGRO_ENV', defaultValue: 'unconfigured'),
      apiBaseUrl: String.fromEnvironment('SIRAGRO_API_BASE_URL', defaultValue: ''),
      supabaseUrl: String.fromEnvironment('SIRAGRO_SUPABASE_URL', defaultValue: ''),
      supabaseAnonKey: String.fromEnvironment('SIRAGRO_SUPABASE_ANON_KEY', defaultValue: ''),
      appScheme: String.fromEnvironment('SIRAGRO_APP_SCHEME', defaultValue: 'siragro'),
    );
  }

  bool get isSupabaseConfigured =>
      supabaseUrl.isNotEmpty &&
      supabaseAnonKey.isNotEmpty &&
      !supabaseUrl.contains('your-staging-project') &&
      !supabaseAnonKey.contains('your-staging-supabase');

  bool get isApiConfigured =>
      apiBaseUrl.isNotEmpty &&
      !apiBaseUrl.contains('your-staging-siragro-domain');

  bool get isStoreConnected => isSupabaseConfigured && isApiConfigured;

  Uri get passwordResetRedirectUri => Uri.parse('$appScheme://auth/reset-password');
  Uri get emailVerifyRedirectUri => Uri.parse('$appScheme://auth/callback');
}
