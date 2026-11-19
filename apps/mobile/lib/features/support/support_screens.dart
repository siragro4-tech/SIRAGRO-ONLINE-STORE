import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../app/theme/siragro_theme.dart';
import '../../shared/widgets/siragro_logo.dart';

class StoreInfoScreen extends StatelessWidget {
  final String title;
  final String eyebrow;
  final String headline;
  final String lead;
  final List<Widget> sections;

  const StoreInfoScreen({
    super.key,
    required this.title,
    required this.eyebrow,
    required this.headline,
    required this.lead,
    required this.sections,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ListView(
        children: [
          Container(
            color: SiragroColors.brand,
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 26),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 680),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const SiragroLogo(size: 36),
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            eyebrow,
                            style: const TextStyle(
                              color: SiragroColors.brassTint,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      headline,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.3,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      lead,
                      style: const TextStyle(
                        color: Color(0xFFDCE3EC),
                        fontSize: 14,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 680),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 36),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: sections,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class AboutSiragroScreen extends StatelessWidget {
  const AboutSiragroScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const StoreInfoScreen(
      title: 'About SIRAGRO',
      eyebrow: 'ABOUT SIRAGRO',
      headline: 'Your Neighbourhood Supermarket & Off-Licence',
      lead:
          'Serving the Hayes, Southall, and UB3 community with daily fresh produce, grocery staples, chilled drinks, and counter services.',
      sections: [
        _EditorialSection(
          icon: Icons.storefront_outlined,
          heading: 'Our Store in Hayes',
          body:
              'Conveniently situated at 147 North Hyde Road, Hayes, Middlesex (UB3 4NS), SIRAGRO is a full-service neighbourhood supermarket and fully licensed off-licence.',
        ),
        SizedBox(height: 14),
        _EditorialSection(
          icon: Icons.eco_outlined,
          heading: 'Fresh Produce & Everyday Staples',
          body:
              'From fresh fruits and vegetables to dairy goods, pantry essentials, chilled beers, world wines, and spirits, our shelves are stocked for convenient local shopping.',
        ),
        SizedBox(height: 14),
        _EditorialSection(
          icon: Icons.verified_user_outlined,
          heading: 'Challenge 25 & Responsible Retailing',
          body:
              'Under the Licensing Act 2003, it is an offence to sell alcohol to anyone under 18. We strictly enforce Challenge 25 — valid photo ID is required on collection or delivery.',
          accentColor: SiragroColors.accentRed,
        ),
      ],
    );
  }
}

class ContactSiragroScreen extends StatelessWidget {
  const ContactSiragroScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return StoreInfoScreen(
      title: 'Contact Store',
      eyebrow: 'HAYES STORE',
      headline: 'Visit or Call SIRAGRO',
      lead:
          'Reach our store counter team directly by phone or visit us in person at 147 North Hyde Road.',
      sections: [
        const _EditorialSection(
          icon: Icons.location_on_outlined,
          heading: 'Store Address',
          body:
              'SIRAGRO Supermarket & Off-Licence\n147 North Hyde Road\nHayes, Middlesex\nUB3 4NS',
        ),
        const SizedBox(height: 14),
        Card(
          child: Column(
            children: [
              ListTile(
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
                leading: const CircleAvatar(
                  backgroundColor: SiragroColors.surfaceWarm,
                  child: Icon(Icons.phone_outlined, color: SiragroColors.brand),
                ),
                title: const Text(
                  '020 8813 6458',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
                subtitle: const Text('Tap to call store'),
                trailing: const Icon(Icons.call_made_rounded, size: 18),
                onTap: () => launchUrl(Uri.parse('tel:02088136458')),
              ),
              const Divider(height: 1),
              ListTile(
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
                leading: const CircleAvatar(
                  backgroundColor: SiragroColors.surfaceWarm,
                  child: Icon(Icons.phone_outlined, color: SiragroColors.brand),
                ),
                title: const Text(
                  '0208 848 4840',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
                subtitle: const Text('Tap to call store'),
                trailing: const Icon(Icons.call_made_rounded, size: 18),
                onTap: () => launchUrl(Uri.parse('tel:02088484840')),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class DeliveryInfoScreen extends StatelessWidget {
  const DeliveryInfoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const StoreInfoScreen(
      title: 'Delivery & Collection Info',
      eyebrow: 'FULFILMENT & COVERAGE',
      headline: 'Collection & Local Delivery',
      lead:
          'Fulfilment options are verified directly by the store server so you only see available options at checkout.',
      sections: [
        _EditorialSection(
          icon: Icons.shopping_bag_outlined,
          heading: 'In-Store Collection',
          body:
              'Free counter pickup from 147 North Hyde Road, Hayes UB3 4NS when collection is enabled in store settings.',
          accentColor: SiragroColors.sage,
        ),
        SizedBox(height: 14),
        _EditorialSection(
          icon: Icons.local_shipping_outlined,
          heading: 'Local Home Delivery',
          body:
              'Home delivery coverage is evaluated strictly on the server from our shop postcode (UB3 4NS) up to 5 miles. Home delivery checkout remains paused until exact delivery charges and boundary rules are confirmed by the store.',
          accentColor: SiragroColors.brass,
        ),
      ],
    );
  }
}

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const StoreInfoScreen(
      title: 'Privacy Policy',
      eyebrow: 'DATA & PRIVACY',
      headline: 'How SIRAGRO Protects Your Information',
      lead:
          'We collect only the details needed to prepare, verify, and fulfil your grocery orders.',
      sections: [
        _EditorialSection(
          icon: Icons.lock_outline_rounded,
          heading: 'Your Data & Security',
          body:
              'SIRAGRO collects only the contact, delivery, and order information required to fulfil your grocery orders. Card payments are processed securely by Stripe; SIRAGRO never stores payment card numbers.',
        ),
      ],
    );
  }
}

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const StoreInfoScreen(
      title: 'Terms & Conditions',
      eyebrow: 'STORE TERMS',
      headline: 'Orders, Pricing & Challenge 25',
      lead:
          'Clear terms for shopping online with SIRAGRO Supermarket & Off-Licence.',
      sections: [
        _EditorialSection(
          icon: Icons.gavel_outlined,
          heading: 'Pricing & Availability',
          body:
              'All orders are subject to availability and server-verified pricing in GBP (£). If requested stock is unavailable, we never substitute or reduce quantities without your explicit confirmation.',
        ),
        SizedBox(height: 14),
        _EditorialSection(
          icon: Icons.badge_outlined,
          heading: 'Challenge 25 Age Verification',
          body:
              'Age-restricted products require physical photo ID verification under Challenge 25 upon collection or delivery.',
          accentColor: SiragroColors.accentRed,
        ),
      ],
    );
  }
}

class _EditorialSection extends StatelessWidget {
  final IconData icon;
  final String heading;
  final String body;
  final Color accentColor;

  const _EditorialSection({
    required this.icon,
    required this.heading,
    required this.body,
    this.accentColor = SiragroColors.brand,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: accentColor, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    heading,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: SiragroColors.brandDark,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              height: 2,
              width: 36,
              decoration: BoxDecoration(
                color: SiragroColors.brass.withValues(alpha: 0.55),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              body,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: SiragroColors.textPrimary,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
