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
                      Text(
                        auth.user?.email ?? '',
                        style: textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                        ),
                      ),
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
                        'Sign in or create an account to view your order history and sync your basket.',
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
