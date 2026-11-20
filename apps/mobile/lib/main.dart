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
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;

    return AnimatedSwitcher(
      duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 220),
      child: !_ready
          ? MaterialApp(
              key: const ValueKey('bootstrap-splash'),
              debugShowCheckedModeBanner: false,
              theme: SiragroTheme.light(),
              home: const Scaffold(
                backgroundColor: SiragroColors.brand,
                body: Center(
                  child: SiragroLogo(size: 96),
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
