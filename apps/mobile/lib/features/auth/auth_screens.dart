import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme/siragro_theme.dart';
import 'auth_controller.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Customer Sign In')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(SiragroSpacing.lg),
          children: [
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 460),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(SiragroSpacing.lg),
                      decoration: BoxDecoration(
                        color: SiragroColors.brand,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'WELCOME BACK',
                            style: textTheme.labelSmall?.copyWith(
                              color: SiragroColors.brassSoft,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Sign in to SIRAGRO',
                            style: textTheme.headlineMedium?.copyWith(
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'View your order history, saved details, and sync your basket across devices.',
                            style: textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.86),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: SiragroSpacing.lg),
                    if (auth.errorMessage != null) ...[
                      _AuthErrorBanner(message: auth.errorMessage!),
                      const SizedBox(height: SiragroSpacing.md),
                    ],
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(SiragroSpacing.lg),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            TextFormField(
                              controller: _emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.next,
                              decoration: const InputDecoration(
                                labelText: 'Email address',
                                prefixIcon: Icon(Icons.mail_outline_rounded),
                              ),
                              validator: (v) => (v == null || !v.contains('@'))
                                  ? 'Enter a valid email'
                                  : null,
                            ),
                            const SizedBox(height: SiragroSpacing.md),
                            TextFormField(
                              controller: _passwordCtrl,
                              obscureText: _obscure,
                              textInputAction: TextInputAction.done,
                              decoration: InputDecoration(
                                labelText: 'Password',
                                prefixIcon: const Icon(Icons.lock_outline_rounded),
                                suffixIcon: IconButton(
                                  tooltip: _obscure ? 'Show password' : 'Hide password',
                                  onPressed: () =>
                                      setState(() => _obscure = !_obscure),
                                  icon: Icon(
                                    _obscure
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined,
                                  ),
                                ),
                              ),
                              validator: (v) => (v == null || v.isEmpty)
                                  ? 'Enter your password'
                                  : null,
                            ),
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton(
                                onPressed: () =>
                                    context.push('/auth/forgot-password'),
                                child: const Text('Forgot password?'),
                              ),
                            ),
                            const SizedBox(height: SiragroSpacing.xs),
                            ElevatedButton(
                              onPressed: auth.isLoading
                                  ? null
                                  : () async {
                                      if (!_formKey.currentState!.validate()) {
                                        return;
                                      }
                                      final ok = await ref
                                          .read(authControllerProvider.notifier)
                                          .signIn(
                                            email: _emailCtrl.text,
                                            password: _passwordCtrl.text,
                                          );
                                      if (ok && context.mounted) {
                                        context.go('/account');
                                      }
                                    },
                              child: Text(auth.isLoading ? 'Signing in…' : 'Sign In'),
                            ),
                            const SizedBox(height: SiragroSpacing.sm),
                            OutlinedButton(
                              onPressed: () => context.push('/auth/register'),
                              child: const Text('Create a Customer Account'),
                            ),
                          ],
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
    );
  }
}

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _firstCtrl.dispose();
    _lastCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(SiragroSpacing.lg),
          children: [
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 460),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Join SIRAGRO',
                      style: textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Create a customer account to track orders and save your basket.',
                      style: textTheme.bodyMedium?.copyWith(
                        color: SiragroColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: SiragroSpacing.lg),
                    if (auth.errorMessage != null) ...[
                      _AuthErrorBanner(message: auth.errorMessage!),
                      const SizedBox(height: SiragroSpacing.md),
                    ],
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(SiragroSpacing.lg),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _firstCtrl,
                                    textInputAction: TextInputAction.next,
                                    decoration: const InputDecoration(
                                      labelText: 'First name',
                                    ),
                                    validator: (v) =>
                                        (v == null || v.trim().isEmpty)
                                            ? 'Required'
                                            : null,
                                  ),
                                ),
                                const SizedBox(width: SiragroSpacing.sm),
                                Expanded(
                                  child: TextFormField(
                                    controller: _lastCtrl,
                                    textInputAction: TextInputAction.next,
                                    decoration: const InputDecoration(
                                      labelText: 'Last name',
                                    ),
                                    validator: (v) =>
                                        (v == null || v.trim().isEmpty)
                                            ? 'Required'
                                            : null,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: SiragroSpacing.md),
                            TextFormField(
                              controller: _emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.next,
                              decoration: const InputDecoration(
                                labelText: 'Email address',
                                prefixIcon: Icon(Icons.mail_outline_rounded),
                              ),
                              validator: (v) => (v == null || !v.contains('@'))
                                  ? 'Valid email required'
                                  : null,
                            ),
                            const SizedBox(height: SiragroSpacing.md),
                            TextFormField(
                              controller: _passwordCtrl,
                              obscureText: _obscure,
                              textInputAction: TextInputAction.done,
                              decoration: InputDecoration(
                                labelText: 'Password (min 8 chars)',
                                prefixIcon: const Icon(Icons.lock_outline_rounded),
                                suffixIcon: IconButton(
                                  tooltip: _obscure ? 'Show password' : 'Hide password',
                                  onPressed: () =>
                                      setState(() => _obscure = !_obscure),
                                  icon: Icon(
                                    _obscure
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined,
                                  ),
                                ),
                              ),
                              validator: (v) => (v == null || v.length < 8)
                                  ? 'Password must be at least 8 characters'
                                  : null,
                            ),
                            const SizedBox(height: SiragroSpacing.lg),
                            ElevatedButton(
                              onPressed: auth.isLoading
                                  ? null
                                  : () async {
                                      if (!_formKey.currentState!.validate()) {
                                        return;
                                      }
                                      final ok = await ref
                                          .read(authControllerProvider.notifier)
                                          .register(
                                            firstName: _firstCtrl.text,
                                            lastName: _lastCtrl.text,
                                            email: _emailCtrl.text,
                                            password: _passwordCtrl.text,
                                          );
                                      if (ok && context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(
                                            content: Text(
                                              'Account created. Check your email if verification is required.',
                                            ),
                                          ),
                                        );
                                        context.go('/account');
                                      }
                                    },
                              child: Text(
                                auth.isLoading ? 'Creating…' : 'Create Account',
                              ),
                            ),
                          ],
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
    );
  }
}

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _sent = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Reset Password')),
      body: ListView(
        padding: const EdgeInsets.all(SiragroSpacing.lg),
        children: [
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(SiragroSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Recover your password', style: textTheme.titleLarge),
                      const SizedBox(height: 6),
                      Text(
                        'Enter your account email and we will send a password recovery link.',
                        style: textTheme.bodyMedium?.copyWith(
                          color: SiragroColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: SiragroSpacing.md),
                      TextField(
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email address',
                          prefixIcon: Icon(Icons.mail_outline_rounded),
                        ),
                      ),
                      const SizedBox(height: SiragroSpacing.md),
                      if (_sent)
                        Container(
                          padding: const EdgeInsets.all(SiragroSpacing.md),
                          decoration: BoxDecoration(
                            color: SiragroColors.sageSoft,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: SiragroColors.sage.withValues(alpha: 0.25),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.mark_email_read_outlined,
                                color: SiragroColors.sage,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  'If an account exists for that email, a password reset link has been sent.',
                                  style: textTheme.bodyMedium?.copyWith(
                                    color: SiragroColors.sage,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        ElevatedButton(
                          onPressed: auth.isLoading
                              ? null
                              : () async {
                                  final ok = await ref
                                      .read(authControllerProvider.notifier)
                                      .sendPasswordReset(_emailCtrl.text);
                                  if (ok && mounted) {
                                    setState(() => _sent = true);
                                  }
                                },
                          child: Text(
                            auth.isLoading ? 'Sending…' : 'Send Reset Link',
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthErrorBanner extends StatelessWidget {
  final String message;

  const _AuthErrorBanner({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(SiragroSpacing.md),
      decoration: BoxDecoration(
        color: SiragroColors.accentRed.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: SiragroColors.accentRed.withValues(alpha: 0.25),
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: SiragroColors.accentRed),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: SiragroColors.accentRed,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
