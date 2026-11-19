import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../app/theme/siragro_theme.dart';

class StoreInfoScreen extends StatelessWidget {
  final String title;
  final List<Widget> sections;

  const StoreInfoScreen({
    super.key,
    required this.title,
    required this.sections,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: sections,
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
      sections: [
        _InfoCard(
          heading: 'SIRAGRO Supermarket & Off-Licence',
          body:
              'Conveniently situated at 147 North Hyde Road, Hayes, Middlesex (UB3 4NS), SIRAGRO is a full-service neighbourhood supermarket and fully licensed off-licence serving the Hayes, Southall, and UB3 community.',
        ),
        SizedBox(height: 12),
        _InfoCard(
          heading: 'Challenge 25 & Licensed Off-Licence',
          body:
              'Under the Licensing Act 2003, it is an offence to sell alcohol to anyone under 18. We strictly enforce Challenge 25 — valid photo ID is required on collection or delivery.',
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
      sections: [
        const _InfoCard(
          heading: 'Store Address',
          body: 'SIRAGRO Supermarket & Off-Licence\n147 North Hyde Road\nHayes, Middlesex\nUB3 4NS',
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.phone, color: SiragroColors.brand),
                title: const Text('020 8813 6458'),
                subtitle: const Text('Tap to call store'),
                onTap: () => launchUrl(Uri.parse('tel:02088136458')),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.phone, color: SiragroColors.brand),
                title: const Text('0208 848 4840'),
                subtitle: const Text('Tap to call store'),
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
      sections: [
        _InfoCard(
          heading: 'In-Store Collection',
          body:
              'Free counter pickup from 147 North Hyde Road, Hayes UB3 4NS when collection is enabled in store settings.',
        ),
        SizedBox(height: 12),
        _InfoCard(
          heading: 'Local Home Delivery',
          body:
              'Home delivery coverage is evaluated strictly on the server from our shop postcode (UB3 4NS) up to 5 miles. Home delivery checkout remains paused until exact delivery charges and boundary rules are confirmed by the store.',
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
      sections: [
        _InfoCard(
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
      sections: [
        _InfoCard(
          heading: 'Orders & Challenge 25',
          body:
              'All orders are subject to availability and server-verified pricing in GBP (£). Age-restricted products require physical photo ID verification under Challenge 25 upon collection or delivery.',
        ),
      ],
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String heading;
  final String body;

  const _InfoCard({required this.heading, required this.body});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              heading,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: SiragroColors.brand,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              body,
              style: const TextStyle(
                fontSize: 14,
                height: 1.5,
                color: SiragroColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
