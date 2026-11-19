import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Stores the server-issued signed guest basket token in encrypted device storage
/// (Android Keystore / iOS Keychain) — never in plain SharedPreferences.
class SecureTokenStorage {
  static const _guestTokenKey = 'siragro_signed_guest_token';

  final FlutterSecureStorage _storage;

  const SecureTokenStorage([
    this._storage = const FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
    ),
  ]);

  Future<String?> readGuestToken() => _storage.read(key: _guestTokenKey);

  Future<void> saveGuestToken(String token) =>
      _storage.write(key: _guestTokenKey, value: token);

  Future<void> clearGuestToken() => _storage.delete(key: _guestTokenKey);
}
