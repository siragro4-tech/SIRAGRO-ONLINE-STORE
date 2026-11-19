class FulfilmentAvailability {
  final bool settingsLoaded;
  final bool deliveryAvailable;
  final bool collectionAvailable;
  final String? deliveryUnavailableReason;
  final String? collectionUnavailableReason;
  final bool pricingConfirmed;

  const FulfilmentAvailability({
    required this.settingsLoaded,
    required this.deliveryAvailable,
    required this.collectionAvailable,
    this.deliveryUnavailableReason,
    this.collectionUnavailableReason,
    required this.pricingConfirmed,
  });

  /// Fail-closed default when settings have not been verified from the server.
  const FulfilmentAvailability.unverified()
      : settingsLoaded = false,
        deliveryAvailable = false,
        collectionAvailable = false,
        deliveryUnavailableReason =
            'Delivery settings could not be verified from the server.',
        collectionUnavailableReason =
            'Store collection availability could not be verified from the server.',
        pricingConfirmed = false;

  factory FulfilmentAvailability.fromJson(Map<String, dynamic> json) {
    return FulfilmentAvailability(
      settingsLoaded: json['settingsLoaded'] == true,
      deliveryAvailable: json['deliveryAvailable'] == true,
      collectionAvailable: json['collectionAvailable'] == true,
      deliveryUnavailableReason: json['deliveryUnavailableReason']?.toString(),
      collectionUnavailableReason:
          json['collectionUnavailableReason']?.toString(),
      pricingConfirmed: json['pricingConfirmed'] == true,
    );
  }
}

class DeliveryCalculation {
  final bool isEligible;
  final double? distanceMiles;
  final double deliveryFee;
  final bool isFreeDelivery;
  final String? reason;
  final String shopPostcode;

  const DeliveryCalculation({
    required this.isEligible,
    this.distanceMiles,
    required this.deliveryFee,
    required this.isFreeDelivery,
    this.reason,
    required this.shopPostcode,
  });

  factory DeliveryCalculation.fromJson(Map<String, dynamic> json) {
    return DeliveryCalculation(
      isEligible: json['isEligible'] == true,
      distanceMiles: (json['distanceMiles'] as num?)?.toDouble(),
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 0.0,
      isFreeDelivery: json['isFreeDelivery'] == true,
      reason: json['reason']?.toString(),
      shopPostcode: json['shopPostcode']?.toString() ?? 'UB3 4NS',
    );
  }
}
