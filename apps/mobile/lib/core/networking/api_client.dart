import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../errors/app_exception.dart';
import '../storage/secure_token_storage.dart';

typedef AccessTokenProvider = String? Function();

/// HTTP client for SIRAGRO's versioned /api/v1/* endpoints.
class SiragroApiClient {
  static const String guestTokenHeader = 'x-siragro-guest-token';

  final AppConfig config;
  final http.Client _http;
  final SecureTokenStorage _tokenStorage;
  final AccessTokenProvider _accessTokenProvider;

  SiragroApiClient({
    required this.config,
    required SecureTokenStorage tokenStorage,
    required AccessTokenProvider accessTokenProvider,
    http.Client? httpClient,
  })  : _tokenStorage = tokenStorage,
        _accessTokenProvider = accessTokenProvider,
        _http = httpClient ?? http.Client();

  Uri _buildUri(String path, [Map<String, String>? query]) {
    final base = config.apiBaseUrl.replaceAll(RegExp(r'/+$'), '');
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$base$normalizedPath').replace(queryParameters: query);
  }

  Future<Map<String, String>> _buildHeaders() async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    final jwt = _accessTokenProvider();
    if (jwt != null && jwt.isNotEmpty) {
      headers['Authorization'] = 'Bearer $jwt';
    } else {
      final guestToken = await _tokenStorage.readGuestToken();
      if (guestToken != null && guestToken.isNotEmpty) {
        headers[guestTokenHeader] = guestToken;
      }
    }

    return headers;
  }

  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, String>? query,
  }) async {
    _ensureConfigured();
    final response = await _http.get(
      _buildUri(path, query),
      headers: await _buildHeaders(),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    _ensureConfigured();
    final response = await _http.post(
      _buildUri(path),
      headers: await _buildHeaders(),
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> patch(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    _ensureConfigured();
    final response = await _http.patch(
      _buildUri(path),
      headers: await _buildHeaders(),
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> delete(String path) async {
    _ensureConfigured();
    final response = await _http.delete(
      _buildUri(path),
      headers: await _buildHeaders(),
    );
    return _handleResponse(response);
  }

  void _ensureConfigured() {
    if (!config.isApiConfigured) {
      throw const AppException(
        'Store API URL is not configured. Connect a staging environment in .env / --dart-define.',
        statusCode: 503,
        isBlockedByPolicy: true,
      );
    }
  }

  Future<Map<String, dynamic>> _handleResponse(http.Response response) async {
    final newGuestToken = response.headers[guestTokenHeader];
    if (newGuestToken != null && newGuestToken.isNotEmpty) {
      await _tokenStorage.saveGuestToken(newGuestToken);
    }

    Map<String, dynamic> decoded = {};
    if (response.body.isNotEmpty) {
      try {
        final raw = jsonDecode(response.body);
        if (raw is Map<String, dynamic>) {
          decoded = raw;
        }
      } catch (_) {
        // Non-JSON response body handled below
      }
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    }

    final message = decoded['error']?.toString() ??
        'Request failed (${response.statusCode}). Please try again.';
    final blocked = decoded['checkoutBlocked'] == true || response.statusCode == 503;

    throw AppException(
      message,
      statusCode: response.statusCode,
      isBlockedByPolicy: blocked,
    );
  }
}
