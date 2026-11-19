import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/siragro_theme.dart';
import '../auth/auth_controller.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Account')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: auth.isAuthenticated
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Signed In Customer',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: SiragroColors.textMuted,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          auth.user?.email ?? '',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () => context.push('/orders'),
                                icon: const Icon(Icons.receipt_long),
                                label: const Text('My Orders'),
                              ),
                            ),
                            const SizedBox(width: 10),
                            OutlinedButton(
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
                        const Text(
                          'Shopping as Guest',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Sign in or create an account to view your order history and sync your basket.',
                          style: TextStyle(color: SiragroColors.textMuted),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () => context.push('/auth/sign-in'),
                                child: const Text('Sign In'),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => context.push('/auth/register'),
                                child: const Text('Register'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Store & Customer Care',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: SiragroColors.textMuted,
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.local_shipping_outlined),
                  title: const Text('Delivery & Collection Info'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/support/delivery'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.storefront_outlined),
                  title: const Text('About SIRAGRO'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/support/about'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.phone_outlined),
                  title: const Text('Contact Store'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/support/contact'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.privacy_tip_outlined),
                  title: const Text('Privacy Policy'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/support/privacy'),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.description_outlined),
                  title: const Text('Terms & Conditions'),
                  trailing: const Icon(Icons.chevron_right),
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
