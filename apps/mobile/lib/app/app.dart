import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'router.dart';
import 'theme/siragro_theme.dart';

class SiragroApp extends ConsumerWidget {
  const SiragroApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'SIRAGRO',
      debugShowCheckedModeBanner: false,
      theme: SiragroTheme.light(),
      routerConfig: router,
    );
  }
}
