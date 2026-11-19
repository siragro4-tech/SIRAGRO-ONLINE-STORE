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
    if (!_ready) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: SiragroTheme.light(),
        home: const Scaffold(
          backgroundColor: SiragroColors.brand,
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SiragroLogo(size: 76),
                SizedBox(height: 16),
                Text(
                  'SIRAGRO',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
                ),
                SizedBox(height: 18),
                CircularProgressIndicator(color: Colors.white),
              ],
            ),
          ),
        ),
      );
    }

    return const ProviderScope(
      child: SiragroApp(),
    );
  }
}
