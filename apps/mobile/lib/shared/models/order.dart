class OrderLineItemSnapshot {
  final String id;
  final String? productId;
  final String name;
  final double unitPrice;
  final int quantity;
  final double lineTotal;

  const OrderLineItemSnapshot({
    required this.id,
    this.productId,
    required this.name,
    required this.unitPrice,
    required this.quantity,
    required this.lineTotal,
  });

  factory OrderLineItemSnapshot.fromJson(Map<String, dynamic> json) {
    return OrderLineItemSnapshot(
      id: json['id']?.toString() ?? '',
      productId: json['productId']?.toString(),
      name: json['name']?.toString() ?? '',
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      lineTotal: (json['lineTotal'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class CustomerOrder {
  final String id;
  final String orderNumber;
  final String status;
  final String paymentStatus;
  final String fulfilmentType;
  final double subtotal;
  final double deliveryCharge;
  final double total;
  final DateTime? createdAt;
  final Map<String, dynamic>? deliveryAddress;
  final List<OrderLineItemSnapshot> items;

  const CustomerOrder({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.fulfilmentType,
    required this.subtotal,
    required this.deliveryCharge,
    required this.total,
    this.createdAt,
    this.deliveryAddress,
    this.items = const [],
  });

  factory CustomerOrder.fromJson(Map<String, dynamic> json) {
    final rawItems = (json['items'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(OrderLineItemSnapshot.fromJson)
        .toList();

    return CustomerOrder(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber']?.toString() ?? '',
      status: json['status']?.toString() ?? 'pending',
      paymentStatus: json['paymentStatus']?.toString() ?? 'unpaid',
      fulfilmentType: json['fulfilmentType']?.toString() ?? 'collection',
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      deliveryCharge: (json['deliveryCharge'] as num?)?.toDouble() ?? 0.0,
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      deliveryAddress: json['deliveryAddress'] is Map<String, dynamic>
          ? json['deliveryAddress'] as Map<String, dynamic>
          : null,
      items: rawItems,
    );
  }
}
