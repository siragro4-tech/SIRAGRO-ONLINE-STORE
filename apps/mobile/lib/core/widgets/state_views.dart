import 'package:flutter/material.dart';
import '../../app/theme/siragro_theme.dart';
import 'motion.dart';

class LoadingStateView extends StatelessWidget {
  final String message;

  const LoadingStateView({super.key, this.message = 'Loading…'});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 2.6,
                color: SiragroColors.brand,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: SiragroColors.textMuted,
                    fontWeight: FontWeight.w600,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

/// Calm warm-stone skeleton grid for product loading states.
class SkeletonProductGrid extends StatefulWidget {
  final int itemCount;

  const SkeletonProductGrid({super.key, this.itemCount = 6});

  @override
  State<SkeletonProductGrid> createState() => _SkeletonProductGridState();
}

class _SkeletonProductGridState extends State<SkeletonProductGrid>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
      lowerBound: 0.45,
      upperBound: 1.0,
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (SiragroMotion.isReduced(context)) {
      _pulseController.value = 0.75;
    } else if (!_pulseController.isAnimating) {
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final cols = width >= 900 ? 4 : width >= 600 ? 3 : 2;
        return FadeTransition(
          opacity: _pulseController,
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: cols,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.64,
            ),
            itemCount: widget.itemCount,
            itemBuilder: (_, __) => Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: SiragroColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: SiragroColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: SiragroColors.surfaceWarm,
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    height: 10,
                    width: 64,
                    decoration: BoxDecoration(
                      color: SiragroColors.surfaceWarm,
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    height: 14,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: SiragroColors.surfaceWarm,
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        height: 18,
                        width: 52,
                        decoration: BoxDecoration(
                          color: SiragroColors.surfaceWarm,
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                      Container(
                        height: 36,
                        width: 44,
                        decoration: BoxDecoration(
                          color: SiragroColors.surfaceWarm,
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class ErrorRetryView extends StatelessWidget {
  final String title;
  final String message;
  final VoidCallback onRetry;

  const ErrorRetryView({
    super.key,
    this.title = 'Unable to load',
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 380),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: const BoxDecoration(
                      color: SiragroColors.surfaceWarm,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.cloud_off_rounded,
                      size: 28,
                      color: SiragroColors.brand,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    message,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: SiragroColors.textMuted,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: onRetry,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Try Again'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class EmptyStateView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? action;

  const EmptyStateView({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 380),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: const BoxDecoration(
                      color: SiragroColors.surfaceWarm,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, size: 30, color: SiragroColors.brand),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: SiragroColors.textMuted,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  if (action != null) ...[
                    const SizedBox(height: 20),
                    SizedBox(width: double.infinity, child: action!),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
