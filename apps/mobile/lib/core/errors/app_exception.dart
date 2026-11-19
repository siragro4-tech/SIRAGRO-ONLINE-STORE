class AppException implements Exception {
  final String message;
  final int? statusCode;
  final bool isBlockedByPolicy;

  const AppException(
    this.message, {
    this.statusCode,
    this.isBlockedByPolicy = false,
  });

  @override
  String toString() => message;
}
