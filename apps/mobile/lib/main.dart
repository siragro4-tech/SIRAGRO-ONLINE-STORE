import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'app/app.dart';
import 'app/theme/siragro_theme.dart';
import 'core/config/app_config.dart';
import 'core/widgets/siragro_intro.dart';

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
  bool _initDone = false;
  bool _introDone = false;

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
      setState(() => _initDone = true);
    }
  }

  void _onIntroComplete() {
    if (mounted && !_introDone) {
      setState(() => _introDone = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    final ready = _initDone && _introDone;

    return AnimatedSwitcher(
      duration: reduceMotion ? Duration.zero : const Duration(milliseconds: 240),
      child: !ready
          ? MaterialApp(
              key: const ValueKey('bootstrap-intro'),
              debugShowCheckedModeBanner: false,
              theme: SiragroTheme.light(),
              home: SiragroAnimatedIntro(onCompleted: _onIntroComplete),
            )
          : const ProviderScope(
              key: ValueKey('bootstrap-app'),
              child: SiragroApp(),
            ),
    );
  }
}
