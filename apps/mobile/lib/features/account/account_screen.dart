import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../app/theme/siragro_theme.dart';
import '../../core/providers/app_providers.dart';
import '../auth/auth_controller.dart';

class _CustomerAccountDetails {
  final String? fullName;
  final String? phone;
  final List<Map<String, dynamic>> addresses;

  const _CustomerAccountDetails({
    this.fullName,
    this.phone,
    this.addresses = const [],
  });
}

final customerAccountDetailsProvider =
    FutureProvider.autoDispose<_CustomerAccountDetails>((ref) async {
  final auth = ref.watch(authControllerProvider);
  final config = ref.watch(appConfigProvider);
  if (!auth.isAuthenticated ||
      !config.isSupabaseConfigured ||
      config.isDesignPreview ||
      auth.user == null) {
    return const _CustomerAccountDetails();
  }

  final client = Supabase.instance.client;
  final userId = auth.user!.id;

  final profileFuture = client
      .from('profiles')
      .select('first_name, last_name, phone')
      .eq('id', userId)
      .maybeSingle();
  final addressesFuture = client
      .from('addresses')
      .select('id, label, address_line_1, city, postcode, is_default')
      .eq('profile_id', userId)
      .order('is_default', ascending: false);

  final results = await Future.wait([profileFuture, addressesFuture]);
  final profile = results[0] as Map<String, dynamic>?;
  final addresses = (results[1] as List<dynamic>? ?? const [])
      .whereType<Map<String, dynamic>>()
      .toList();

  final first = (profile?['first_name'] as String?)?.trim() ?? '';
  final last = (profile?['last_name'] as String?)?.trim() ?? '';
  final fullName = [first, last].where((s) => s.isNotEmpty).join(' ');

  return _CustomerAccountDetails(
    fullName: fullName.isEmpty ? null : fullName,
    phone: (profile?['phone'] as String?)?.trim(),
    addresses: addresses,
  );
});

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final detailsAsync = ref.watch(customerAccountDetailsProvider);
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('My Account')),
      body: ListView(
        padding: const EdgeInsets.all(SiragroSpacing.md),
        children: [
          Container(
            padding: const EdgeInsets.all(SiragroSpacing.lg),
            decoration: BoxDecoration(
              color: SiragroColors.brand,
              borderRadius: BorderRadius.circular(18),
            ),
            child: auth.isAuthenticated
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'CUSTOMER ACCOUNT',
                        style: textTheme.labelSmall?.copyWith(
                          color: SiragroColors.brassSoft,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 6),
                      if (detailsAsync.valueOrNull?.fullName != null) ...[
                        Text(
                          detailsAsync.valueOrNull!.fullName!,
                          style: textTheme.titleLarge?.copyWith(
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                      ],
                      Text(
                        auth.user?.email ?? '',
                        style: textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.9),
                        ),
                      ),
                      if (detailsAsync.valueOrNull?.phone != null &&
                          detailsAsync.valueOrNull!.phone!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          detailsAsync.valueOrNull!.phone!,
                          style: textTheme.bodySmall?.copyWith(
                            color: Colors.white.withValues(alpha: 0.78),
                          ),
                        ),
                      ],
                      const SizedBox(height: SiragroSpacing.md),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: SiragroColors.brand,
                              ),
                              onPressed: () => context.push('/orders'),
                              icon: const Icon(Icons.receipt_long_rounded),
                              label: const Text('My Orders'),
                            ),
                          ),
                          const SizedBox(width: SiragroSpacing.sm),
                          OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white,
                              side: BorderSide(
                                color: Colors.white.withValues(alpha: 0.45),
                              ),
                            ),
                            onPressed: () => ref
                                .read(authControllerProvider.notifier)
                                .signOut(),
                            child: const Text('Sign Out'),
                          ),
                        ],
                      ),
                    ],
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'GUEST SHOPPER',
                        style: textTheme.labelSmall?.copyWith(
                          color: SiragroColors.brassSoft,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Welcome to SIRAGRO',
                        style: textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Sign in or create an account to view your order history, saved addresses, and sync your basket.',
                        style: textTheme.bodyMedium?.copyWith(
                          color: Colors.white.withValues(alpha: 0.86),
                        ),
                      ),
                      const SizedBox(height: SiragroSpacing.md),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: SiragroColors.brand,
                              ),
                              onPressed: () => context.push('/auth/sign-in'),
                              child: const Text('Sign In'),
                            ),
                          ),
                          const SizedBox(width: SiragroSpacing.sm),
                          Expanded(
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.white,
                                side: BorderSide(
                                  color: Colors.white.withValues(alpha: 0.45),
                                ),
                              ),
                              onPressed: () => context.push('/auth/register'),
                              child: const Text('Register'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
          ),
          if (auth.isAuthenticated &&
              (detailsAsync.valueOrNull?.addresses.isNotEmpty ?? false)) ...[
            const SizedBox(height: SiragroSpacing.lg),
            Text(
              'Saved Delivery Addresses',
              style: textTheme.labelLarge?.copyWith(
                color: SiragroColors.textMuted,
              ),
            ),
            const SizedBox(height: SiragroSpacing.sm),
            Card(
              child: Column(
                children: detailsAsync.valueOrNull!.addresses.map((addr) {
                  final label = (addr['label'] as String?)?.trim();
                  final line1 = (addr['address_line_1'] as String?) ?? '';
                  final city = (addr['city'] as String?) ?? '';
                  final postcode = (addr['postcode'] as String?) ?? '';
                  final isDefault = addr['is_default'] == true;
                  return ListTile(
                    leading: const Icon(
                      Icons.location_on_outlined,
                      color: SiragroColors.brand,
                    ),
                    title: Text(
                      label?.isNotEmpty == true ? label! : line1,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    subtitle: Text('$line1, $city $postcode'.trim()),
                    trailing: isDefault
                        ? const Chip(label: Text('Default'))
                        : null,
                  );
                }).toList(),
              ),
            ),
          ],
          const SizedBox(height: SiragroSpacing.lg),
          Text(
            'Store & Customer Care',
            style: textTheme.labelLarge?.copyWith(
              color: SiragroColors.textMuted,
            ),
          ),
          const SizedBox(height: SiragroSpacing.sm),
          Card(
            child: Column(
              children: [
                _AccountLinkTile(
                  icon: Icons.local_shipping_outlined,
                  title: 'Delivery & Collection Info',
                  onTap: () => context.push('/support/delivery'),
                ),
                const Divider(height: 1),
                _AccountLinkTile(
                  icon: Icons.storefront_outlined,
                  title: 'About SIRAGRO',
                  onTap: () => context.push('/support/about'),
                ),
                const Divider(height: 1),
                _AccountLinkTile(
                  icon: Icons.phone_outlined,
                  title: 'Contact Store',
                  onTap: () => context.push('/support/contact'),
                ),
                const Divider(height: 1),
                _AccountLinkTile(
                  icon: Icons.privacy_tip_outlined,
                  title: 'Privacy Policy',
                  onTap: () => context.push('/support/privacy'),
                ),
                const Divider(height: 1),
                _AccountLinkTile(
                  icon: Icons.description_outlined,
                  title: 'Terms & Conditions',
                  onTap: () => context.push('/support/terms'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AccountLinkTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _AccountLinkTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: SiragroColors.surfaceWarm,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 19, color: SiragroColors.brand),
      ),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
      trailing: const Icon(
        Icons.chevron_right_rounded,
        color: SiragroColors.textMuted,
      ),
      onTap: onTap,
    );
  }
}
