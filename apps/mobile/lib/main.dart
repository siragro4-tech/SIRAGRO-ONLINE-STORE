import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'app/app.dart';
import 'app/theme/siragro_theme.dart';
import 'core/config/app_config.dart';
import 'shared/widgets/siragro_logo.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const _BootstrapApp());
}

class _BootstrapApp extends StatefulWidget {
  const _BootstrapApp();

  @override
  State<_BootstrapApp> createState() => _BootstrapAppState();
}

class _BootstrapAppState extends State<_BootstrapApp> {
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final config = AppConfig.fromEnvironment();
    if (config.isSupabaseConfigured) {
      await Supabase.initialize(
        url: config.supabaseUrl,
        anonKey: config.supabaseAnonKey,
      );
    }
    if (mounted) {
      setState(() => _ready = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 260),
      child: !_ready
          ? MaterialApp(
              key: const ValueKey('bootstrap-splash'),
              debugShowCheckedModeBanner: false,
              theme: SiragroTheme.light(),
              home: Scaffold(
                backgroundColor: SiragroColors.brand,
                body: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SiragroLogo(size: 80),
                      const SizedBox(height: 16),
                      const Text(
                        'SIRAGRO',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.6,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'FRESH GROCERY • HAYES',
                        style: TextStyle(
                          color: SiragroColors.brassSoft,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.4,
                        ),
                      ),
                      const SizedBox(height: 22),
                      const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.2,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
          : const ProviderScope(
              key: ValueKey('bootstrap-app'),
              child: SiragroApp(),
            ),
    );
  }
}
