import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Shared motion helpers that respect the operating system's reduced-motion
/// accessibility preferences.
class SiragroMotion {
  static bool isReduced(BuildContext context) {
    return MediaQuery.disableAnimationsOf(context) ||
        MediaQuery.accessibleNavigationOf(context);
  }

  static Duration duration(
    BuildContext context, {
    Duration normal = const Duration(milliseconds: 260),
  }) {
    return isReduced(context) ? Duration.zero : normal;
  }
}

/// Smooth fade-and-slide transition for pushed screens (product detail, checkout, support).
CustomTransitionPage<T> siragroFadeSlidePage<T>({
  required LocalKey key,
  required Widget child,
}) {
  return CustomTransitionPage<T>(
    key: key,
    child: child,
    transitionDuration: const Duration(milliseconds: 260),
    reverseTransitionDuration: const Duration(milliseconds: 200),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      if (SiragroMotion.isReduced(context)) {
        return child;
      }
      final curved = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
      );
      return FadeTransition(
        opacity: curved,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.03),
            end: Offset.zero,
          ).animate(curved),
          child: child,
        ),
      );
    },
  );
}

/// Staggers initial appearance of cards on screen entry only (never on rebuilds).
class StaggeredEntrance extends StatefulWidget {
  final int index;
  final Widget child;

  const StaggeredEntrance({
    super.key,
    required this.index,
    required this.child,
  });

  @override
  State<StaggeredEntrance> createState() => _StaggeredEntranceState();
}

class _StaggeredEntranceState extends State<StaggeredEntrance>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;
  late final Animation<Offset> _slide;
  bool _hasStarted = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 320),
    );
    final curved = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    );
    _opacity = curved;
    _slide = Tween<Offset>(
      begin: const Offset(0, 0.05),
      end: Offset.zero,
    ).animate(curved);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_hasStarted) return;
    _hasStarted = true;

    if (SiragroMotion.isReduced(context)) {
      _controller.value = 1.0;
      return;
    }

    final delayMs = (widget.index.clamp(0, 8)) * 45;
    Future<void>.delayed(Duration(milliseconds: delayMs), () {
      if (mounted) {
        _controller.forward();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: SlideTransition(
        position: _slide,
        child: widget.child,
      ),
    );
  }
}
