import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../app/theme/siragro_theme.dart';
import '../../shared/widgets/siragro_logo.dart';

/// Expressive, one-shot Flutter brand intro that plays immediately after the
/// static native OS splash while app initialization runs concurrently.
///
/// - Uses the official SIRAGRO circular logo intact (never stretched or redrawn).
/// - Contains no invented taglines, fake progress bars, or spinners.
/// - Respects reduced-motion accessibility settings and stops cleanly on finish.
class SiragroAnimatedIntro extends StatefulWidget {
  final VoidCallback onCompleted;

  const SiragroAnimatedIntro({
    super.key,
    required this.onCompleted,
  });

  @override
  State<SiragroAnimatedIntro> createState() => _SiragroAnimatedIntroState();
}

class _SiragroAnimatedIntroState extends State<SiragroAnimatedIntro>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  bool _completed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1150),
    );
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed && !_completed) {
        _completed = true;
        widget.onCompleted();
      }
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_completed) return;

    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    if (reduceMotion) {
      _completed = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) widget.onCompleted();
      });
    } else if (!_controller.isAnimating && _controller.value == 0) {
      _controller.forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SiragroColors.brand,
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(0, -0.1),
            radius: 1.15,
            colors: [
              SiragroColors.brandLight,
              SiragroColors.brand,
              SiragroColors.brandDarker,
            ],
            stops: [0.0, 0.55, 1.0],
          ),
        ),
        child: Center(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              final t = _controller.value;

              // Layered curves
              final arcProgress = Curves.easeOutCubic.transform(
                (t / 0.72).clamp(0.0, 1.0),
              );
              final logoScale = Curves.easeOutBack.transform(
                (t / 0.55).clamp(0.0, 1.0),
              );
              final logoOpacity = Curves.easeOut.transform(
                (t / 0.32).clamp(0.0, 1.0),
              );
              final sheenProgress = ((t - 0.30) / 0.45).clamp(0.0, 1.0);
              final wordmarkProgress = Curves.easeOutCubic.transform(
                ((t - 0.42) / 0.42).clamp(0.0, 1.0),
              );

              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 196,
                    height: 196,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Subtle glowing depth halo
                        Opacity(
                          opacity: logoOpacity * 0.35,
                          child: Container(
                            width: 148,
                            height: 148,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.white.withValues(alpha: 0.25),
                                  blurRadius: 36,
                                  spreadRadius: 4,
                                ),
                                BoxShadow(
                                  color: SiragroColors.brass.withValues(alpha: 0.22),
                                  blurRadius: 48,
                                  spreadRadius: 8,
                                ),
                              ],
                            ),
                          ),
                        ),
                        // Animated brand-colour orbital arcs
                        CustomPaint(
                          size: const Size(196, 196),
                          painter: _BrandArcsPainter(progress: arcProgress),
                        ),
                        // Official SIRAGRO logo reveal + sweeping light sheen
                        Opacity(
                          opacity: logoOpacity,
                          child: Transform.scale(
                            scale: 0.78 + (0.22 * logoScale),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                const SiragroLogo(size: 112),
                                if (sheenProgress > 0 && sheenProgress < 1)
                                  ClipOval(
                                    child: SizedBox(
                                      width: 112,
                                      height: 112,
                                      child: Transform.translate(
                                        offset: Offset(
                                          -140 + (280 * sheenProgress),
                                          0,
                                        ),
                                        child: Transform.rotate(
                                          angle: math.pi / 6,
                                          child: Container(
                                            width: 44,
                                            height: 160,
                                            decoration: BoxDecoration(
                                              gradient: LinearGradient(
                                                colors: [
                                                  Colors.white.withValues(alpha: 0.0),
                                                  Colors.white.withValues(alpha: 0.42),
                                                  Colors.white.withValues(alpha: 0.0),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  // Confident bold SIRAGRO wordmark
                  Opacity(
                    opacity: wordmarkProgress,
                    child: Transform.translate(
                      offset: Offset(0, 12 * (1 - wordmarkProgress)),
                      child: const Text(
                        'SIRAGRO',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 30,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 4.5,
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _BrandArcsPainter extends CustomPainter {
  final double progress;

  const _BrandArcsPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0) return;

    final center = Offset(size.width / 2, size.height / 2);

    final outerPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.28 * progress)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round;

    final innerBrassPaint = Paint()
      ..color = SiragroColors.brassSoft.withValues(alpha: 0.70 * progress)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.4
      ..strokeCap = StrokeCap.round;

    final outerRect = Rect.fromCircle(center: center, radius: 84);
    final innerRect = Rect.fromCircle(center: center, radius: 72);

    final sweepOuter = math.pi * 1.45 * progress;
    final sweepInner = math.pi * 1.15 * progress;

    canvas.drawArc(
      outerRect,
      -math.pi * 0.75 + (progress * 0.4),
      sweepOuter,
      false,
      outerPaint,
    );
    canvas.drawArc(
      innerRect,
      math.pi * 0.25 - (progress * 0.35),
      sweepInner,
      false,
      innerBrassPaint,
    );
  }

  @override
  bool shouldRepaint(_BrandArcsPainter oldDelegate) =>
      oldDelegate.progress != progress;
}
