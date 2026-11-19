import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/app_config.dart';
import '../networking/api_client.dart';
import '../storage/secure_token_storage.dart';

final appConfigProvider = Provider<AppConfig>((ref) {
  return AppConfig.fromEnvironment();
});

final secureTokenStorageProvider = Provider<SecureTokenStorage>((ref) {
  return const SecureTokenStorage();
});

final supabaseClientProvider = Provider<SupabaseClient?>((ref) {
  final config = ref.watch(appConfigProvider);
  if (!config.isSupabaseConfigured) return null;
  return Supabase.instance.client;
});

final apiClientProvider = Provider<SiragroApiClient>((ref) {
  final config = ref.watch(appConfigProvider);
  final storage = ref.watch(secureTokenStorageProvider);
  final supabase = ref.watch(supabaseClientProvider);

  return SiragroApiClient(
    config: config,
    tokenStorage: storage,
    accessTokenProvider: () => supabase?.auth.currentSession?.accessToken,
  );
});
